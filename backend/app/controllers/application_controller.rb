# frozen_string_literal: true

class ApplicationController < ActionController::Base
  skip_before_action :verify_authenticity_token

  # Devise authentication
  before_action :authenticate_user!
  before_action :set_current_context

  # CanCanCan
  rescue_from CanCan::AccessDenied do |exception|
    render json: { error: exception.message }, status: :forbidden
  end

  protected

  # Optional: expose current ability explicitly (good practice)
  def current_ability
    @current_ability ||= Ability.new(current_user, Current.tenant)
  end

  private

  def set_current_context
    Current.user = current_user

    tenant_id = request.headers['X-Tenant-ID']

    if tenant_id.blank?
      render json: { error: 'Tenant not selected' }, status: :forbidden
      return
    end

    Current.membership = current_user.memberships
                                     .includes(:tenant)
                                     .find_by!(tenant_id: tenant_id)

    Current.tenant = Current.membership.tenant

    unless Current.tenant.active?
      render json: { error: 'Tenant inactive' }, status: :forbidden
      return
    end

    ActsAsTenant.current_tenant = Current.tenant
  end

  def current_tenant
    Current.tenant
  end
end
