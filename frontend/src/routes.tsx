import { RouteObject } from 'react-router-dom';

import AdminLayout from '@/components/AdminLayout';
import { RequireAuth } from '@/components/RequireAuth';

import { HomePage } from '@/pages/HomePage';
import { Login } from '@/pages/Login';
import { NotFound } from '@/pages/NotFound';

import Restaurants from '@/pages/Restaurants';
import { OrderPage } from '@/pages/Order';
import { Tables } from '@/pages/Tables';
import { Kitchen } from '@/pages/Kitchen';
import { MenuEditor } from '@/pages/Menu';
import { InventoryPage } from '@/pages/Inventory';
import { Customers } from '@/pages/Customers';
import { Reports } from '@/pages/Reports';
import { Settings } from '@/pages/Settings';

export const routes: RouteObject[] = [
  {
    path: '/login',
    element: <Login />,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        element: <AdminLayout />,
        children: [
          {
            path: 'restaurants',
            children: [
              { index: true, element: <Restaurants /> },
              { path: 'orders', element: <OrderPage /> },
              { path: 'tables', element: <Tables /> },
              { path: 'kitchen', element: <Kitchen /> },
              { path: 'menu', element: <MenuEditor /> },
              { path: 'inventory', element: <InventoryPage /> },
              { path: 'customers', element: <Customers /> },
              { path: 'reports', element: <Reports /> },
              { path: 'settings', element: <Settings /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
];
