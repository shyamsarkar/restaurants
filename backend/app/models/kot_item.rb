# frozen_string_literal: true

class KotItem < ApplicationRecord
  belongs_to :tenant
  acts_as_tenant :tenant

  belongs_to :kot
  belongs_to :product

  validates :quantity, presence: true, numericality: { other_than: 0 }
end
