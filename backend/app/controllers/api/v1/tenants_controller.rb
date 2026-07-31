# app/controllers/api/v1/tenants_controller.rb

module Api
  module V1
    class TenantsController < ApplicationController
      skip_before_action :set_current_context, only: [:index]
      skip_load_and_authorize_resource only: [:index]
      load_and_authorize_resource except: [:index]

      def index
        tenants = current_user.memberships.includes(:tenant).map do |m|
          {
            id: m.tenant.id,
            name: m.tenant.name,
            role: m.role
          }
        end
        render json: tenants
      end

      def show
        render json: @tenant
      end

      def create
        if @tenant.save
          render json: @tenant, status: :created
        else
          render json: { errors: @tenant.errors.full_messages }, status: :unprocessable_content
        end
      end

      def update
        if @tenant.update(tenant_params)
          render json: @tenant
        else
          render json: { errors: @tenant.errors.full_messages }, status: :unprocessable_content
        end
      end

      private

      def tenant_params
        params.require(:tenant).permit(:name, :status)
      end
    end
  end
end
