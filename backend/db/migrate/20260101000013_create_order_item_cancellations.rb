# frozen_string_literal: true

class CreateOrderItemCancellations < ActiveRecord::Migration[8.0]
  def change
    create_table :order_item_cancellations do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :order_item, null: false, foreign_key: true
      t.integer :quantity, null: false
      t.string :reason
      t.string :cancelled_by

      t.timestamps
    end
  end
end
