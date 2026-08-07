# frozen_string_literal: true

class CreateKots < ActiveRecord::Migration[8.0]
  def change
    create_table :kots do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :order, null: false, foreign_key: true
      t.integer :status, default: 0, null: false
      t.integer :print_count, default: 0, null: false

      t.timestamps
    end
  end
end
