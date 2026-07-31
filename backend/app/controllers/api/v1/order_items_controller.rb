# frozen_string_literal: true

class Api::V1::OrderItemsController < ApplicationController
  def index
    if params[:dining_table_id].present?
      dining_table = current_tenant.dining_tables.find(params[:dining_table_id])
      order = current_tenant.orders.find_by(dining_table_id: dining_table.id, status: [:draft, :active])
    elsif params[:order_id].present?
      order = current_tenant.orders.find(params[:order_id])
    end

    if order
      authorize! :read, order
      render json: {
        order_id: order.id,
        order_items: order.order_items.map { |oi| serialize_order_item(oi) }
      }
    else
      render json: { order_id: nil, order_items: [] }
    end
  end

  def create
    order_item = nil
    ActiveRecord::Base.transaction do
      order = nil
      if create_params[:dining_table_id].present?
        dining_table = current_tenant.dining_tables.find(create_params[:dining_table_id])
        order = current_tenant.orders.find_or_create_by!(dining_table_id: dining_table.id, status: [:draft, :active]) do |new_order|
          new_order.user = current_user
          new_order.status = :draft
          new_order.total = 0.0
        end
        if dining_table.current_order_id.blank?
          dining_table.update!(status: :occupied, current_order_id: order.id)
        end
      elsif create_params[:order_id].present?
        order = current_tenant.orders.find(create_params[:order_id])
      end

      raise ActiveRecord::RecordNotFound, "Active Order not found" unless order
      authorize! :update, order

      product = current_tenant.products.find(create_params.dig(:order_item, :product_id))
      quantity = (create_params.dig(:order_item, :quantity) || 1).to_i
      price = create_params.dig(:order_item, :price) || product.price

      order_item = OrderService.add_item_to_order!(order, product, quantity, price, create_params.dig(:order_item, :notes))
    end

    render json: serialize_order_item(order_item), status: :created
  rescue ActiveRecord::RecordNotFound => e
    render json: { error: e.message }, status: :not_found
  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def update
    order_item = current_tenant_order_item
    authorize! :update, order_item.order

    if order_item.kot_id.present?
      render json: { error: 'Sent items are immutable. Use cancellation endpoint instead.' }, status: :unprocessable_entity
      return
    end

    ActiveRecord::Base.transaction do
      new_qty = update_params[:quantity].to_i
      order_item.update!(quantity: new_qty)
      order_item.order.recalculate_totals!
    end

    render json: serialize_order_item(order_item).merge(total_price: order_item.order.total), status: :ok
  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def destroy
    order_item = current_tenant_order_item
    authorize! :update, order_item.order

    if order_item.kot_id.present?
      render json: { error: 'Sent items cannot be deleted. Use cancellation endpoint instead.' }, status: :unprocessable_entity
      return
    end

    order = order_item.order
    ActiveRecord::Base.transaction do
      order_item.destroy!
      order.recalculate_totals!
    end

    render json: { id: params[:id], order_id: order.id, total_price: order.total }, status: :ok
  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def cancel
    order_item = current_tenant_order_item
    authorize! :cancel, order_item.order

    quantity = params[:quantity].to_i
    reason = params[:reason] || "User requested cancel"

    OrderService.cancel_item!(order_item, quantity, reason, current_user.email)

    render json: { success: true, order_item: serialize_order_item(order_item), total_price: order_item.order.total }
  rescue OrderService::ServiceError => e
    render json: { error: e.message }, status: :unprocessable_entity
  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  private

  def current_tenant
    Current.tenant
  end

  def current_tenant_order_item
    OrderItem.joins(:order).where(orders: { tenant_id: current_tenant.id }).find(params[:id])
  end

  def serialize_order_item(oi)
    {
      id: oi.id,
      order_id: oi.order_id,
      product_id: oi.product_id,
      name: oi.name || oi.product.name,
      quantity: oi.quantity,
      price: oi.price,
      gst_rate: oi.gst_rate,
      notes: oi.notes,
      kot_id: oi.kot_id
    }
  end

  def create_params
    params.permit(:dining_table_id, :order_id, order_item: %i[product_id price quantity notes])
  end

  def update_params
    params.permit(:quantity)
  end
end
