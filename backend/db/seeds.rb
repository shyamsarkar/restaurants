# frozen_string_literal: true

# Clear Existing Data
puts 'Cleaning database...'
OrderItemCancellation.delete_all
KotItem.delete_all
OrderItem.delete_all
Kot.delete_all
Order.delete_all
Inventory.delete_all
PurchaseHistory.delete_all
Product.delete_all
Category.delete_all
Customer.delete_all
RestaurantInfo.delete_all
DiningTable.delete_all
Membership.delete_all
Tenant.delete_all
User.delete_all
AuditLog.delete_all
puts 'Database cleaned!'

puts 'Creating users...'
# Create admin user
admin = User.create!(
  email: 'admin@example.com',
  password: 'password123',
  password_confirmation: 'password123',
  first_name: 'Admin',
  last_name: 'User',
  is_active: true
)

# Create owner user
owner = User.create!(
  email: 'owner@example.com',
  password: 'password123',
  password_confirmation: 'password123',
  first_name: 'Owner',
  last_name: 'User',
  is_active: true
)

# Create regular users
users = []
3.times do |i|
  users << User.create!(
    email: "user#{i + 1}@example.com",
    password: 'password123',
    password_confirmation: 'password123',
    first_name: "User#{i + 1}",
    last_name: 'Test',
    is_active: true
  )
end
puts "Created #{User.count} users"

puts 'Creating tenants...'
tenant1 = Tenant.create!(name: 'Spice Garden Restaurant', status: :active)
tenant2 = Tenant.create!(name: 'Urban Eats Cafe', status: :active)
puts "Created #{Tenant.count} tenants"

puts 'Creating memberships...'
# Owner memberships
Membership.create!(user: owner, tenant: tenant1, role: :owner)
Membership.create!(user: owner, tenant: tenant2, role: :owner)

# Admin & staff memberships
Membership.create!(user: admin, tenant: tenant1, role: :admin)
Membership.create!(user: users[0], tenant: tenant1, role: :manager)
Membership.create!(user: users[1], tenant: tenant1, role: :cashier)
Membership.create!(user: users[2], tenant: tenant1, role: :waiter)

Membership.create!(user: admin, tenant: tenant2, role: :admin)
Membership.create!(user: users[0], tenant: tenant2, role: :manager)
puts "Created #{Membership.count} memberships"

puts 'Creating dining tables...'
t1 = DiningTable.create!(tenant: tenant1, name: 'Table 1', status: :free)
t2 = DiningTable.create!(tenant: tenant1, name: 'Table 2', status: :free)
t3 = DiningTable.create!(tenant: tenant1, name: 'Table 3', status: :free)
t4 = DiningTable.create!(tenant: tenant1, name: 'Table 4', status: :free)

a1 = DiningTable.create!(tenant: tenant2, name: 'Table A1', status: :free)
a2 = DiningTable.create!(tenant: tenant2, name: 'Table A2', status: :free)
puts "Created #{DiningTable.count} dining tables"

puts 'Creating restaurant configurations...'
RestaurantInfo.create!(
  tenant: tenant1,
  name: 'Spice Garden POS',
  gstin: '27AAAAA1111A1Z1',
  address: '123, Garden Street, Mumbai',
  phone: '+91 9876543210',
  email: 'info@spicegarden.com',
  receipt_footer: 'Thank you for dining with us!'
)
RestaurantInfo.create!(
  tenant: tenant2,
  name: 'Urban Eats Billing',
  gstin: '27BBBBB2222B2Z2',
  address: '456, Cafe Lane, Pune',
  phone: '+91 9876543211',
  email: 'info@urbaneats.com',
  receipt_footer: 'Visit again soon!'
)

puts 'Creating categories...'
c_appetizers = Category.create!(tenant: tenant1, name: 'Appetizers', description: 'Starters and small plates', status: :active)
c_mains = Category.create!(tenant: tenant1, name: 'Mains', description: 'Curries, biryanis and breads', status: :active)
c_beverages = Category.create!(tenant: tenant1, name: 'Beverages', description: 'Cold drinks and hot brews', status: :active)

c_cafe = Category.create!(tenant: tenant2, name: 'Cafe Eats', description: 'Sandwiches, burgers and pasta', status: :active)
puts "Created #{Category.count} categories"

puts 'Creating products & stock...'
p_paneer = Product.create!(tenant: tenant1, category: c_appetizers, name: 'Paneer Tikka', price: 180.00, gst_rate: 5.0, unit: 'plate', is_available: true)
p_biryani = Product.create!(tenant: tenant1, category: c_mains, name: 'Chicken Biryani', price: 250.00, gst_rate: 5.0, unit: 'plate', is_available: true)
p_butter_chicken = Product.create!(tenant: tenant1, category: c_mains, name: 'Butter Chicken', price: 280.00, gst_rate: 5.0, unit: 'bowl', is_available: true)
p_naan = Product.create!(tenant: tenant1, category: c_mains, name: 'Garlic Naan', price: 50.00, gst_rate: 5.0, unit: 'piece', is_available: true)
p_chai = Product.create!(tenant: tenant1, category: c_beverages, name: 'Masala Chai', price: 40.00, gst_rate: 5.0, unit: 'cup', is_available: true)

p_burger = Product.create!(tenant: tenant2, category: c_cafe, name: 'Veggie Burger', price: 150.00, gst_rate: 18.0, unit: 'piece', is_available: true)

# Update stock levels
Inventory.find_by(product_id: p_paneer.id)&.update!(stock_qty: 50, low_stock_threshold: 10)
Inventory.find_by(product_id: p_biryani.id)&.update!(stock_qty: 30, low_stock_threshold: 5)
Inventory.find_by(product_id: p_butter_chicken.id)&.update!(stock_qty: 40, low_stock_threshold: 8)
Inventory.find_by(product_id: p_naan.id)&.update!(stock_qty: 100, low_stock_threshold: 15)
Inventory.find_by(product_id: p_chai.id)&.update!(stock_qty: 200, low_stock_threshold: 20)

Inventory.find_by(product_id: p_burger.id)&.update!(stock_qty: 25, low_stock_threshold: 5)

puts "Created #{Product.count} products with stock initialized"

puts 'Creating customers...'
cust_john = Customer.create!(tenant: tenant1, name: 'John Doe', phone: '9876543210', email: 'john@example.com', loyalty_points: 12)
cust_jane = Customer.create!(tenant: tenant1, name: 'Jane Smith', phone: '9876543211', email: 'jane@example.com', loyalty_points: 45)
puts "Created #{Customer.count} customers"

puts 'Creating sample orders...'
# 1. Draft Order on Table 1 (unsubmitted)
o1 = Order.create!(tenant: tenant1, user: admin, dining_table: t1, status: :draft)
OrderService.add_item_to_order!(o1, p_paneer, 2, p_paneer.price, 'Less spicy')
OrderService.add_item_to_order!(o1, p_naan, 3, p_naan.price)

# 2. Active Pending Order on Table 2 (sent to kitchen, inventory deducted)
o2 = Order.create!(tenant: tenant1, user: admin, dining_table: t2, status: :draft)
OrderService.add_item_to_order!(o2, p_biryani, 2, p_biryani.price)
OrderService.add_item_to_order!(o2, p_chai, 4, p_chai.price)
OrderService.transition_to_active!(o2)

# 3. Completed Checkout Order (loyalty points awarded, table freed)
o3 = Order.create!(tenant: tenant1, user: admin, dining_table: t3, status: :draft, customer: cust_john)
OrderService.add_item_to_order!(o3, p_butter_chicken, 1, p_butter_chicken.price)
OrderService.add_item_to_order!(o3, p_naan, 2, p_naan.price)
OrderService.transition_to_active!(o3)
OrderService.complete_payment!(o3, :cash, 5.0, 2.5, 'Cash payment with 5% discount')

puts "Created #{Order.count} orders with KOTs and inventory tracking verified!"
puts 'Seeding completed successfully! 🎉'
