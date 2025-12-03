'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { User, UserRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/client';

export default function UserManagement() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    role: 'user' as UserRole
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'owner' && user.role !== 'admin'))) {
      router.push('/');
      return;
    }
    if (user && (user.role === 'owner' || user.role === 'admin')) {
      fetchUsers();
    }
  }, [user, loading, router]);

  const fetchUsers = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage('Failed to fetch users');
      setMessageType('error');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email || '',
      phone: user.phone || '',
      role: user.role
    });
    setMessage('');
  };

  const handleCancel = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      phone: '',
      role: 'user'
    });
    setMessage('');
  };

  const handleSave = async () => {
    if (!editingUser) return;

    // Prevent admins from changing owner roles or assigning owner role
    if (user.role === 'admin') {
      if (editingUser.role === 'owner' || formData.role === 'owner') {
        setMessage('Admins cannot modify owner accounts or assign owner role');
        setMessageType('error');
        return;
      }
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('users')
        .update({
          email: formData.email || null,
          phone: formData.phone || null,
          role: formData.role,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      await fetchUsers();
      setEditingUser(null);
      setMessage('User updated successfully!');
      setMessageType('success');
    } catch (error) {
      setMessage('Failed to update user');
      setMessageType('error');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      await fetchUsers();
      setMessage('User deleted successfully!');
      setMessageType('success');
    } catch (error) {
      setMessage('Failed to delete user');
      setMessageType('error');
    }
  };

  if (loading || loadingUsers) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <main className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center">
            <p className="text-secondary">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!user || (user.role !== 'owner' && user.role !== 'admin')) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-16">
        <div className="card-neon">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-neon mb-2">
              User Management
            </h1>
            <p className="text-secondary">
              Manage all users in the system
            </p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg text-sm ${
              messageType === 'success' 
                ? 'bg-green-900/50 border border-green-500 text-green-400' 
                : 'bg-red-900/50 border border-red-500 text-red-400'
            }`}>
              {message}
            </div>
          )}

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="pb-3 text-sm font-medium text-secondary">Username</th>
                  <th className="pb-3 text-sm font-medium text-secondary">Email</th>
                  <th className="pb-3 text-sm font-medium text-secondary">Phone</th>
                  <th className="pb-3 text-sm font-medium text-secondary">Role</th>
                  <th className="pb-3 text-sm font-medium text-secondary">Created</th>
                  <th className="pb-3 text-sm font-medium text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((userItem) => (
                  <tr key={userItem.id} className="border-b border-gray-800">
                    <td className="py-4 text-sm text-white">{userItem.username}</td>
                    <td className="py-4 text-sm text-gray-400">{userItem.email || 'N/A'}</td>
                    <td className="py-4 text-sm text-gray-400">{userItem.phone || 'N/A'}</td>
                    <td className="py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        userItem.role === 'owner' ? 'bg-purple-900/50 text-purple-400' :
                        userItem.role === 'admin' ? 'bg-blue-900/50 text-blue-400' :
                        userItem.role === 'promoter' ? 'bg-green-900/50 text-green-400' :
                        'bg-gray-900/50 text-gray-400'
                      }`}>
                        {userItem.role}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-gray-400">
                      {new Date(userItem.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(userItem)}
                          className="text-primary-neon hover:text-primary-neon/80 text-sm"
                          disabled={user.role === 'admin' && userItem.role === 'owner'}
                        >
                          Edit
                        </button>
                        {userItem.id !== user.id && userItem.role !== 'owner' && (
                          <button
                            onClick={() => handleDelete(userItem.id)}
                            className="text-red-500 hover:text-red-400 text-sm"
                            disabled={user.role === 'admin' && userItem.role === 'owner'}
                          >
                            Delete
                          </button>
                        )}
                        {user.role === 'admin' && userItem.role === 'owner' && (
                          <span className="text-xs text-gray-500">Protected</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Edit Modal */}
          {editingUser && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-secondary border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-xl font-bold text-white mb-4">Edit User</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-secondary">
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg text-gray-400"
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Role
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white"
                      disabled={user.role === 'admin' && editingUser.role === 'owner'}
                    >
                      <option value="user">User</option>
                      <option value="promoter">Promoter</option>
                      <option value="admin">Admin</option>
                      {user.role === 'owner' && (
                        <option value="owner">Owner</option>
                      )}
                    </select>
                    {user.role === 'admin' && editingUser.role === 'owner' && (
                      <p className="text-xs text-red-400 mt-1">Admins cannot modify owner role</p>
                    )}
                  </div>
                </div>

                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={handleSave}
                    className="btn-primary flex-1"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancel}
                    className="btn-primary flex-1 bg-gray-700 hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
