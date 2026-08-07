import React, { useEffect, useState } from 'react';
import { Storefront, Add } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ResponsiveAppBar from '@/components/Home/AppBar';
import { getTenants, createTenant } from '@/services/api.service';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const data = await getTenants();
      setTenants(data);

      const hasOwnerRole = data.some((t) => t.role === 'owner');
      if (!hasOwnerRole && data.length > 0) {
        // Non-owners are immediately redirected to their assigned POS dashboard
        setTenantId(data[0].id);
        navigate('/', { replace: true });
      }
    } catch (err) {
      console.error('Failed to fetch tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleSelectTenant = (id: string) => {
    setTenantId(id);
    navigate('/');
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName.trim()) return;

    try {
      setCreating(true);
      setError('');
      const created = await createTenant({ name: newTenantName.trim() });
      setIsModalOpen(false);
      setNewTenantName('');
      
      // Auto-select newly created tenant branch and navigate to POS
      setTenantId(created.id);
      navigate('/');
    } catch (err: any) {
      console.error('Failed to create tenant:', err);
      setError(err?.response?.data?.errors?.join(', ') || 'Failed to create restaurant branch');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-600"></div>
        <p className="text-sm font-medium text-slate-500">Loading your restaurants...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <ResponsiveAppBar />
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        {/* Page Header */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-left">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Select Restaurant
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Choose one of your restaurant branches to manage POS billing, tables, menu, and staff.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Add className="w-5 h-5 mr-1.5" />
            Add Restaurant
          </button>
        </div>

        {/* Empty State */}
        {tenants.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-sm">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mx-auto mb-4">
              <Storefront className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Restaurants Found</h3>
            <p className="text-sm text-slate-500 mb-6">
              You haven't set up any restaurant branches yet. Create your first restaurant branch to start managing orders and billing.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors duration-200"
            >
              <Add className="w-5 h-5 mr-2" />
              Create Your First Restaurant
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tenants.map((tenant) => (
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
                      {tenant.role || 'Member'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-700 transition-colors duration-200">
                    {tenant.name}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    Manage orders, bills, tables, menu editing, and staff for this branch.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-semibold text-amber-600 group-hover:text-amber-700">
                  <span>Manage Branch</span>
                  <span className="transform translate-x-0 group-hover:translate-x-1.5 transition-transform duration-200">→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Create Restaurant */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Create New Restaurant</h2>
            <p className="text-xs text-slate-500 mb-6">
              Enter the name of your new restaurant branch. Menu defaults and categories will be automatically set up.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MealDesk Downtown"
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setError('');
                    setNewTenantName('');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTenantName.trim()}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center"
                >
                  {creating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Restaurant'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};