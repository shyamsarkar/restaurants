# frozen_string_literal: true

class CreateOrders < ActiveRecord::Migration[8.0]
  def change
    create_table :orders do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.references :dining_table, foreign_key: true, null: true
      t.integer :status, default: 0, null: false
      t.decimal :total, precision: 10, scale: 2, null: false
      t.decimal :discount, precision: 10, scale: 2
      t.decimal :tax, precision: 10, scale: 2
      t.references :customer, foreign_key: true, null: true
      t.decimal :subtotal, precision: 10, scale: 2, default: 0.0, null: false
      t.decimal :service_charge, precision: 10, scale: 2, default: 0.0, null: false
      t.decimal :round_off, precision: 10, scale: 2, default: 0.0, null: false
      t.integer :payment_mode, default: 5, null: false
      t.text :notes
      t.string :hold_name
      t.string :cancelled_by
      t.datetime :cancelled_at
      t.text :cancel_reason
      t.integer :order_type, default: 0, null: false

      t.timestamps
    end

    add_index :orders, [:tenant_id, :created_at]
  end
end
