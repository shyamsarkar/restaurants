# frozen_string_literal: true

class Api::V1::OrdersController < ApplicationController
  def index
    authorize! :read, Order
    status_filter = params[:status] || 'pending'
    # map old pending query status to active
    db_status = (status_filter == 'pending' || status_filter == 'active') ? :active : status_filter.to_sym

    orders = current_tenant.orders.where(status: db_status).order(updated_at: :desc)
    
    if params[:order_type].present?
      orders = orders.where(order_type: params[:order_type])
    end

    render json: orders.as_json(include: [:dining_table, :customer])
  end

  def show
    authorize! :read, order
    render json: order_with_items_json(order)
  end

  def create
    authorize! :create, Order
    
    order = current_tenant.orders.new(order_params)
    order.user = current_user
    order.status = :draft
    order.total = 0.0

    if order.save
      if order.dining_table
        # Table must transition to occupied upon draft order creation
        order.dining_table.update!(status: :occupied, current_order_id: order.id)
      end
      render json: order_with_items_json(order), status: :created
    else
      render json: { errors: order.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    authorize! :update, order
    if order.update(order_params)
      order.recalculate_totals!
      render json: order_with_items_json(order)
    else
      render json: { errors: order.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def kot
    authorize! :update, order
    OrderService.transition_to_active!(order)
    render json: order_with_items_json(order)
  rescue OrderService::ServiceError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end



  def pay
    authorize! :pay, order
    payment_mode_val = params[:payment_mode].to_s.downcase
    mode = case payment_mode_val
           when 'cash' then :cash
           when 'upi' then :upi
           when 'card' then :card
           when 'mixed' then :mixed
           when 'nc' then :nc
           else :none
           end

    discount_pct = params[:discount].to_f
    service_charge_pct = params[:service_charge].to_f
    notes = params[:notes]

    OrderService.complete_payment!(order, mode, discount_pct, service_charge_pct, notes)
    
    render json: order_with_items_json(order)
  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def cancel
    authorize! :cancel, order
    reason = params[:reason] || "User requested cancel"
    OrderService.cancel_order!(order, reason, current_user.email)
    
    render json: order_with_items_json(order)
  rescue StandardError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  private

  def order
    @order ||= current_tenant.orders.find(params[:id])
  end

  def current_tenant
    Current.tenant
  end

  def order_params
    permitted_fields = [:dining_table_id, :customer_id, :notes, :discount, :service_charge, :order_type]
    if params[:order].present?
      params.require(:order).permit(permitted_fields)
    else
      params.permit(permitted_fields)
    end
  end

  def order_with_items_json(ord)
    ord.as_json(
      include: {
        order_items: {
          include: :product
        },
        dining_table: {},
        customer: {}
      }
    )
  end
end
