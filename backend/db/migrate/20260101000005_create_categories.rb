# frozen_string_literal: true

class CreateCategories < ActiveRecord::Migration[8.0]
  def change
    create_table :categories do |t|
      t.string :name, null: false
      t.integer :status, default: 0, null: false
      t.references :tenant, null: false, foreign_key: true
      t.text :description

      t.timestamps
    end

    add_index :categories, [:tenant_id, :name], unique: true
  end
end
