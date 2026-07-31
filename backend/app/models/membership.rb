# frozen_string_literal: true

class Membership < ApplicationRecord
  belongs_to :user
  belongs_to :tenant
  acts_as_tenant :tenant

  enum :role, { owner: 0, admin: 1, manager: 2, cashier: 3, waiter: 4 }

  validates :user_id, presence: true
  validates :role, presence: true
  validates :tenant_id, presence: true
  validates :user_id, uniqueness: { scope: :tenant_id }
end
