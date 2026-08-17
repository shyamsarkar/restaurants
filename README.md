# MealDesk

Multi-tenant restaurant billing system built with Ruby on Rails 8, ReactJS 19, and PostgreSQL 16.

## Tech Stack
- **Backend**: Rails 8.0.4, Ruby 4.0.1, PostgreSQL 16.14
- **Frontend**: React 19.2.8, TypeScript, Vite 8.2.0, MUI 9.3.1, Tailwind CSS 4.3.3, Zustand 5.0.14
- **Auth**: Devise (session cookie authentication)
- **Multi-tenancy**: acts_as_tenant (row-level isolation via `tenant_id`)
- **Authorization**: CanCanCan 3.6.1

## Prerequisites
- Ruby 4.0.1+
- PostgreSQL 16+
- Node.js 20+ or Bun

## Setup — Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Copy the environment variables template and configure your values:
   ```bash
   cp .env.example .env
   ```
3. Install gem dependencies:
   ```bash
   bundle install
   ```
4. Create, migrate, and seed the database:
   ```bash
   bin/rails db:create db:migrate db:seed
   ```
   5. Start the Rails application server:
   ```bash
   bin/rails server
   ```

## Setup — Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Copy the environment variables template:
   ```bash
   cp .env.example .env
   ```
3. Install frontend dependencies (Node npm or Bun):
   ```bash
   npm install  # or bun install
   ```
4. Start the Vite development server:
   ```bash
   npm run dev  # or bun run dev
   ```
   *The development server starts on `http://localhost:5173`.*

## Architecture — Multi-Tenancy
- **Row-level isolation**: Enforced using the `acts_as_tenant` gem.
- **Tenant scoping**: Every tenant-scoped model declares `acts_as_tenant :tenant`.
- **Context Resolution**: Resolved per-request in [ApplicationController](file:///home/shyam/Projects/Restaurants/backend/app/controllers/application_controller.rb#L24-L46) using `before_action :set_current_context`. It reads the `X-Tenant-ID` header, verifies the user has a valid `Membership` for that tenant, and scopes the context via `ActsAsTenant.current_tenant = Current.tenant`.
- **Global Models (Not Scoped)**:
  - `Tenant` (the tenant representation)
  - `User` (global user accounts registry)

## Roles & Permissions
- **owner**: Full manager access across all models, plus the ability to create, update, activate, and deactivate Tenants.
- **admin**: Full operational access across all models, but cannot manage or toggle Tenant configurations.
- **manager**: Can manage menu items (Products), categories, dining tables, orders, KOTs, and customers. Can read staff directory and view sales reports.
- **cashier**: Can manage tables, orders, bill checkouts/cancellations, KOTs, and customers. Cannot manage products or view report analytics.
- **waiter**: Can read tables and menus; can create and update orders (add items, notes, and trigger KOTs); cannot complete payments or cancel orders.

## Key Flows

### Owner Onboarding
1. Run `db:seed` to initialize the global owner account.
2. The owner logs in and selects or creates a tenant branch (POST `/api/v1/tenants`).
3. Tenant creation triggers `TenantSetupService` to automatically seed 7 default menu categories, 43 products, and 10 default dining tables (Table 1 - Table 10).
4. The owner creates additional staff users via the Users directory.

### Staff Onboarding
1. The Owner/Admin creates a new user profile with a designated role and a temporary password.
2. The `must_change_password` flag is set to `true` by default on creation.
3. Upon first login, the staff user is intercepted by the frontend router (`RequireAuth` wrapper) and redirected to `/change-password`.
4. Once they enter a new password, the flag is cleared on the backend, granting full operational access.

### Tenant Lifecycle
- **Create**: Automatically seeded with default menu structures, active by default.
- **Deactivate**: Soft-deactivates the tenant (status: `inactive`), blocking API access for all members (returns `403 Forbidden`).
- **Activate**: Updates status back to `active`, restoring member access.
- **Delete**: Soft-blocked. Calling DELETE `/api/v1/tenants/:id` returns a `405 Method Not Allowed` payload.

## Environment Variables

### Backend (`backend/.env`)
- `PORT` — Port number for the Rails server (defaults to `3000`).
- `DB_HOST_PSQL`, `DB_USER_PSQL`, `DB_PASS_PSQL`, `DB_NAME_PSQL`, `DB_PORT_PSQL` — PostgreSQL connection credentials.
- `CORS_ORIGINS` — Comma-separated list of allowed client host URLs (e.g. `http://localhost:5173`).
- `DEFAULT_OWNER_EMAIL` / `DEFAULT_OWNER_PASSWORD` — Owner credentials loaded during database seeding.

### Frontend (`frontend/.env`)
- `VITE_API_BASE_URL` — Base HTTP address of the Rails backend (typically `http://localhost:3000`).

## API Structure
- **Base Endpoint Namespace**: `/api/v1/`
- **Versioning**: Path-based URI versioning.
- **Payload format**: Standard RESTful JSON formats.
- **Session handling**: Cookie-based Rails session store (`withCredentials: true` required on Axios).
- **Tenant Context**: Enforced via `X-Tenant-ID` header.

## Key Endpoints
- `POST /users/sign_in` — User login
- `PATCH /api/v1/users/password` — Password update (changes temporary password)
- `GET/POST /api/v1/tenants` — List/create restaurant branches
- `POST /api/v1/tenants/:id/activate` — Activate tenant branch
- `POST /api/v1/tenants/:id/deactivate` — Soft-deactivate tenant branch
- `GET/POST/PATCH/DELETE /api/v1/users` — Staff directory CRUD
- `GET/POST/PATCH/DELETE /api/v1/categories` — Menu categories management
- `GET/POST/PATCH/DELETE /api/v1/products` — Menu items (products) management
- `GET/POST/PATCH/DELETE /api/v1/customers` — Customer CRM directory
- `GET/POST/PATCH /api/v1/orders` — Orders management
- `POST /api/v1/orders/:id/kot` — Send draft order items to the kitchen (issues KOT tickets)
- `POST /api/v1/orders/:id/pay` — Settle and close an order (checkout)
- `POST /api/v1/orders/:id/cancel` — Cancel an active order
- `GET /api/v1/dining_tables` — Tables listing
- `POST /api/v1/dining_tables/:id/transfer` — Move order to a different table
- `POST /api/v1/dining_tables/:id/merge` — Merge active orders between two tables
- `GET /api/v1/reports` — Date-ranged sales metrics report

## Database schema

- **Total migrations**: 13
- **Tables**:
  - `tenants`
  - `users`
  - `memberships`
  - `restaurant_infos`
  - `categories`
  - `products`
  - `dining_tables`
  - `orders`
  - `order_items`
  - `order_item_cancellations`
  - `kots`
  - `kot_items`
  - `customers`

## Development Notes
- **Testing**: No test suite is currently configured (RSpec + FactoryBot planned).
- **Docker**: Dockerfile or compose files are not present.
- **CI/CD**: Workflows or pipeline triggers are not present.

## Completed Tasks & Feature Updates

### 1. Tenant Admin User Creation (Owner Feature) — [Completed]
- **Goal**: Enable tenant owners to add and manage `admin` users for their specific tenant branch.
- **Details**: Updated backend authorization rules (`UsersController` & `Ability`) and frontend user management UI (`Users.tsx`) to allow tenant owners to create and assign `admin` users scoped to the active tenant.

### 2. Admin User Management Permissions — [Completed]
- **Goal**: Allow `admin` role users to create and manage lower-tier staff users (`manager`, `cashier`, `waiter`).
- **Details**: Configured CanCanCan abilities and controller role hierarchy guards so `admin` users can manage staff directory members (`/api/v1/users`) while restricting non-owners from creating or mutating `owner` memberships.

### 3. Sidebar User Profile & Branch Switcher Layout — [Completed]
- **Goal**: Update the sidebar profile icon and reposition the "Change Branch" action.
- **Details**:
  - Replaced the hardcoded "System Operator" label on the sidebar login icon with dynamic logged-in user details (`User Name`, `Role`, and initials derived from `useAuthStore`).
  - Positioned the `TenantSwitcher` cleanly in the top header section of the sidebar navigation.

### 4. Billing POS Screen Category Layout & Cart Overflow Fix — [Completed]
- **Goal**: Fix UI overflow issue on the POS Billing screen when multiple categories are added.
- **Details**:
  - Wrapped the category filter bar in a scrollable horizontal flex container (`overflow-x-auto`, `whiteSpace: 'nowrap'`) to handle any number of menu categories cleanly.
  - Enforced rigid flex layout constraints on the left product grid and right Shopping Cart panel (`w-[360px] md:w-[400px] lg:w-[440px] flex-shrink-0`) so the cart stays pinned within viewport boundaries without being pushed off-screen.

