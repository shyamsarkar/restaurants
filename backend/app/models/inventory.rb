# frozen_string_literal: true

class Inventory < ApplicationRecord
  self.primary_key = :product_id

  belongs_to :tenant
  acts_as_tenant :tenant
  belongs_to :product

  validates :stock_qty, presence: true, numericality: { greater_than_or_equal_to: -99999 } # allow negative stock if needed
  validates :low_stock_threshold, presence: true, numericality: { greater_than_or_equal_to: 0 }
end
