import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { toast } from 'react-toastify';
import AdminLayout from '../../components/AdminLayout';
import { LoadingSpinner } from '../../components/LoadingStates';
import { User } from '../../../shared/types';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', role: 'attorney' as User['role'] });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get<{ success: boolean; data: User[] }>('/admin/users');
      if (response.data.success) {
        setUsers(response.data.data || []);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Unable to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.email || !formData.password || !formData.name) {
      toast.error('Email, password, and name are required');
      return;
    }

    try {
      const response = await api.post<{ success: boolean; data: User }>('/admin/users', formData);
      if (response.data.success) {
        toast.success('User created successfully');
        setShowCreateForm(false);
        setFormData({ email: '', password: '', name: '', role: 'attorney' });
        loadUsers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Unable to create user');
    }
  };

  const handleUpdate = async () => {
    if (!editingUser || !formData.email || !formData.name) {
      toast.error('Email and name are required');
      return;
    }

    try {
      const response = await api.put<{ success: boolean; data: User }>(`/admin/users/${editingUser.id}`, {
        email: formData.email,
        name: formData.name,
        role: formData.role,
      });
      if (response.data.success) {
        toast.success('User updated successfully');
        setEditingUser(null);
        setFormData({ email: '', password: '', name: '', role: 'attorney' });
        loadUsers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Unable to update user');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      const response = await api.delete(`/admin/users/${id}`);
      if (response.data.success) {
        toast.success('User deleted successfully');
        loadUsers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Unable to delete user');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <LoadingSpinner size="lg" text="Loading users..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-heading font-bold text-steno-navy mb-2">User Management</h1>
            <p className="text-steno-charcoal-light">
              Create, edit, and manage user accounts and roles.
            </p>
          </div>
          <button
            onClick={() => {
              setShowCreateForm(true);
              setEditingUser(null);
              setFormData({ email: '', password: '', name: '', role: 'attorney' });
            }}
            className="px-4 py-2 bg-steno-navy text-white rounded-lg hover:bg-steno-navy-dark font-medium transition-colors"
          >
            Create User
          </button>
        </div>

        {/* Create/Edit Form */}
        {(showCreateForm || editingUser) && (
          <div className="bg-white rounded-lg shadow-sm border border-steno-gray-300 p-6">
            <h3 className="text-lg font-heading font-semibold mb-4 text-steno-navy">
              {editingUser ? 'Edit User' : 'Create User'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-steno-charcoal mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2 border border-steno-gray-300 rounded-lg focus:ring-steno-teal focus:border-steno-teal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-steno-charcoal mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border border-steno-gray-300 rounded-lg focus:ring-steno-teal focus:border-steno-teal"
                />
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-steno-charcoal mb-1">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-2 border border-steno-gray-300 rounded-lg focus:ring-steno-teal focus:border-steno-teal"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-steno-charcoal mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
                  className="w-full p-2 border border-steno-gray-300 rounded-lg focus:ring-steno-teal focus:border-steno-teal"
                >
                  <option value="attorney">Attorney</option>
                  <option value="paralegal">Paralegal</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={editingUser ? handleUpdate : handleCreate}
                  className="px-4 py-2 bg-steno-navy text-white rounded-lg hover:bg-steno-navy-dark font-medium transition-colors"
                >
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingUser(null);
                    setFormData({ email: '', password: '', name: '', role: 'attorney' });
                  }}
                  className="px-4 py-2 bg-steno-gray-300 text-steno-charcoal rounded-lg hover:bg-steno-gray-400 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-steno-gray-300">
          <div className="p-4 border-b border-steno-gray-200">
            <h2 className="text-xl font-heading font-semibold text-steno-navy">All Users ({users.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-steno-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-steno-charcoal">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-steno-charcoal">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-steno-charcoal">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-steno-charcoal">Created</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-steno-charcoal">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-steno-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-steno-charcoal-light">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-steno-gray-50">
                      <td className="px-4 py-3 text-sm text-steno-charcoal">{user.name}</td>
                      <td className="px-4 py-3 text-sm text-steno-charcoal">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded font-medium ${
                          user.role === 'admin' ? 'bg-steno-navy text-white' :
                          user.role === 'attorney' ? 'bg-steno-teal/10 text-steno-teal-dark' :
                          'bg-steno-gray-100 text-steno-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-steno-charcoal-light">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingUser(user);
                              setShowCreateForm(false);
                              setFormData({ email: user.email, password: '', name: user.name, role: user.role });
                            }}
                            className="px-3 py-1 bg-steno-navy text-white text-sm rounded hover:bg-steno-navy-dark font-medium transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 font-medium transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default UserManagement;

