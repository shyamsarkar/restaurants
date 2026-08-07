import { RouteObject } from 'react-router-dom';

import AdminLayout from '@/components/AdminLayout';
import { RequireAuth } from '@/components/RequireAuth';
import { RequireTenant } from '@/components/RequireTenant';

import { HomePage } from '@/pages/HomePage';
import { Login } from '@/pages/Login';
import { NotFound } from '@/pages/NotFound';

import Restaurants from '@/pages/Restaurants';
import { OrderPage } from '@/pages/Order';
import { Tables } from '@/pages/Tables';
import { Kitchen } from '@/pages/Kitchen';
import { MenuEditor } from '@/pages/Menu';
import { Customers } from '@/pages/Customers';
import { Reports } from '@/pages/Reports';
import { Settings } from '@/pages/Settings';
import { ChangePassword } from '@/pages/ChangePassword';

export const routes: RouteObject[] = [
  {
    path: '/login',
    element: <Login />,
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/select-restaurant',
        element: <HomePage />,
      },
      {
        path: '/change-password',
        element: <ChangePassword />,
      },
      {
        element: <RequireTenant />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { path: '/', element: <Restaurants /> },
              { path: 'orders', element: <OrderPage /> },
              { path: 'tables', element: <Tables /> },
              { path: 'kitchen', element: <Kitchen /> },
              { path: 'menu', element: <MenuEditor /> },
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
