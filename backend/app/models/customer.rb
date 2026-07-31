# frozen_string_literal: true

class Customer < ApplicationRecord
  belongs_to :tenant
  acts_as_tenant :tenant
  has_many :orders, dependent: :nullify

  validates :name, presence: true
  validates :phone, presence: true, uniqueness: { scope: :tenant_id }
end
