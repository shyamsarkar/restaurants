# frozen_string_literal: true

class Api::V1::ProductsController < ApplicationController
  def index
    authorize! :read, Product
    render json: current_tenant.products.order(:id).as_json(include: :inventory)
  end

  def show
    authorize! :read, product
    render json: product.as_json(include: :inventory)
  end

  def create
    authorize! :create, Product
    tenant_product = current_tenant.products.new(product_params)

    if tenant_product.save
      render json: tenant_product.as_json(include: :inventory), status: :created
    else
      render json: { errors: tenant_product.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    authorize! :update, product
    if product.update(product_params)
      render json: product.as_json(include: :inventory)
    else
      render json: { errors: product.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    authorize! :destroy, product
    product.destroy!
    head :no_content
  end

  private

  def product
    @product ||= current_tenant.products.find(params[:id])
  end

  def current_tenant
    Current.tenant
  end

  def product_params
    permitted = if params[:product].present?
                  params.require(:product).permit(:name, :price, :gst_rate, :image_path, :is_available, :category_id)
                else
                  params.permit(:name, :price, :gst_rate, :image_path, :is_available, :category_id)
                end

    if permitted[:category_id].present? && !current_tenant.categories.exists?(id: permitted[:category_id])
      raise ActiveRecord::RecordNotFound, 'Category not found'
    end

    permitted
  end
end
