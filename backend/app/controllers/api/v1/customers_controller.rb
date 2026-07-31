# frozen_string_literal: true

class Api::V1::CustomersController < ApplicationController
  def index
    authorize! :read, Customer
    if params[:phone].present?
      customer = current_tenant.customers.find_by(phone: params[:phone])
      if customer
        render json: customer
      else
        render json: { error: 'Customer not found' }, status: :not_found
      end
    else
      render json: current_tenant.customers.order(:name)
    end
  end

  def show
    authorize! :read, customer
    render json: customer
  end

  def create
    authorize! :create, Customer
    customer = current_tenant.customers.new(customer_params)
    if customer.save
      render json: customer, status: :created
    else
      render json: { errors: customer.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    authorize! :update, customer
    if customer.update(customer_params)
      render json: customer
    else
      render json: { errors: customer.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    authorize! :destroy, customer
    customer.destroy!
    head :no_content
  end

  private

  def customer
    @customer ||= current_tenant.customers.find(params[:id])
  end

  def current_tenant
    Current.tenant
  end

  def customer_params
    if params[:customer].present?
      params.require(:customer).permit(:name, :phone, :email, :loyalty_points)
    else
      params.permit(:name, :phone, :email, :loyalty_points)
    end
  end
end
