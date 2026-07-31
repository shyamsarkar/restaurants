# frozen_string_literal: true

class AuditLog < ApplicationRecord
  belongs_to :tenant
  acts_as_tenant :tenant

  validates :username, presence: true
  validates :action, presence: true
end
