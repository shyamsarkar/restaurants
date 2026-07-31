# frozen_string_literal: true

class Api::V1::ReportsController < ApplicationController
  def index
    # Only managers, admins, and owners can manage AuditLog and view reports
    authorize! :manage, AuditLog

    start_date = params[:start_date] ? Time.zone.parse(params[:start_date]).beginning_of_day : 30.days.ago.beginning_of_day
    end_date = params[:end_date] ? Time.zone.parse(params[:end_date]).end_of_day : Time.current.end_of_day

    orders = current_tenant.orders.where(status: :completed, updated_at: start_date..end_date)

    total_revenue = orders.sum(:total)
    total_orders = orders.count
    total_tax = orders.sum(:tax)
    
    total_discount = orders.sum("subtotal * (discount / 100.0)")

    payment_modes = orders.group(:payment_mode).sum(:total)
    payment_modes_breakdown = payment_modes.map do |mode_int, revenue|
      {
        mode: Order.payment_modes.key(mode_int).to_s.upcase,
        revenue: revenue.to_f
      }
    end

    category_data = OrderItem.joins(product: :category)
                             .joins(:order)
                             .where(orders: { tenant_id: current_tenant.id, status: Order.statuses[:completed], updated_at: start_date..end_date })
                             .group('categories.name')
                             .sum('order_items.price * order_items.quantity')

    category_breakdown = category_data.map do |cat_name, revenue|
      {
        category: cat_name,
        revenue: revenue.to_f
      }
    end

    render json: {
      metrics: {
        total_revenue: total_revenue.to_f,
        total_orders: total_orders,
        total_tax: total_tax.to_f,
        total_discount: total_discount.to_f
      },
      payment_modes: payment_modes_breakdown,
      categories: category_breakdown
    }
  end

  private

  def current_tenant
    Current.tenant
  end
end
