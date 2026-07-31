# frozen_string_literal: true

class OrderItem < ApplicationRecord
  belongs_to :tenant
  acts_as_tenant :tenant

  belongs_to :order
  belongs_to :product
  belongs_to :kot, optional: true
  has_many :order_item_cancellations, dependent: :destroy

  attr_accessor :bypass_kot_immutability

  validates :quantity, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }

  before_update :ensure_immutable_fields, unless: :bypass_kot_immutability
  before_destroy :ensure_destroyable, unless: :bypass_kot_immutability

  private

  def ensure_immutable_fields
    if kot_id_was.present?
      if product_id_changed? || quantity_changed? || price_changed?
        errors.add(:base, 'Sent items are immutable and cannot be updated')
        throw(:abort)
      end
    end
  end

  def ensure_destroyable
    if kot_id.present?
      errors.add(:base, 'Sent items cannot be deleted')
      throw(:abort)
    end
  end
end
