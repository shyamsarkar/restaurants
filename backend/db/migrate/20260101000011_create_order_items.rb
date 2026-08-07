# frozen_string_literal: true

class CreateOrderItems < ActiveRecord::Migration[8.0]
  def change
    create_table :order_items do |t|
      t.references :order, null: false, foreign_key: true
      t.references :product, null: false, foreign_key: true
      t.integer :quantity, null: false
      t.decimal :price, precision: 10, scale: 2, null: false
      t.string :name
      t.decimal :gst_rate, precision: 5, scale: 2, default: 0.0, null: false
      t.text :notes
      t.bigint :kot_id
      t.references :tenant, null: false, foreign_key: true

      t.timestamps
    end

    add_index :order_items, [:order_id, :product_id]
    add_foreign_key :order_items, :kots, column: :kot_id
  end
end
