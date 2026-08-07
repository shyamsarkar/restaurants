# frozen_string_literal: true

class CreateKotItems < ActiveRecord::Migration[8.0]
  def change
    create_table :kot_items do |t|
      t.references :kot, null: false, foreign_key: true
      t.references :product, null: false, foreign_key: true
      t.integer :quantity, null: false
      t.text :notes
      t.references :tenant, null: false, foreign_key: true

      t.timestamps
    end
  end
end
