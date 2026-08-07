# app/controllers/api/v1/tenants_controller.rb

module Api
  module V1
    class TenantsController < ApplicationController
      skip_before_action :set_current_context, only: [:index, :create, :activate, :deactivate, :destroy]
      skip_load_and_authorize_resource only: [:index, :create, :activate, :deactivate, :destroy]
      load_and_authorize_resource except: [:index, :create, :activate, :deactivate, :destroy]

      def index
        tenants = current_user.memberships.includes(:tenant).map do |m|
          {
            id: m.tenant.id,
            name: m.tenant.name,
            role: m.role,
            status: m.tenant.status
          }
        end
        render json: tenants
      end

      def show
        render json: @tenant
      end

      def create
        @tenant = Tenant.new(tenant_params)
        @tenant.status = :active

        ActiveRecord::Base.transaction do
          @tenant.save!
          Membership.create!(user: current_user, tenant: @tenant, role: :owner)
          TenantSetupService.setup!(@tenant)
        end

        render json: @tenant, status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages },
               status: :unprocessable_content
      end

      def update
        if @tenant.update(tenant_params)
          render json: @tenant
        else
          render json: { errors: @tenant.errors.full_messages }, status: :unprocessable_content
        end
      end

      def activate
        @tenant = Tenant.find(params[:id])
        membership = current_user.memberships.find_by(tenant: @tenant)
        if membership&.owner?
          if @tenant.update(status: :active)
            render json: @tenant
          else
            render json: { errors: @tenant.errors.full_messages }, status: :unprocessable_content
          end
        else
          render json: { error: "Access Denied" }, status: :forbidden
        end
      end

      def deactivate
        @tenant = Tenant.find(params[:id])
        membership = current_user.memberships.find_by(tenant: @tenant)
        if membership&.owner?
          if @tenant.update(status: :inactive)
            render json: @tenant
          else
            render json: { errors: @tenant.errors.full_messages }, status: :unprocessable_content
          end
        else
          render json: { error: "Access Denied" }, status: :forbidden
        end
      end

      def destroy
        render json: { error: "Tenants cannot be deleted. Use deactivate instead." }, status: :method_not_allowed
      end

      private

      def tenant_params
        params.require(:tenant).permit(:name, :status)
      end
    end
  end
end
