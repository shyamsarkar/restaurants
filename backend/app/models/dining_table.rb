# frozen_string_literal: true

class DiningTable < ApplicationRecord
  belongs_to :tenant
  acts_as_tenant :tenant

  has_many :orders, dependent: :restrict_with_exception

  belongs_to :merged_into, class_name: 'DiningTable', optional: true
  has_many :merged_tables, class_name: 'DiningTable', foreign_key: 'merged_into_id'
  belongs_to :current_order, class_name: 'Order', optional: true

  enum :status, {
    free: 0,
    occupied: 1,
    billed: 2
  }

  validates :name, presence: true, uniqueness: { scope: :tenant_id }
  validate :status_matches_current_order

  private

  def status_matches_current_order
    if current_order_id.present?
      if free?
        errors.add(:status, "cannot be free if the table has an active order")
      end
    else
      unless free?
        errors.add(:status, "must be free if the table has no active order")
      end
    end
  end
end
