# frozen_string_literal: true

puts 'Cleaning database...'
OrderItemCancellation.delete_all
KotItem.delete_all
OrderItem.delete_all
Kot.delete_all
Order.delete_all
Product.delete_all
Category.delete_all
Customer.delete_all
RestaurantInfo.delete_all
DiningTable.delete_all
Membership.delete_all
Tenant.delete_all
User.delete_all
puts 'Database cleaned!'

email = ENV["DEFAULT_OWNER_EMAIL"] || "owner@mealdesk.com"
password = ENV["DEFAULT_OWNER_PASSWORD"] || "password123"

puts 'Creating owner user...'
owner = User.create!(
  email: email,
  password: password,
  password_confirmation: password,
  first_name: 'Owner',
  last_name: 'User',
  is_active: true
)

puts "Owner user created successfully!"
puts "Email: #{email}"
puts "Password: #{password}"
