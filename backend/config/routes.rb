# frozen_string_literal: true

Rails.application.routes.draw do
  devise_for :users,
             controllers: {
               sessions: 'api/v1/users/sessions'
             },
             defaults: { format: :json }

  namespace :api do
    namespace :v1 do
      resources :tenants, except: [:destroy] do
        member do
          post :activate
          post :deactivate
        end
      end
      delete "/tenants/:id", to: "tenants#destroy"
      resources :users, only: %i[index show create update destroy]
      patch "/users/password", to: "users#update_password"
      resources :categories
      resources :products
      resources :customers
      resources :restaurant_infos, only: %i[show update]

      resources :dining_tables do
        member do
          post :transfer
          post :merge
        end
      end

      resources :order_items, only: %i[index create update destroy] do
        member do
          post :cancel
        end
      end

      resources :orders, only: %i[index show create update] do
        member do
          post :kot
          post :pay
          post :cancel
        end
      end

      resources :kots, only: %i[index update]

      resources :reports, only: %i[index]
    end
  end
end
