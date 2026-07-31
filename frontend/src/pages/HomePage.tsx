import React, { useEffect, useState } from 'react';
import { Storefront } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ResponsiveAppBar from '@/components/Home/AppBar';
import { getTenants } from '@/services/api.service';
import { useAuthStore } from '@/stores/auth.store';

interface Tenant {
  id: string;
  name: string;
  role: string;
}

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const setTenantId = useAuthStore((s) => s.setTenantId);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const data = await getTenants();
        setTenants(data);
        
        const hasOwnerRole = data.some(t => t.role === 'owner');
        if (!hasOwnerRole && data.length > 0) {
          // Non-owners are immediately redirected to the POS dashboard
          navigate('/restaurants', { replace: true });
        }
      } catch (err) {
        console.error('Failed to fetch tenants:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTenants();
  }, [navigate]);

  const handleSelectTenant = (id: string) => {
    setTenantId(id);
    navigate('/restaurants');
  };

  const isOwner = tenants.some(t => t.role === 'owner');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="text-sm font-medium text-slate-500">Loading your dashboard...</p>
      </div>
    );
  }

  // Prevent flash of content for non-owner roles during redirection
  if (!isOwner) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <ResponsiveAppBar />
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        {/* Page Header */}
        <div className="mb-10 text-left">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Select Restaurant
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Choose one of your restaurant branches to manage its POS billing, inventory, and staff.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tenants.map(tenant => (
            <div
              key={tenant.id}
              onClick={() => handleSelectTenant(tenant.id)}
              className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-slate-100 hover:border-amber-300 hover:scale-[1.02] p-6 flex flex-col justify-between min-h-[220px]"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 group-hover:bg-amber-100 transition-colors duration-200">
                    <Storefront className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 capitalize">
                    {tenant.role}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-700 transition-colors duration-200">
                  {tenant.name}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  Manage orders, bills, tables, menu editing, inventories and staff for this branch.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-semibold text-amber-600 group-hover:text-amber-700">
                <span>Manage Branch</span>
                <span className="transform translate-x-0 group-hover:translate-x-1.5 transition-transform duration-200">→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};