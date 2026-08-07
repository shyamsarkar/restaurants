# frozen_string_literal: true

class CreateProducts < ActiveRecord::Migration[8.0]
  def change
    create_table :products do |t|
      t.string :name, null: false
      t.decimal :price, precision: 10, scale: 2, null: false
      t.string :unit, null: false
      t.string :description
      t.boolean :is_available, default: true, null: false
      t.boolean :is_veg, default: true, null: false
      t.references :category, null: false, foreign_key: true
      t.references :tenant, null: false, foreign_key: true
      t.decimal :gst_rate, precision: 5, scale: 2, default: 0.0, null: false
      t.string :image_path

      t.timestamps
    end

    add_index :products, [:tenant_id, :name], unique: true
    add_index :products, [:category_id, :name]
  end
end
