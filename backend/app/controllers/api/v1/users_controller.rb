module Api
  module V1
    class UsersController < ApplicationController
      before_action :set_user, only: %i[show update destroy]
      skip_before_action :set_current_context, only: [:update_password], raise: false

      def index
        authorize! :read, User
        users = current_tenant.users
                              .includes(:memberships)
                              .order(:id)
                              .distinct

        render json: users.map { |user| serialize_user(user) }
      end

      def show
        authorize! :read, @user
        render json: serialize_user(@user)
      end

      def create
        authorize! :create, User
        role = role_param

        if role == 'owner'
          render json: { errors: ['Creating owner users via User Directory is not allowed'] }, status: :forbidden
          return
        end

        email = create_user_params[:email]&.strip&.downcase
        password = create_user_params[:password]
        password_conf = create_user_params[:password_confirmation]

        existing_user = User.find_by(email: email)

        ActiveRecord::Base.transaction do
          if existing_user
            if Membership.exists?(user_id: existing_user.id, tenant_id: current_tenant.id)
              render json: { errors: ['User with this email is already a member of this restaurant branch'] }, status: :unprocessable_content
              return
            end

            Membership.create!(user_id: existing_user.id, tenant_id: current_tenant.id, role: role)
            user = existing_user
          else
            if password.blank?
              render json: { errors: ["Password can't be blank"] }, status: :unprocessable_content
              return
            end

            user = User.new(
              email: email,
              first_name: create_user_params[:first_name],
              last_name: create_user_params[:last_name],
              is_active: create_user_params[:is_active] != false,
              password: password,
              password_confirmation: password_conf.presence || password
            )
            user.must_change_password = true
            user.save!
            Membership.create!(user_id: user.id, tenant_id: current_tenant.id, role: role)
          end

          render json: serialize_user(user), status: :created
        end
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages }, status: :unprocessable_content
      end

      def update
        authorize! :update, @user
        current_membership = current_user.memberships.find_by(tenant: current_tenant)
        target_membership = @user.memberships.find_by!(tenant_id: current_tenant.id)

        if target_membership.role == 'owner' && current_membership&.role != 'owner'
          render json: { errors: ['Only owners can modify an owner user'] }, status: :forbidden
          return
        end

        if role_in_payload? && role_param == 'owner' && current_membership&.role != 'owner'
          render json: { errors: ['Only owners can assign the owner role'] }, status: :forbidden
          return
        end

        params_hash = update_user_params
        if params_hash[:password].blank?
          params_hash.delete(:password)
          params_hash.delete(:password_confirmation)
        end

        ActiveRecord::Base.transaction do
          @user.update!(params_hash)
          target_membership.update!(role: role_param) if role_in_payload?
        end

        render json: serialize_user(@user.reload)
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages }, status: :unprocessable_content
      end

      def destroy
        authorize! :destroy, @user

        if @user.id == current_user.id
          render json: { errors: ['You cannot delete your own account'] }, status: :forbidden
          return
        end

        current_membership = current_user.memberships.find_by(tenant: current_tenant)
        target_membership = @user.memberships.find_by!(tenant_id: current_tenant.id)

        if target_membership.role == 'owner' && current_membership&.role != 'owner'
          render json: { errors: ['Only owners can delete an owner user'] }, status: :forbidden
          return
        end

        membership = @user.memberships.find_by!(tenant_id: current_tenant.id)
        membership.destroy!
        @user.destroy! if @user.memberships.reload.none?

        head :no_content
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages }, status: :unprocessable_content
      end

      # PATCH /api/v1/users/password
      def update_password
        user = current_user
        
        unless user.valid_password?(params[:current_password])
          render json: { error: "Current password is incorrect" }, status: :unprocessable_entity
          return
        end

        new_password = params[:new_password]
        confirm_password = params[:confirm_password]

        if new_password.blank?
          render json: { error: "New password cannot be blank" }, status: :unprocessable_entity
          return
        end

        if new_password != confirm_password
          render json: { error: "New password and confirmation do not match" }, status: :unprocessable_entity
          return
        end

        user.password = new_password
        user.password_confirmation = confirm_password
        user.must_change_password = false

        if user.save
          bypass_sign_in(user) if respond_to?(:bypass_sign_in)
          render json: { message: "Password updated successfully" }, status: :ok
        else
          render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def set_user
        @user = current_tenant.users.find(params[:id])
      end

      def current_tenant
        Current.tenant
      end

      def user_payload
        if params[:password].present? || params[:email].present?
          params
        elsif params[:user].is_a?(Hash) || params[:user].is_a?(ActionController::Parameters)
          params[:user]
        else
          params
        end
      end

      def create_user_params
        user_payload.permit(
          :email,
          :first_name,
          :last_name,
          :is_active,
          :password,
          :password_confirmation
        )
      end

      def update_user_params
        permitted = user_payload.permit(
          :email,
          :first_name,
          :last_name,
          :is_active,
          :password,
          :password_confirmation
        )

        if permitted[:password].blank?
          permitted.delete(:password)
          permitted.delete(:password_confirmation)
        end

        permitted
      end

      def role_in_payload?
        user_payload.key?(:role)
      end

      def role_param
        role = user_payload[:role].presence || 'waiter'

        return role if Membership.roles.key?(role)

        raise ActiveRecord::RecordInvalid.new(
          Membership.new.tap { |membership| membership.errors.add(:role, 'is invalid') }
        )
      end

      def serialize_user(user)
        membership = user.memberships.find { |m| m.tenant_id == current_tenant.id }

        {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          is_active: user.is_active,
          role: membership&.role,
          must_change_password: user.must_change_password,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      end


    end
  end
end
