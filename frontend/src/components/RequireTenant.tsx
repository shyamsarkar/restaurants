import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

export const RequireTenant = ({ children }: { children?: JSX.Element }) => {
  const tenantId = useAuthStore((state) => state.tenantId);

  if (!tenantId) {
    return <Navigate to="/select-restaurant" replace />;
  }

  return children ?? <Outlet />;
};
