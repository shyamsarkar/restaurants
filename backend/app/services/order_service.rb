# frozen_string_literal: true

class OrderService
  class ServiceError < StandardError; end

  def self.transition_to_active!(order)
    raise ServiceError, "Order is already completed" if order.completed?
    raise ServiceError, "Order is cancelled" if order.cancelled?

    ActiveRecord::Base.transaction do
      order.lock!

      # Find all order items that have not been sent to the kitchen yet
      unsent_items = order.order_items.where(kot_id: nil)
      raise ServiceError, "No unsent items to submit to kitchen" if unsent_items.empty?

      # Create KOT
      kot = Kot.create!(
        tenant_id: order.tenant_id,
        order_id: order.id,
        status: :pending,
        print_count: 0
      )

      unsent_items.each do |item|
        KotItem.create!(
          tenant_id: order.tenant_id,
          kot_id: kot.id,
          product_id: item.product_id,
          quantity: item.quantity,
          notes: item.notes
        )
        item.bypass_kot_immutability = true
        item.update!(kot_id: kot.id)
      end

      # Transition order status to active if it was a draft
      if order.draft?
        order.status = :active
        order.save!
      end

      if order.dining_table
        order.dining_table.update!(status: :occupied, current_order_id: order.id)
      end

      order.recalculate_totals!
    end

    order
  end

  def self.add_item_to_order!(order, product, quantity, price, notes = nil)
    ActiveRecord::Base.transaction do
      order.lock!
      raise ServiceError, "Order is completed" if order.completed?
      raise ServiceError, "Order is cancelled" if order.cancelled?

      # For active/draft orders, we look for an unsent (kot_id is nil) item for this product.
      # Because sent items are immutable, we cannot simply increase their quantity.
      order_item = order.order_items.find_by(product_id: product.id, kot_id: nil)

      if order_item
        order_item.bypass_kot_immutability = true
        order_item.update!(quantity: order_item.quantity + quantity)
      else
        order_item = order.order_items.create!(
          tenant_id: order.tenant_id,
          product_id: product.id,
          name: product.name,
          price: price,
          quantity: quantity,
          gst_rate: product.gst_rate,
          notes: notes,
          kot_id: nil
        )
      end

      order.recalculate_totals!
      order_item
    end
  end

  def self.cancel_item!(order_item, quantity_to_cancel, reason, user_name)
    order = order_item.order
    raise ServiceError, "Quantity to cancel exceeds item quantity" if quantity_to_cancel > order_item.quantity

    ActiveRecord::Base.transaction do
      order.lock!
      raise ServiceError, "Order is already completed" if order.completed?
      raise ServiceError, "Order is already cancelled" if order.cancelled?

      # 1. Create OrderItemCancellation record
      OrderItemCancellation.create!(
        tenant_id: order.tenant_id,
        order_item_id: order_item.id,
        quantity: quantity_to_cancel,
        reason: reason,
        cancelled_by: user_name
      )

      # 2. If it was sent, generate a negative KOT
      if order_item.kot_id.present?
        kot = Kot.create!(
          tenant_id: order.tenant_id,
          order_id: order.id,
          status: :pending,
          print_count: 0
        )

        KotItem.create!(
          tenant_id: order.tenant_id,
          kot_id: kot.id,
          product_id: order_item.product_id,
          quantity: -quantity_to_cancel,
          notes: "CANCELLED (Reason: #{reason})"
        )
      end

      # 3. Update order item quantity
      order_item.bypass_kot_immutability = true
      new_qty = order_item.quantity - quantity_to_cancel
      order_item.update!(quantity: new_qty)

      order.recalculate_totals!
    end
  end

  def self.cancel_order!(order, reason, user_name)
    ActiveRecord::Base.transaction do
      order.lock!
      raise ServiceError, "Order is already completed" if order.completed?
      raise ServiceError, "Order is already cancelled" if order.cancelled?

      order.order_items.each do |item|
        next if item.quantity <= 0

        if item.kot_id.present?
          # Issue negative KOT
          kot = Kot.create!(
            tenant_id: order.tenant_id,
            order_id: order.id,
            status: :pending,
            print_count: 0
          )

          KotItem.create!(
            tenant_id: order.tenant_id,
            kot_id: kot.id,
            product_id: item.product_id,
            quantity: -item.quantity,
            notes: "ORDER CANCELLED (Reason: #{reason})"
          )
        end
      end

      order.update!(
        status: :cancelled,
        cancelled_by: user_name,
        cancelled_at: Time.current,
        cancel_reason: reason
      )

      if order.dining_table
        order.dining_table.update!(status: :free, current_order_id: nil)
      end

      order.recalculate_totals!
    end
  end

  def self.transfer_table!(source_table, target_table)
    raise ServiceError, "Source table has no active order" if source_table.current_order_id.blank?
    raise ServiceError, "Target table is not free" unless target_table.free?

    ActiveRecord::Base.transaction do
      source_table.lock!
      target_table.lock!

      order = source_table.current_order
      order.update!(dining_table_id: target_table.id)

      target_table.update!(status: :occupied, current_order_id: order.id)
      source_table.update!(status: :free, current_order_id: nil)
    end
  end

  def self.merge_tables!(source_table, target_table)
    raise ServiceError, "Source table has no active order" if source_table.current_order_id.blank?
    raise ServiceError, "Target table is free (cannot merge into a free table, use transfer instead)" if target_table.current_order_id.blank?
    raise ServiceError, "Target table must not be merged" if target_table.merged_into_id.present?

    ActiveRecord::Base.transaction do
      source_table.lock!
      target_table.lock!

      source_order = source_table.current_order
      target_order = target_table.current_order

      # Move all order items to target order
      source_order.order_items.each do |item|
        item.bypass_kot_immutability = true
        # If there's an unsent item of the same product in target order, merge their quantities
        if item.kot_id.nil?
          target_item = target_order.order_items.find_by(product_id: item.product_id, kot_id: nil)
          if target_item
            target_item.bypass_kot_immutability = true
            target_item.update!(quantity: target_item.quantity + item.quantity)
            item.destroy!
            next
          end
        end
        item.update!(order_id: target_order.id)
      end

      # Move KOT tickets to target order
      source_order.kots.update_all(order_id: target_order.id)

      # Cancel the source order
      source_order.reload.update!(status: :cancelled, cancel_reason: "Merged into Table #{target_table.name}")

      # Release source table and set status to free
      source_table.update!(
        merged_into_id: target_table.id,
        status: :free,
        current_order_id: nil
      )

      # Recalculate target order totals
      target_order.recalculate_totals!
    end
  end

  def self.complete_payment!(order, payment_mode, discount_pct = 0.0, service_charge_pct = 0.0, notes = nil)
    ActiveRecord::Base.transaction do
      order.lock!
      raise ServiceError, "Order is already completed" if order.completed?
      raise ServiceError, "Order is cancelled" if order.cancelled?

      # 1. Create a KOT for any remaining unsent items before completing
      unsent_items = order.order_items.where(kot_id: nil)
      if unsent_items.any?
        kot = Kot.create!(
          tenant_id: order.tenant_id,
          order_id: order.id,
          status: :pending,
          print_count: 0
        )

        unsent_items.each do |item|
          KotItem.create!(
            tenant_id: order.tenant_id,
            kot_id: kot.id,
            product_id: item.product_id,
            quantity: item.quantity,
            notes: item.notes
          )
          item.bypass_kot_immutability = true
          item.update!(kot_id: kot.id)
        end
      end

      # 2. Update status and payment details
      order.status = :completed
      order.payment_mode = payment_mode
      order.discount = discount_pct
      order.service_charge = service_charge_pct
      order.notes = notes
      order.recalculate_totals!

      # 3. Release dining table
      if order.dining_table
        order.dining_table.update!(status: :free, current_order_id: nil)
      end

      # 4. Loyalty points: 1 point per 100 spent
      if order.customer
        points = (order.total / 100.0).floor
        order.customer.increment!(:loyalty_points, points) if points > 0
      end
    end

    order
  end
end
