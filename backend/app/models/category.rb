# frozen_string_literal: true

class Category < ApplicationRecord
  belongs_to :tenant
  acts_as_tenant :tenant
  has_many :products, dependent: :destroy

  enum :status, { active: 0, inactive: 1 }, default: :active

  validates :name, presence: true
  validates :name, uniqueness: { scope: :tenant_id, case_sensitive: false }
  validates :tenant_id, presence: true
end
