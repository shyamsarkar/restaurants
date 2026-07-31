# frozen_string_literal: true

class Api::V1::InventoriesController < ApplicationController
  def index
    inventories = current_tenant.inventories.joins(:product).order('products.name')
    render json: inventories.as_json(include: :product)
  end

  def update
    inventory = current_tenant.inventories.find_by!(product_id: params[:id])
    if inventory.update(inventory_params)
      render json: inventory.as_json(include: :product)
    else
      render json: { errors: inventory.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def purchase
    product = current_tenant.products.find(params[:product_id])
    ActiveRecord::Base.transaction do
      PurchaseHistory.create!(
        tenant_id: current_tenant.id,
        product_id: product.id,
        quantity: params[:quantity].to_i,
        supplier: params[:supplier],
        unit_price: BigDecimal(params[:unit_price].to_s),
        date: params[:date] || Time.current
      )

      inventory = Inventory.find_or_initialize_by(product_id: product.id, tenant_id: current_tenant.id)
      inventory.stock_qty += params[:quantity].to_i
      inventory.save!

      render json: inventory.as_json(include: :product), status: :created
    end
  rescue ActiveRecord::RecordInvalid => e
    render json: { error: e.record.errors.full_messages }, status: :unprocessable_entity
  end

  def history
    histories = current_tenant.purchase_histories.includes(:product).order(date: :desc)
    render json: histories.as_json(include: :product)
  end

  private

  def inventory_params
    if params[:inventory].present?
      params.require(:inventory).permit(:stock_qty, :low_stock_threshold)
    else
      params.permit(:stock_qty, :low_stock_threshold)
    end
  end

  def current_tenant
    Current.tenant
  end
end
