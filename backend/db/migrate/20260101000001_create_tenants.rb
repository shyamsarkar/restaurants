# frozen_string_literal: true

class CreateTenants < ActiveRecord::Migration[8.0]
  def change
    create_table :tenants do |t|
      t.string :name, null: false
      t.integer :status, default: 0, null: false

      t.timestamps
    end
  end
end
