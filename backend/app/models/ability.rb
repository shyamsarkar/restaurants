# frozen_string_literal: true

class Ability
  include CanCan::Ability

  def initialize(user, tenant)
    return unless user && tenant

    membership = user.memberships.find_by(tenant: tenant)
    return unless membership

    case membership.role.to_sym
    when :owner, :admin
      can :manage, :all
    when :manager
      can :manage, Category
      can :manage, Product
      can :manage, DiningTable
      can :manage, Order
      can :manage, OrderItem
      can :manage, Kot
      can :manage, Customer
      can :manage, AuditLog
      can :manage, RestaurantInfo
      can :read, User
    when :cashier
      can :read, Category
      can :read, Product
      can :manage, DiningTable
      # Cashier can manage orders (including checkout/cancel)
      can :manage, Order
      can :manage, OrderItem
      can :manage, Kot
      can :manage, Customer
      can :read, AuditLog
      can :read, RestaurantInfo
      can :read, User
    when :waiter
      can :read, Category
      can :read, Product
      can :read, DiningTable
      can :read, RestaurantInfo
      # Waiter can read, create, and update orders, but cannot pay or cancel them
      can :read, Order
      can :create, Order
      can :update, Order
      can :manage, OrderItem
      can :manage, Kot
      can :manage, Customer
      can :read, User
    end
  end
end
