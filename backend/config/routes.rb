# frozen_string_literal: true

require 'sidekiq/web'

Rails.application.routes.draw do
  mount Sidekiq::Web => '/sidekiq'

  devise_for :users,
             controllers: {
               sessions: 'api/v1/users/sessions'
             },
             defaults: { format: :json }

  namespace :api do
    namespace :v1 do
      resources :tenants, only: %i[index show create update destroy]
      resources :users, only: %i[index show create update destroy]
      resources :categories
      resources :products
      resources :customers
      resources :restaurant_infos, only: %i[show update]
      resources :audit_logs, only: %i[index]

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

      resources :inventories, only: %i[index update] do
        collection do
          post :purchase
          get :history
        end
      end

      resources :reports, only: %i[index]
    end
  end
end
