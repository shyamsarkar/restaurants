# frozen_string_literal: true

class CreateMemberships < ActiveRecord::Migration[8.0]
  def change
    create_table :memberships do |t|
      t.references :user, null: false, foreign_key: true
      t.references :tenant, null: false, foreign_key: true
      t.integer :role, default: 4, null: false

      t.timestamps
    end

    add_index :memberships, [:user_id, :tenant_id], unique: true
  end
end
