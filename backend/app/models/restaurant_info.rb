# frozen_string_literal: true

class RestaurantInfo < ApplicationRecord
  belongs_to :tenant
  acts_as_tenant :tenant

  validates :name, presence: true
end
