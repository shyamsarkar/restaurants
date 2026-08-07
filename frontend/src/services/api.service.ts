import api from "@/lib/axios";
import { AuthUser } from "@/stores/auth.store";
import { AxiosError } from "axios";

interface ApiRequestParams {
  method: "get" | "post" | "put" | "patch" | "delete";
  url: string;
  data?: unknown;
  params?: unknown;
}

export interface User {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  role: "owner" | "admin" | "manager" | "cashier" | "waiter" | null;
  must_change_password?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserPayload {
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  role: "owner" | "admin" | "manager" | "cashier" | "waiter";
  password: string;
  password_confirmation: string;
}

export interface UpdateUserPayload {
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  role: "owner" | "admin" | "manager" | "cashier" | "waiter";
  password?: string;
  password_confirmation?: string;
}

export interface DiningTable {
  id: number;
  name: string;
  status: "free" | "occupied" | "billed";
  current_order_id: number | null;
  merged_into_id: number | null;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  status?: string;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  gst_rate: number;
  image_path?: string;
  is_available: boolean;
  category_id: number;
  is_veg: boolean;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  loyalty_points: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  name: string;
  quantity: number;
  price: number;
  gst_rate: number;
  notes?: string;
  kot_id?: number | null;
  product?: Product;
}

export interface Order {
  id: number;
  dining_table_id: number | null;
  customer_id: number | null;
  subtotal: number;
  tax: number;
  discount: number;
  service_charge: number;
  round_off: number;
  total: number;
  status: "draft" | "pending" | "active" | "billed" | "completed" | "cancelled";
  payment_mode: "cash" | "upi" | "card" | "mixed" | "nc" | "none";
  order_type?: "dine_in" | "parcel";
  notes?: string;
  hold_name?: string | null;
  cancelled_by?: string | null;
  cancelled_at?: string | null;
  cancel_reason?: string | null;
  order_items: OrderItem[];
  dining_table?: DiningTable | null;
  customer?: Customer | null;
}

export interface KotItem {
  id: number;
  kot_id: number;
  product_id: number;
  quantity: number;
  notes?: string;
  product?: Product;
}

export interface Kot {
  id: number;
  order_id: number;
  status: "pending" | "preparing" | "ready" | "completed";
  print_count: number;
  created_at: string;
  kot_items: KotItem[];
}

export interface RestaurantInfo {
  id: number;
  name: string;
  logo?: string;
  gstin?: string;
  address?: string;
  phone?: string;
  email?: string;
  receipt_footer?: string;
}
export interface ReportData {
  metrics: {
    total_revenue: number;
    total_orders: number;
    total_tax: number;
    total_discount: number;
  };
  payment_modes: { mode: string; revenue: number }[];
  categories: { category: string; revenue: number }[];
}

export const apiClient = async <TResponse>({
  method,
  url,
  data,
  params,
}: ApiRequestParams): Promise<TResponse> => {
  try {
    const response = await api.request<TResponse>({
      method,
      url,
      data,
      params,
    });
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message?: string }>;
    throw err;
  }
};

// Users
export const loginUser = async (email: string, password: string) => {
  return apiClient<{ user: AuthUser; tenant?: { id: string; name: string }; must_change_password?: boolean; message?: string }>({
    method: "post",
    url: "/users/sign_in",
    data: {
      user: { email, password },
    },
  });
};

export const changePassword = async (data: Record<string, string>) => {
  return apiClient<{ message: string }>({
    method: "patch",
    url: "/api/v1/users/password",
    data,
  });
};

export const logoutUser = async () => {
  return apiClient<void>({
    method: "delete",
    url: "/users/sign_out",
  });
};

export const getUsers = async () => {
  return apiClient<User[]>({
    method: "get",
    url: "/api/v1/users",
  });
};

export const createUser = async (data: CreateUserPayload) => {
  return apiClient<User>({
    method: "post",
    url: "/api/v1/users",
    data,
  });
};

export const updateUser = async (userId: number | string, data: UpdateUserPayload) => {
  return apiClient<User>({
    method: "patch",
    url: `/api/v1/users/${userId}`,
    data,
  });
};

export const deleteUser = async (userId: number | string) => {
  return apiClient<void>({
    method: "delete",
    url: `/api/v1/users/${userId}`,
  });
};

export const getTenants = async () => {
  return apiClient<{ id: string; name: string; role: string }[]>({
    method: "get",
    url: "/api/v1/tenants",
  });
};

export const createTenant = async (data: { name: string }) => {
  return apiClient<{ id: string; name: string; status: string }>({
    method: "post",
    url: "/api/v1/tenants",
    data: { tenant: data },
  });
};

// Dining Tables
export const getDiningTables = async () => {
  return apiClient<DiningTable[]>({
    method: "get",
    url: "/api/v1/dining_tables",
  });
};

export const createDiningTable = async (data: { name: string }) => {
  return apiClient<DiningTable>({
    method: "post",
    url: "/api/v1/dining_tables",
    data,
  });
};

export const updateDiningTable = async (tableId: number | string, data: { name: string }) => {
  return apiClient<DiningTable>({
    method: "patch",
    url: `/api/v1/dining_tables/${tableId}`,
    data,
  });
};

export const deleteDiningTable = async (tableId: number | string) => {
  return apiClient<DiningTable>({
    method: "delete",
    url: `/api/v1/dining_tables/${tableId}`,
  });
};

export const transferTable = async (tableId: number, targetTableId: number) => {
  return apiClient<{ success: boolean }>({
    method: "post",
    url: `/api/v1/dining_tables/${tableId}/transfer`,
    data: { target_table_id: targetTableId },
  });
};

export const mergeTable = async (tableId: number, targetTableId: number) => {
  return apiClient<{ success: boolean }>({
    method: "post",
    url: `/api/v1/dining_tables/${tableId}/merge`,
    data: { target_table_id: targetTableId },
  });
};

// Categories (Menus)
export const getCategories = async () => {
  return apiClient<Category[]>({
    method: "get",
    url: "/api/v1/categories",
  });
};

export const createCategory = async (data: { name: string; description?: string }) => {
  return apiClient<Category>({
    method: "post",
    url: "/api/v1/categories",
    data,
  });
};

export const updateCategory = async (id: number | string, data: { name: string; description?: string }) => {
  return apiClient<Category>({
    method: "patch",
    url: `/api/v1/categories/${id}`,
    data,
  });
};

export const deleteCategory = async (id: number | string) => {
  return apiClient<Category>({
    method: "delete",
    url: `/api/v1/categories/${id}`,
  });
};

// Products (Items)
export const getProducts = async () => {
  return apiClient<Product[]>({
    method: "get",
    url: "/api/v1/products",
  });
};

export const createProduct = async (data: {
  name: string;
  price: number;
  gst_rate: number;
  image_path?: string;
  category_id: number;
  is_available: boolean;
}) => {
  return apiClient<Product>({
    method: "post",
    url: "/api/v1/products",
    data,
  });
};

export const updateProduct = async (
  id: number | string,
  data: {
    name: string;
    price: number;
    gst_rate: number;
    image_path?: string;
    category_id: number;
    is_available: boolean;
  }
) => {
  return apiClient<Product>({
    method: "patch",
    url: `/api/v1/products/${id}`,
    data,
  });
};

export const deleteProduct = async (id: number | string) => {
  return apiClient<Product>({
    method: "delete",
    url: `/api/v1/products/${id}`,
  });
};

// Order Items (Cart actions)
export const getOrderItemsByDiningTable = async (diningTableId: number | string) => {
  return apiClient<{ order_id: number | null; order_items: OrderItem[] }>({
    method: "get",
    url: "/api/v1/order_items",
    params: { dining_table_id: diningTableId },
  });
};

export const addOrderItem = async (
  diningTableId: number | string | null,
  productId: number | string | null,
  price: number,
  quantity = 1,
  notes = "",
  orderId?: number | string | null
) => {
  return apiClient<OrderItem>({
    method: "post",
    url: "/api/v1/order_items",
    data: {
      dining_table_id: diningTableId,
      order_id: orderId,
      order_item: {
        product_id: productId,
        price,
        quantity,
        notes,
      },
    },
  });
};

export const deleteOrderItem = async (orderItemId: number | string) => {
  return apiClient<{ id: number; order_id: number; total_price: number }>({
    method: "delete",
    url: `/api/v1/order_items/${orderItemId}`,
  });
};

export const updateOrderItem = async (orderItemId: number | string, data: { quantity: number }) => {
  return apiClient<OrderItem & { total_price: number }>({
    method: "patch",
    url: `/api/v1/order_items/${orderItemId}`,
    data,
  });
};

export const cancelOrderItem = async (orderItemId: number, quantity: number, reason: string) => {
  return apiClient<{ success: boolean; total_price: number }>({
    method: "post",
    url: `/api/v1/order_items/${orderItemId}/cancel`,
    data: { quantity, reason },
  });
};

// Orders
export const createOrder = async (data: { dining_table_id?: number | null; customer_id?: number | null; order_type?: "dine_in" | "parcel" }) => {
  return apiClient<Order>({
    method: "post",
    url: "/api/v1/orders",
    data,
  });
};

export const getOrders = async (params?: { status?: string; order_type?: string }) => {
  return apiClient<Order[]>({
    method: "get",
    url: "/api/v1/orders",
    params,
  });
};

export const updateOrder = async (id: number | string, data: Partial<Order>) => {
  return apiClient<Order>({
    method: "patch",
    url: `/api/v1/orders/${id}`,
    data,
  });
};

export const getOrder = async (id: number | string) => {
  return apiClient<Order>({
    method: "get",
    url: `/api/v1/orders/${id}`,
  });
};

export const sendKot = async (id: number) => {
  return apiClient<Order>({
    method: "post",
    url: `/api/v1/orders/${id}/kot`,
  });
};


export const payOrder = async (
  id: number,
  data: { payment_mode: string; discount: number; service_charge: number; notes?: string }
) => {
  return apiClient<Order>({
    method: "post",
    url: `/api/v1/orders/${id}/pay`,
    data,
  });
};

export const cancelOrder = async (id: number, reason: string) => {
  return apiClient<Order>({
    method: "post",
    url: `/api/v1/orders/${id}/cancel`,
    data: { reason },
  });
};

// KOTs
export const getKots = async () => {
  return apiClient<Kot[]>({
    method: "get",
    url: "/api/v1/kots",
  });
};

export const updateKotStatus = async (id: number, status: string) => {
  return apiClient<Kot>({
    method: "patch",
    url: `/api/v1/kots/${id}`,
    data: { status },
  });
};



// Customers
export const searchCustomerByPhone = async (phone: string) => {
  return apiClient<Customer>({
    method: "get",
    url: "/api/v1/customers",
    params: { phone },
  });
};

export const getCustomers = async () => {
  return apiClient<Customer[]>({
    method: "get",
    url: "/api/v1/customers",
  });
};

export const createCustomer = async (data: { name: string; phone: string; email?: string }) => {
  return apiClient<Customer>({
    method: "post",
    url: "/api/v1/customers",
    data,
  });
};

// Reports
export const getReports = async (startDate?: string, endDate?: string) => {
  return apiClient<ReportData>({
    method: "get",
    url: "/api/v1/reports",
    params: { start_date: startDate, end_date: endDate },
  });
};

// Settings & Restaurant Info
export const getRestaurantInfo = async () => {
  return apiClient<RestaurantInfo>({
    method: "get",
    url: "/api/v1/restaurant_infos/1",
  });
};

export const updateRestaurantInfo = async (data: Partial<RestaurantInfo>) => {
  return apiClient<RestaurantInfo>({
    method: "patch",
    url: "/api/v1/restaurant_infos/1",
    data,
  });
};

