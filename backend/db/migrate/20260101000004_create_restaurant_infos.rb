# frozen_string_literal: true

class CreateRestaurantInfos < ActiveRecord::Migration[8.0]
  def change
    create_table :restaurant_infos do |t|
      t.references :tenant, null: false, foreign_key: true
      t.string :name, null: false
      t.string :logo
      t.string :gstin
      t.text :address
      t.string :phone
      t.string :email
      t.text :receipt_footer

      t.timestamps
    end
  end
end
