# frozen_string_literal: true

class Kot < ApplicationRecord
  belongs_to :tenant
  acts_as_tenant :tenant
  belongs_to :order
  has_many :kot_items, dependent: :destroy

  enum :status, { pending: 0, preparing: 1, ready: 2, completed: 3 }, default: :pending

  validates :print_count, presence: true, numericality: { greater_than_or_equal_to: 0 }
end
