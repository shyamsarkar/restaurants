# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2026_07_31_133243) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "audit_logs", force: :cascade do |t|
    t.bigint "tenant_id", null: false
    t.string "username"
    t.string "action"
    t.string "target_type"
    t.integer "target_id"
    t.text "details"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["tenant_id"], name: "index_audit_logs_on_tenant_id"
  end

  create_table "categories", force: :cascade do |t|
    t.string "name", null: false
    t.integer "status", default: 0, null: false
    t.bigint "tenant_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "description"
    t.index ["tenant_id", "name"], name: "index_categories_on_tenant_id_and_name", unique: true
    t.index ["tenant_id"], name: "index_categories_on_tenant_id"
  end

  create_table "customers", force: :cascade do |t|
    t.bigint "tenant_id", null: false
    t.string "name", null: false
    t.string "phone", null: false
    t.string "email"
    t.integer "loyalty_points", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["tenant_id", "phone"], name: "index_customers_on_tenant_id_and_phone", unique: true
    t.index ["tenant_id"], name: "index_customers_on_tenant_id"
  end

  create_table "dining_tables", force: :cascade do |t|
    t.bigint "tenant_id", null: false
    t.string "name", null: false
    t.integer "status", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "merged_into_id"
    t.bigint "current_order_id"
    t.index ["tenant_id", "name"], name: "index_dining_tables_on_tenant_id_and_name", unique: true
    t.index ["tenant_id"], name: "index_dining_tables_on_tenant_id"
  end

  create_table "inventories", primary_key: "product_id", force: :cascade do |t|
    t.bigint "tenant_id", null: false
    t.integer "stock_qty", default: 0, null: false
    t.integer "low_stock_threshold", default: 5, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["tenant_id"], name: "index_inventories_on_tenant_id"
  end

  create_table "kot_items", force: :cascade do |t|
    t.bigint "kot_id", null: false
    t.bigint "product_id", null: false
    t.integer "quantity", null: false
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "tenant_id", null: false
    t.index ["kot_id"], name: "index_kot_items_on_kot_id"
    t.index ["product_id"], name: "index_kot_items_on_product_id"
    t.index ["tenant_id"], name: "index_kot_items_on_tenant_id"
  end

  create_table "kots", force: :cascade do |t|
    t.bigint "tenant_id", null: false
    t.bigint "order_id", null: false
    t.integer "status", default: 0, null: false
    t.integer "print_count", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["order_id"], name: "index_kots_on_order_id"
    t.index ["tenant_id"], name: "index_kots_on_tenant_id"
  end

  create_table "memberships", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "tenant_id", null: false
    t.integer "role", default: 4, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["tenant_id"], name: "index_memberships_on_tenant_id"
    t.index ["user_id", "tenant_id"], name: "index_memberships_on_user_id_and_tenant_id", unique: true
    t.index ["user_id"], name: "index_memberships_on_user_id"
  end

  create_table "order_item_cancellations", force: :cascade do |t|
    t.bigint "tenant_id", null: false
    t.bigint "order_item_id", null: false
    t.integer "quantity", null: false
    t.string "reason"
    t.string "cancelled_by"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["order_item_id"], name: "index_order_item_cancellations_on_order_item_id"
    t.index ["tenant_id"], name: "index_order_item_cancellations_on_tenant_id"
  end

  create_table "order_items", force: :cascade do |t|
    t.bigint "order_id", null: false
    t.bigint "product_id", null: false
    t.integer "quantity", null: false
    t.decimal "price", precision: 10, scale: 2, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "name"
    t.decimal "gst_rate", precision: 5, scale: 2, default: "0.0", null: false
    t.text "notes"
    t.bigint "kot_id"
    t.bigint "tenant_id", null: false
    t.index ["kot_id"], name: "index_order_items_on_kot_id"
    t.index ["order_id", "product_id"], name: "index_order_items_on_order_id_and_product_id"
    t.index ["order_id"], name: "index_order_items_on_order_id"
    t.index ["product_id"], name: "index_order_items_on_product_id"
    t.index ["tenant_id"], name: "index_order_items_on_tenant_id"
  end

  create_table "orders", force: :cascade do |t|
    t.bigint "tenant_id", null: false
    t.bigint "user_id", null: false
    t.bigint "dining_table_id"
    t.integer "status", default: 0, null: false
    t.decimal "total", precision: 10, scale: 2, null: false
    t.decimal "discount", precision: 10, scale: 2
    t.decimal "tax", precision: 10, scale: 2
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "customer_id"
    t.decimal "subtotal", precision: 10, scale: 2, default: "0.0", null: false
    t.decimal "service_charge", precision: 10, scale: 2, default: "0.0", null: false
    t.decimal "round_off", precision: 10, scale: 2, default: "0.0", null: false
    t.integer "payment_mode", default: 5, null: false
    t.text "notes"
    t.string "hold_name"
    t.string "cancelled_by"
    t.datetime "cancelled_at"
    t.text "cancel_reason"
    t.integer "order_type", default: 0, null: false
    t.index ["customer_id"], name: "index_orders_on_customer_id"
    t.index ["dining_table_id"], name: "index_orders_on_dining_table_id"
    t.index ["status"], name: "index_orders_on_status"
    t.index ["tenant_id", "created_at"], name: "index_orders_on_tenant_id_and_created_at"
    t.index ["tenant_id"], name: "index_orders_on_tenant_id"
    t.index ["user_id"], name: "index_orders_on_user_id"
  end

  create_table "products", force: :cascade do |t|
    t.string "name", null: false
    t.decimal "price", precision: 10, scale: 2, null: false
    t.string "unit", null: false
    t.string "description"
    t.boolean "is_available", default: true, null: false
    t.bigint "category_id", null: false
    t.bigint "tenant_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.decimal "gst_rate", precision: 5, scale: 2, default: "0.0", null: false
    t.string "image_path"
    t.index ["category_id", "name"], name: "index_products_on_category_id_and_name"
    t.index ["category_id"], name: "index_products_on_category_id"
    t.index ["tenant_id", "name"], name: "index_products_on_tenant_id_and_name", unique: true
    t.index ["tenant_id"], name: "index_products_on_tenant_id"
  end

  create_table "purchase_histories", force: :cascade do |t|
    t.bigint "tenant_id", null: false
    t.bigint "product_id", null: false
    t.integer "quantity", null: false
    t.string "supplier"
    t.decimal "unit_price", precision: 10, scale: 2, null: false
    t.datetime "date", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["product_id"], name: "index_purchase_histories_on_product_id"
    t.index ["tenant_id"], name: "index_purchase_histories_on_tenant_id"
  end

  create_table "restaurant_infos", force: :cascade do |t|
    t.bigint "tenant_id", null: false
    t.string "name", null: false
    t.string "logo"
    t.string "gstin"
    t.text "address"
    t.string "phone"
    t.string "email"
    t.text "receipt_footer"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["tenant_id"], name: "index_restaurant_infos_on_tenant_id"
  end

  create_table "tenants", force: :cascade do |t|
    t.string "name", null: false
    t.integer "status", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.string "first_name"
    t.string "last_name"
    t.boolean "is_active", default: true, null: false
    t.datetime "last_login_time"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "audit_logs", "tenants"
  add_foreign_key "categories", "tenants"
  add_foreign_key "customers", "tenants"
  add_foreign_key "dining_tables", "dining_tables", column: "merged_into_id"
  add_foreign_key "dining_tables", "tenants"
  add_foreign_key "inventories", "products"
  add_foreign_key "inventories", "tenants"
  add_foreign_key "kot_items", "kots"
  add_foreign_key "kot_items", "products"
  add_foreign_key "kot_items", "tenants"
  add_foreign_key "kots", "orders"
  add_foreign_key "kots", "tenants"
  add_foreign_key "memberships", "tenants"
  add_foreign_key "memberships", "users"
  add_foreign_key "order_item_cancellations", "order_items"
  add_foreign_key "order_item_cancellations", "tenants"
  add_foreign_key "order_items", "kots"
  add_foreign_key "order_items", "orders"
  add_foreign_key "order_items", "products"
  add_foreign_key "order_items", "products"
  add_foreign_key "order_items", "tenants"
  add_foreign_key "orders", "customers"
  add_foreign_key "orders", "dining_tables"
  add_foreign_key "orders", "tenants"
  add_foreign_key "orders", "users"
  add_foreign_key "products", "categories"
  add_foreign_key "products", "categories"
  add_foreign_key "products", "tenants"
  add_foreign_key "purchase_histories", "products"
  add_foreign_key "purchase_histories", "tenants"
  add_foreign_key "restaurant_infos", "tenants"
end
