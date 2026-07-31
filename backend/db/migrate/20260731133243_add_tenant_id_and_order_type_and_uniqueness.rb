class AddTenantIdAndOrderTypeAndUniqueness < ActiveRecord::Migration[8.0]
  def up
    # 1. Add order_type to orders
    add_column :orders, :order_type, :integer, default: 0, null: false

    # 2. Add tenant_id to order_items
    add_reference :order_items, :tenant, foreign_key: true
    
    # Backfill tenant_id on existing order_items from their orders
    execute <<-SQL
      UPDATE order_items
      SET tenant_id = orders.tenant_id
      FROM orders
      WHERE order_items.order_id = orders.id
    SQL

    change_column_null :order_items, :tenant_id, false

    # 3. Add tenant_id to kot_items
    add_reference :kot_items, :tenant, foreign_key: true

    # Backfill tenant_id on existing kot_items from their kots
    execute <<-SQL
      UPDATE kot_items
      SET tenant_id = kots.tenant_id
      FROM kots
      WHERE kot_items.kot_id = kots.id
    SQL

    change_column_null :kot_items, :tenant_id, false

    # 4. Add unique index to products
    add_index :products, [:tenant_id, :name], unique: true
  end

  def down
    remove_index :products, [:tenant_id, :name]
    remove_reference :kot_items, :tenant
    remove_reference :order_items, :tenant
    remove_column :orders, :order_type
  end
end
