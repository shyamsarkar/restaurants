# frozen_string_literal: true

class Product < ApplicationRecord
  belongs_to :tenant
  acts_as_tenant :tenant
  belongs_to :category
  has_one :inventory, foreign_key: :product_id, dependent: :destroy
  has_many :order_items, dependent: :restrict_with_exception

  validates :name, presence: true, uniqueness: { scope: :tenant_id, case_sensitive: false }
  validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :gst_rate, presence: true, numericality: { greater_than_or_equal_to: 0 }

  after_create :initialize_inventory

  private

  def initialize_inventory
    Inventory.create!(product_id: id, tenant_id: tenant_id, stock_qty: 0, low_stock_threshold: 5)
  end
end
