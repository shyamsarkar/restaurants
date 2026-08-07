# frozen_string_literal: true

class CreateCustomers < ActiveRecord::Migration[8.0]
  def change
    create_table :customers do |t|
      t.references :tenant, null: false, foreign_key: true
      t.string :name, null: false
      t.string :phone, null: false
      t.string :email
      t.integer :loyalty_points, default: 0, null: false

      t.timestamps
    end

    add_index :customers, [:tenant_id, :phone], unique: true
  end
end
