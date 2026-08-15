# frozen_string_literal: true

class TenantSetupService
  CATEGORIES = [
    { name: "Starters", description: "Appetizers and quick bites" },
    { name: "Main Course", description: "Heavy meals and curries" },
    { name: "Breads", description: "Indian breads cooked in tandoor" },
    { name: "South Indian", description: "Authentic dishes from Southern India" },
    { name: "Indo-Chinese", description: "Fusion Chinese dishes with Indian flavors" },
    { name: "Beverages", description: "Cold and hot drinks" },
    { name: "Desserts", description: "Sweets and ice creams" }
  ].freeze

  PRODUCTS = [
    { name: "Paneer Tikka", price: 250.0, gst_rate: 5.0, is_veg: true, category: "Starters" },
    { name: "Crispy Corn", price: 180.0, gst_rate: 5.0, is_veg: true, category: "Starters" },
    { name: "French Fries", price: 120.0, gst_rate: 5.0, is_veg: true, category: "Starters" },
    { name: "Chicken Tikka", price: 320.0, gst_rate: 5.0, is_veg: false, category: "Starters" },
    { name: "Chilli Chicken", price: 290.0, gst_rate: 5.0, is_veg: false, category: "Starters" },
    { name: "Fish Tikka", price: 380.0, gst_rate: 5.0, is_veg: false, category: "Starters" },
    { name: "Hara Bhara Kebab", price: 220.0, gst_rate: 5.0, is_veg: true, category: "Starters" },
    { name: "Chicken 65", price: 300.0, gst_rate: 5.0, is_veg: false, category: "Starters" },
    { name: "Paneer Butter Masala", price: 350.0, gst_rate: 5.0, is_veg: true, category: "Main Course" },
    { name: "Dal Makhani", price: 280.0, gst_rate: 5.0, is_veg: true, category: "Main Course" },
    { name: "Veg Dum Biryani", price: 260.0, gst_rate: 5.0, is_veg: true, category: "Main Course" },
    { name: "Butter Chicken (Murgh Makhani)", price: 420.0, gst_rate: 5.0, is_veg: false, category: "Main Course" },
    { name: "Chicken Biryani", price: 380.0, gst_rate: 5.0, is_veg: false, category: "Main Course" },
    { name: "Mutton Rogan Josh", price: 480.0, gst_rate: 5.0, is_veg: false, category: "Main Course" },
    { name: "Palak Paneer", price: 330.0, gst_rate: 5.0, is_veg: true, category: "Main Course" },
    { name: "Chana Masala", price: 240.0, gst_rate: 5.0, is_veg: true, category: "Main Course" },
    { name: "Tandoori Roti", price: 30.0, gst_rate: 5.0, is_veg: true, category: "Breads" },
    { name: "Butter Naan", price: 50.0, gst_rate: 5.0, is_veg: true, category: "Breads" },
    { name: "Garlic Naan", price: 70.0, gst_rate: 5.0, is_veg: true, category: "Breads" },
    { name: "Lachha Paratha", price: 60.0, gst_rate: 5.0, is_veg: true, category: "Breads" },
    { name: "Masala Dosa", price: 160.0, gst_rate: 5.0, is_veg: true, category: "South Indian" },
    { name: "Plain Dosa", price: 120.0, gst_rate: 5.0, is_veg: true, category: "South Indian" },
    { name: "Idli Sambar (2 pcs)", price: 90.0, gst_rate: 5.0, is_veg: true, category: "South Indian" },
    { name: "Medu Vada (2 pcs)", price: 100.0, gst_rate: 5.0, is_veg: true, category: "South Indian" },
    { name: "Onion Uttapam", price: 140.0, gst_rate: 5.0, is_veg: true, category: "South Indian" },
    { name: "Chicken Chettinad", price: 360.0, gst_rate: 5.0, is_veg: false, category: "South Indian" },
    { name: "Veg Hakka Noodles", price: 220.0, gst_rate: 5.0, is_veg: true, category: "Indo-Chinese" },
    { name: "Chicken Hakka Noodles", price: 260.0, gst_rate: 5.0, is_veg: false, category: "Indo-Chinese" },
    { name: "Veg Fried Rice", price: 210.0, gst_rate: 5.0, is_veg: true, category: "Indo-Chinese" },
    { name: "Chicken Fried Rice", price: 250.0, gst_rate: 5.0, is_veg: false, category: "Indo-Chinese" },
    { name: "Gobi Manchurian (Dry/Gravy)", price: 230.0, gst_rate: 5.0, is_veg: true, category: "Indo-Chinese" },
    { name: "Chilli Paneer (Dry/Gravy)", price: 280.0, gst_rate: 5.0, is_veg: true, category: "Indo-Chinese" },
    { name: "Chicken Lollipop", price: 320.0, gst_rate: 5.0, is_veg: false, category: "Indo-Chinese" },
    { name: "Sweet Corn Veg Soup", price: 150.0, gst_rate: 5.0, is_veg: true, category: "Indo-Chinese" },
    { name: "Mineral Water (1L)", price: 40.0, gst_rate: 5.0, is_veg: true, category: "Beverages" },
    { name: "Fresh Lime Soda", price: 90.0, gst_rate: 5.0, is_veg: true, category: "Beverages" },
    { name: "Mango Lassi", price: 120.0, gst_rate: 5.0, is_veg: true, category: "Beverages" },
    { name: "Cold Coffee", price: 150.0, gst_rate: 5.0, is_veg: true, category: "Beverages" },
    { name: "Masala Chai", price: 60.0, gst_rate: 5.0, is_veg: true, category: "Beverages" },
    { name: "Gulab Jamun (2 pcs)", price: 90.0, gst_rate: 5.0, is_veg: true, category: "Desserts" },
    { name: "Rasmalai (2 pcs)", price: 140.0, gst_rate: 5.0, is_veg: true, category: "Desserts" },
    { name: "Sizzling Brownie with Ice Cream", price: 220.0, gst_rate: 5.0, is_veg: true, category: "Desserts" },
    { name: "Vanilla Ice Cream", price: 80.0, gst_rate: 5.0, is_veg: true, category: "Desserts" }
  ].freeze

  TABLES = (1..10).map { |n| "Table #{n}" }.freeze

  def self.setup!(tenant)
    ActsAsTenant.with_tenant(tenant) do
      setup_categories_and_products
      setup_tables
    end
  end

  class << self
    private

    def setup_categories_and_products
      categories = {}
      CATEGORIES.each do |cdata|
        categories[cdata[:name]] = Category.find_or_create_by!(name: cdata[:name]) do |c|
          c.description = cdata[:description]
          c.status = :active
        end
      end

      PRODUCTS.each do |pdata|
        category = categories[pdata[:category]]
        Product.find_or_create_by!(name: pdata[:name]) do |p|
          p.price = pdata[:price]
          p.gst_rate = pdata[:gst_rate]
          p.is_veg = pdata[:is_veg]
          p.is_available = true
          p.category = category
          p.unit = "plate"
        end
      end
    end

    def setup_tables
      TABLES.each do |tname|
        DiningTable.find_or_create_by!(name: tname)
      end
    end
  end
end
