import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Storefront, SwapHoriz } from '@mui/icons-material';
import { useAuthStore } from '@/stores/auth.store';
import { useCommonStore } from '@/stores/common.store';
import { useToast } from '@/contexts/ToastContext';

export const TenantSwitcher: React.FC = () => {
  const navigate = useNavigate();
  const { tenants, tenantId, switchTenant, fetchTenants, user } = useAuthStore();
  const showSidebar = useCommonStore((state) => state.showSidebar);
  const { showToast } = useToast();

  useEffect(() => {
    if (!tenants || tenants.length === 0) {
      fetchTenants();
    }
  }, [fetchTenants, tenants]);

  // Filter tenants where the user has owner privileges and status is active (or not inactive)
  const ownerTenants = tenants.filter(
    (t) => t.role === 'owner' && t.status !== 'inactive'
  );

  // Only render if logged in user is an owner on multiple active branches
  if (!user || ownerTenants.length <= 1) {
    return null;
  }

  const handleTenantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTenantId = e.target.value;
    // Guard: If empty or same tenant selected, do nothing
    if (!newTenantId || String(newTenantId) === String(tenantId)) {
      return;
    }

    const targetTenant = ownerTenants.find((t) => String(t.id) === String(newTenantId));
    switchTenant(newTenantId);
    showToast(`Switched branch to ${targetTenant?.name || 'new branch'}`, 'success');

    // Refresh current route via React Router navigation (remounts active route under new tenant header)
    navigate(0);
  };

  const currentTenant = ownerTenants.find((t) => String(t.id) === String(tenantId));

  if (!showSidebar) {
    return (
      <div className="px-2 py-3 border-b border-slate-800 flex justify-center group relative">
        <div className="w-9 h-9 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-amber-400 transition-colors cursor-pointer">
          <Storefront className="w-5 h-5" />
        </div>
        <div className="absolute left-full ml-3 px-2 py-1 bg-slate-800 text-slate-100 text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none">
          {currentTenant?.name || 'Switch Branch'}
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-3 border-b border-slate-800">
      <div className="relative flex items-center">
        <select
          value={tenantId || ''}
          onChange={handleTenantChange}
          className="w-full bg-slate-800/90 hover:bg-slate-800 text-slate-100 text-xs font-semibold rounded-lg px-2.5 py-2 border border-slate-700/80 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none cursor-pointer appearance-none pr-8 transition-colors truncate"
        >
          {ownerTenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id} className="bg-slate-900 text-slate-100 py-1">
              {tenant.name}
            </option>
          ))}
        </select>
        <SwapHoriz className="w-4 h-4 text-slate-400 absolute right-2.5 pointer-events-none" />
      </div>
    </div>
  );
};

export default TenantSwitcher;
