# frozen_string_literal: true

class PurchaseHistory < ApplicationRecord
  belongs_to :tenant
  acts_as_tenant :tenant
  belongs_to :product

  validates :quantity, presence: true, numericality: { greater_than: 0 }
  validates :unit_price, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :date, presence: true
end
