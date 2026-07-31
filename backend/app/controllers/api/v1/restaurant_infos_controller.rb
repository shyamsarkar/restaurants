# frozen_string_literal: true

class Api::V1::RestaurantInfosController < ApplicationController
  def show
    authorize! :read, RestaurantInfo
    info = current_tenant.restaurant_info || current_tenant.create_restaurant_info!(name: current_tenant.name)
    render json: info
  end

  def update
    info = current_tenant.restaurant_info || current_tenant.create_restaurant_info!(name: current_tenant.name)
    authorize! :update, info

    if info.update(info_params)
      render json: info
    else
      render json: { errors: info.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def current_tenant
    Current.tenant
  end

  def info_params
    if params[:restaurant_info].present?
      params.require(:restaurant_info).permit(:name, :logo, :gstin, :address, :phone, :email, :receipt_footer)
    else
      params.permit(:name, :logo, :gstin, :address, :phone, :email, :receipt_footer)
    end
  end
end
