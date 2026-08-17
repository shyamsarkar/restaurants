# frozen_string_literal: true

class Ability
  include CanCan::Ability

  def initialize(user, tenant)
    return unless user && tenant

    membership = user.memberships.find_by(tenant: tenant)
    return unless membership

    case membership.role.to_sym
    when :owner
      can :manage, :all
    when :admin
      can :manage, :all
      cannot [:create, :update, :destroy, :activate, :deactivate], Tenant
      can :read, Tenant, id: membership.tenant_id
    when :manager
      can :manage, Category
      can :manage, Product
      can :manage, DiningTable
      can :manage, Order
      can :manage, OrderItem
      can :manage, Kot
      can :manage, Customer
      can :manage, RestaurantInfo
      can :read, :report
      can :read, Tenant, id: membership.tenant_id
    when :cashier
      can :read, Category
      can :read, Product
      can :manage, DiningTable
      # Cashier can manage orders (including checkout/cancel)
      can :manage, Order
      can :manage, OrderItem
      can :manage, Kot
      can :manage, Customer
      can :read, RestaurantInfo
      can :read, Tenant, id: membership.tenant_id
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
      can :read, Tenant, id: membership.tenant_id
    end
  end
end
