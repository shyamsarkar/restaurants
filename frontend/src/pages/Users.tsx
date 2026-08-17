import React, { useEffect, useMemo, useState } from "react";
import { Add, Delete, Edit, Search } from "@mui/icons-material";
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
  User,
} from "@/services/api.service";

import { useAuthStore } from "@/stores/auth.store";

type UserRole = "owner" | "admin" | "manager" | "cashier" | "waiter";

const initialForm = {
  first_name: "",
  last_name: "",
  email: "",
  role: "waiter" as UserRole,
  is_active: true,
  password: "",
  password_confirmation: "",
};

const roleLabelMap: Record<UserRole, string> = {
  owner: "Owner",
  admin: "Administrator",
  manager: "Manager",
  cashier: "Cashier",
  waiter: "Waiter",
};

const Users: React.FC = () => {
  const { tenantId, tenants } = useAuthStore();
  const currentTenantRole = useMemo(() => {
    return tenants.find((t) => String(t.id) === String(tenantId))?.role || "waiter";
  }, [tenantId, tenants]);

  const availableRoles: UserRole[] = useMemo(() => {
    if (currentTenantRole === "owner") {
      return ["owner", "admin", "manager", "cashier", "waiter"];
    }
    return ["admin", "manager", "cashier", "waiter"];
  }, [currentTenantRole]);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [form, setForm] = useState(initialForm);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
      setErrorMessage("");
    } catch (error) {
      console.error("Error fetching users:", error);
      setErrorMessage("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ");
      const matchesQuery =
        !query ||
        fullName.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase());

      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.is_active) ||
        (statusFilter === "inactive" && !user.is_active);

      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [users, query, roleFilter, statusFilter]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (editingId === null && !form.password) {
      setErrorMessage("Password is required when creating a user.");
      return;
    }

    if (form.password && form.password !== form.password_confirmation) {
      setErrorMessage("Password and confirmation must match.");
      return;
    }

    try {
      if (editingId === null) {
        await createUser({
          email: form.email,
          first_name: form.first_name,
          last_name: form.last_name,
          is_active: form.is_active,
          role: form.role,
          password: form.password,
          password_confirmation: form.password_confirmation,
        });
      } else {
        await updateUser(editingId, {
          email: form.email,
          first_name: form.first_name,
          last_name: form.last_name,
          is_active: form.is_active,
          role: form.role,
          ...(form.password
            ? {
              password: form.password,
              password_confirmation: form.password_confirmation,
            }
            : {}),
        });
      }

      await fetchUsers();
      resetForm();
    } catch (error) {
      console.error("Failed to save user:", error);
      setErrorMessage("Failed to save user.");
    }
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setForm({
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      email: user.email,
      role: (user.role ?? "waiter") as UserRole,
      is_active: user.is_active,
      password: "",
      password_confirmation: "",
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      await deleteUser(id);
      await fetchUsers();
      if (editingId === id) resetForm();
    } catch (error) {
      console.error("Failed to delete user:", error);
      setErrorMessage("Failed to delete user.");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Users</h1>
        <p className="text-gray-600">Manage your team members and their permissions.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="First name"
              value={form.first_name}
              onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <input
              type="text"
              placeholder="Last name"
              value={form.last_name}
              onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <select
              value={form.role}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, role: e.target.value as UserRole }))
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {availableRoles.map((r) => (
                <option key={r} value={r}>
                  {roleLabelMap[r]}
                </option>
              ))}
            </select>
            <input
              type="password"
              placeholder={editingId === null ? "Temporary Password" : "New password (optional)"}
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required={editingId === null}
            />
            <input
              type="password"
              placeholder={
                editingId === null
                  ? "Confirm password"
                  : "Confirm new password (optional)"
              }
              value={form.password_confirmation}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, password_confirmation: e.target.value }))
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required={editingId === null}
            />
            <label className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, is_active: e.target.checked }))
                }
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>

          {editingId === null && (
            <p className="text-xs text-gray-500">
              * User will be required to change password on first login
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Add className="w-4 h-4" />
              <span>{editingId === null ? "Add User" : "Update User"}</span>
            </button>
            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="owner">Owner</option>
            <option value="admin">Administrator</option>
            <option value="manager">Manager</option>
            <option value="cashier">Cashier</option>
            <option value="waiter">Waiter</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {errorMessage}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-gray-900">User</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900">Role</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900">Status</th>
                <th className="text-right py-4 px-6 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading && (
                <tr>
                  <td colSpan={4} className="py-6 px-6 text-gray-500">
                    Loading users...
                  </td>
                </tr>
              )}
              {!loading && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 px-6 text-gray-500">
                    No users found.
                  </td>
                </tr>
              )}
              {!loading &&
                filteredUsers.map((user) => {
                  const fullName =
                    [user.first_name, user.last_name].filter(Boolean).join(" ") || "-";

                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-medium text-gray-900 flex items-center gap-2">
                            {fullName}
                            {user.must_change_password && (
                              <span className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded bg-yellow-100 text-yellow-800">
                                Password change pending
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          {user.role ? roleLabelMap[user.role] : "Unknown"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${user.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                            }`}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                            title="Edit user"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                            title="Delete user"
                          >
                            <Delete className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Users;
