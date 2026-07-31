# frozen_string_literal: true

class Api::V1::DiningTablesController < ApplicationController
  def index
    authorize! :read, DiningTable
    render json: current_tenant.dining_tables.order(:id).as_json(include: :current_order)
  end

  def show
    authorize! :read, dining_table
    render json: dining_table.as_json(include: :current_order)
  end

  def create
    authorize! :create, DiningTable
    table = current_tenant.dining_tables.new(dining_table_params)

    if table.save
      render json: table, status: :created
    else
      render json: { errors: table.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    authorize! :update, dining_table
    if dining_table.update(dining_table_params)
      render json: dining_table
    else
      render json: { errors: dining_table.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    authorize! :destroy, dining_table
    dining_table.destroy!
    head :no_content
  rescue ActiveRecord::InvalidForeignKey, ActiveRecord::DeleteRestrictionError => e
    render json: { errors: [e.message] }, status: :unprocessable_entity
  end

  def transfer
    authorize! :update, dining_table
    target_table = current_tenant.dining_tables.find(params[:target_table_id])
    authorize! :update, target_table

    OrderService.transfer_table!(dining_table, target_table)
    render json: { success: true, source: dining_table.as_json(include: :current_order), target: target_table.as_json(include: :current_order) }
  rescue OrderService::ServiceError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def merge
    authorize! :update, dining_table
    target_table = current_tenant.dining_tables.find(params[:target_table_id])
    authorize! :update, target_table

    OrderService.merge_tables!(dining_table, target_table)
    render json: { success: true, source: dining_table.as_json(include: :current_order), target: target_table.as_json(include: :current_order) }
  rescue OrderService::ServiceError => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  private

  def dining_table
    @dining_table ||= current_tenant.dining_tables.find(params[:id])
  end

  def current_tenant
    Current.tenant
  end

  def dining_table_params
    if params[:dining_table].present?
      params.require(:dining_table).permit(:name, :status)
    else
      params.permit(:name, :status)
    end
  end
end
