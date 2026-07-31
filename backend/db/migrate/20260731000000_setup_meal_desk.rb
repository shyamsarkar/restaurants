# frozen_string_literal: true

class SetupMealDesk < ActiveRecord::Migration[8.0]
  def change
    # 1. Create RestaurantInfo
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

    # 2. Rename menus to categories
    rename_table :menus, :categories
    add_column :categories, :description, :text

    # 3. Rename items to products
    remove_foreign_key :items, :menus if foreign_key_exists?(:items, :menus)
    rename_table :items, :products
    rename_column :products, :menu_id, :category_id
    add_foreign_key :products, :categories, column: :category_id
    add_column :products, :gst_rate, :decimal, precision: 5, scale: 2, default: 0.0, null: false
    add_column :products, :image_path, :string

    # 4. Create Customers
    create_table :customers do |t|
      t.references :tenant, null: false, foreign_key: true
      t.string :name, null: false
      t.string :phone, null: false
      t.string :email
      t.integer :loyalty_points, default: 0, null: false
      t.timestamps
    end
    add_index :customers, [:tenant_id, :phone], unique: true

    # 5. Modify dining_tables (acting as Table)
    add_column :dining_tables, :merged_into_id, :bigint
    add_column :dining_tables, :current_order_id, :bigint
    add_foreign_key :dining_tables, :dining_tables, column: :merged_into_id

    # 6. Modify orders
    rename_column :orders, :total_price, :total
    add_reference :orders, :customer, foreign_key: true, null: true
    add_column :orders, :subtotal, :decimal, precision: 10, scale: 2, default: 0.0, null: false
    add_column :orders, :service_charge, :decimal, precision: 10, scale: 2, default: 0.0, null: false
    add_column :orders, :round_off, :decimal, precision: 10, scale: 2, default: 0.0, null: false
    add_column :orders, :payment_mode, :integer, default: 5, null: false # None
    add_column :orders, :notes, :text
    add_column :orders, :hold_name, :string
    add_column :orders, :cancelled_by, :string
    add_column :orders, :cancelled_at, :datetime
    add_column :orders, :cancel_reason, :text

    # 7. Create Kots
    create_table :kots do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :order, null: false, foreign_key: true
      t.integer :status, default: 0, null: false # Pending
      t.integer :print_count, default: 0, null: false
      t.timestamps
    end

    # 8. Create KotItems
    create_table :kot_items do |t|
      t.references :kot, null: false, foreign_key: true
      t.references :product, null: false, foreign_key: true
      t.integer :quantity, null: false
      t.text :notes
      t.timestamps
    end

    # 9. Modify order_items
    remove_foreign_key :order_items, :items if foreign_key_exists?(:order_items, :items)
    rename_column :order_items, :item_id, :product_id
    add_foreign_key :order_items, :products, column: :product_id
    add_column :order_items, :name, :string
    add_column :order_items, :gst_rate, :decimal, precision: 5, scale: 2, default: 0.0, null: false
    add_column :order_items, :notes, :text
    add_reference :order_items, :kot, foreign_key: true, null: true

    # 10. Create Inventories
    create_table :inventories, id: false do |t|
      t.bigint :product_id, null: false, primary_key: true
      t.references :tenant, null: false, foreign_key: true
      t.integer :stock_qty, default: 0, null: false
      t.integer :low_stock_threshold, default: 5, null: false
      t.timestamps
    end
    add_foreign_key :inventories, :products, column: :product_id

    # 11. Create PurchaseHistories
    create_table :purchase_histories do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :product, null: false, foreign_key: true
      t.integer :quantity, null: false
      t.string :supplier
      t.decimal :unit_price, precision: 10, scale: 2, null: false
      t.datetime :date, null: false
      t.timestamps
    end

    # 12. Create OrderItemCancellations
    create_table :order_item_cancellations do |t|
      t.references :tenant, null: false, foreign_key: true
      t.references :order_item, null: false, foreign_key: true
      t.integer :quantity, null: false
      t.string :reason
      t.string :cancelled_by
      t.timestamps
    end

    # 13. Create AuditLogs
    create_table :audit_logs do |t|
      t.references :tenant, null: false, foreign_key: true
      t.string :username
      t.string :action
      t.string :target_type
      t.integer :target_id
      t.text :details
      t.timestamps
    end
  end
end
