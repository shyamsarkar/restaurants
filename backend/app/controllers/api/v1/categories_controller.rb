# frozen_string_literal: true

class Api::V1::CategoriesController < ApplicationController
  def index
    authorize! :read, Category
    render json: current_tenant.categories.order(:id)
  end

  def show
    authorize! :read, category
    render json: category
  end

  def create
    authorize! :create, Category
    tenant_category = current_tenant.categories.new(category_params)

    if tenant_category.save
      render json: tenant_category, status: :created
    else
      render json: { errors: tenant_category.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    authorize! :update, category
    if category.update(category_params)
      render json: category
    else
      render json: { errors: category.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    authorize! :destroy, category
    category.destroy!
    head :no_content
  end

  private

  def category
    @category ||= current_tenant.categories.find(params[:id])
  end

  def current_tenant
    Current.tenant
  end

  def category_params
    if params[:category].present?
      params.require(:category).permit(:name, :description, :status)
    else
      params.permit(:name, :description, :status)
    end
  end
end
