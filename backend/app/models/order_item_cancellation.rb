# frozen_string_literal: true

class OrderItemCancellation < ApplicationRecord
  belongs_to :tenant
  acts_as_tenant :tenant
  belongs_to :order_item

  validates :quantity, presence: true, numericality: { greater_than: 0 }
  validates :reason, presence: true
end
