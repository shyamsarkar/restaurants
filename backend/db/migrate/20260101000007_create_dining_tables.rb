# frozen_string_literal: true

class CreateDiningTables < ActiveRecord::Migration[8.0]
  def change
    create_table :dining_tables do |t|
      t.references :tenant, null: false, foreign_key: true
      t.string :name, null: false
      t.integer :status, default: 0, null: false
      t.bigint :merged_into_id
      t.bigint :current_order_id

      t.timestamps
    end

    add_index :dining_tables, [:tenant_id, :name], unique: true
    add_foreign_key :dining_tables, :dining_tables, column: :merged_into_id
  end
end
