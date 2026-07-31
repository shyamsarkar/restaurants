# frozen_string_literal: true

class Order < ApplicationRecord
  belongs_to :tenant
  acts_as_tenant :tenant

  belongs_to :user
  belongs_to :dining_table, optional: true
  belongs_to :customer, optional: true
  has_many :order_items, dependent: :destroy
  has_many :kots, dependent: :destroy

  enum :status, { draft: 0, active: 1, completed: 3, cancelled: 4 }, default: :draft
  enum :payment_mode, { cash: 0, upi: 1, card: 2, mixed: 3, nc: 4, none: 5 }, prefix: true, default: :none
  enum :order_type, { dine_in: 0, parcel: 1 }, default: :dine_in

  validates :tenant_id, :user_id, :status, :order_type, presence: true
  validates :total, numericality: { greater_than_or_equal_to: 0 }
  validates :subtotal, :service_charge, :discount, :tax, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  validates :dining_table_id, presence: true, if: :dine_in?
  validates :dining_table_id, absence: true, if: :parcel?

  after_initialize :set_defaults, if: :new_record?

  def set_defaults
    self.total ||= 0.0
    self.subtotal ||= 0.0
    self.tax ||= 0.0
    self.discount ||= 0.0
    self.service_charge ||= 0.0
    self.round_off ||= 0.0
  end

  def recalculate_totals!
    # calculate subtotal using BigDecimal
    self.subtotal = order_items.sum { |oi| BigDecimal(oi.price.to_s) * oi.quantity }

    # calculate discount and service charge amounts (percentages of subtotal)
    discount_pct = BigDecimal((discount || 0.0).to_s)
    service_charge_pct = BigDecimal((service_charge || 0.0).to_s)

    discount_amount = subtotal * (discount_pct / 100)
    service_charge_amount = subtotal * (service_charge_pct / 100)

    taxable_subtotal = subtotal - discount_amount + service_charge_amount

    # Sum of item GSTs
    sum_item_gsts = order_items.sum { |oi| (BigDecimal(oi.price.to_s) * oi.quantity) * (BigDecimal((oi.gst_rate || 0.0).to_s) / 100) }

    if subtotal > 0
      self.tax = taxable_subtotal * (sum_item_gsts / subtotal)
    else
      self.tax = BigDecimal('0.0')
    end

    raw_total = taxable_subtotal + tax
    rounded_total = raw_total.round

    self.round_off = rounded_total - raw_total
    self.total = rounded_total
    save!
  end
end
