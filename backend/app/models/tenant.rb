# frozen_string_literal: true

class Tenant < ApplicationRecord
  has_one :restaurant_info, dependent: :destroy
  has_many :categories, dependent: :destroy
  has_many :products, dependent: :destroy
  has_many :customers, dependent: :destroy
  has_many :kots, dependent: :destroy
  has_many :inventories, dependent: :destroy
  has_many :purchase_histories, dependent: :destroy
  has_many :audit_logs, dependent: :destroy

  has_many :memberships, dependent: :destroy
  has_many :dining_tables, dependent: :destroy
  has_many :orders, dependent: :destroy
  has_many :users, through: :memberships

  enum :status, { active: 0, inactive: 1, pending: 2 }

  validates :name, presence: true
end
