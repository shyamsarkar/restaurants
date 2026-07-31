# frozen_string_literal: true

class Api::V1::AuditLogsController < ApplicationController
  def index
    authorize! :read, AuditLog
    render json: current_tenant.audit_logs.order(created_at: :desc).limit(100)
  end

  private

  def current_tenant
    Current.tenant
  end
end
