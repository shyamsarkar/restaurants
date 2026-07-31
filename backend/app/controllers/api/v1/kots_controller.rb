# frozen_string_literal: true

class Api::V1::KotsController < ApplicationController
  def index
    authorize! :read, Kot
    kots = current_tenant.kots.includes(kot_items: :product).where.not(status: :completed).order(:created_at)
    render json: kots.as_json(include: { kot_items: { include: :product } })
  end

  def update
    kot = current_tenant.kots.find(params[:id])
    authorize! :update, kot

    if kot.update(status: params[:status])
      render json: kot.as_json(include: { kot_items: { include: :product } })
    else
      render json: { errors: kot.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def current_tenant
    Current.tenant
  end
end
