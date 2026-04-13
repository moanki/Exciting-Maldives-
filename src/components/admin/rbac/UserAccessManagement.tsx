import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import { usePermissions } from '../../../hooks/usePermissions';
import { UserPlus, Search, Shield, Trash2, Edit2, X, Check, Loader2, Mail, User as UserIcon, Calendar, Clock, Users, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../../../lib/api';

export const UserAccessManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/admin/users');
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setUsers(data);

      const rolesResponse = await apiFetch('/api/admin/roles');
      const rolesData = await rolesResponse.json();
      setRoles(rolesData);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!permissionsLoading && hasPermission('users.read')) {
      fetchUsers();
    }
  }, [permissionsLoading, hasPermission]);

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    try {
      const response = await apiFetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (permissionsLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-brand-teal" />
    </div>
  );

  if (!hasPermission('users.read')) return (
    <div className="p-8 text-center bg-white rounded-3xl border border-brand-navy/5 shadow-xl">
      <Shield className="w-12 h-12 mx-auto text-brand-coral mb-4" />
      <h2 className="text-xl font-serif text-brand-navy mb-2">Access Denied</h2>
      <p className="text-brand-navy/60">You do not have permission to view user access management.</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-brand-navy">User Access</h1>
          <p className="text-brand-navy/40 text-sm mt-1">Manage platform users and their assigned roles.</p>
        </div>
        {hasPermission('users.manage') && (
          <button 
            onClick={() => {
              setEditingUser(null);
              setIsModalOpen(true);
            }}
            className="bg-brand-navy text-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-brand-teal transition-all flex items-center gap-2 font-sans shadow-lg shadow-brand-navy/20"
          >
            <UserPlus size={16} /> Add New User
          </button>
        )}
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-navy/20" size={18} />
          <input 
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-white rounded-2xl border border-brand-navy/5 focus:border-brand-teal focus:ring-1 focus:ring-brand-teal outline-none transition-all shadow-sm font-sans"
          />
        </div>
        <div className="bg-brand-teal/5 border border-brand-teal/10 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-teal/10 rounded-xl flex items-center justify-center text-brand-teal">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-teal/60">Total Users</p>
              <p className="text-xl font-serif text-brand-navy">{users.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-[32px] border border-brand-navy/5 shadow-xl shadow-brand-navy/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-brand-paper border-b border-brand-navy/5">
              <tr>
                <th className="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">User</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">Roles</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">Status</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans">Last Login</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40 font-sans text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-paper">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-teal mx-auto" />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-brand-navy/40 font-sans">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-brand-paper/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-brand-paper rounded-xl flex items-center justify-center text-brand-navy/20 group-hover:text-brand-teal transition-colors">
                          <UserIcon size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-brand-navy font-sans">{user.full_name || 'No Name'}</p>
                          <p className="text-xs text-brand-navy/40 font-sans">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-wrap gap-2">
                        {user.user_roles?.length > 0 ? (
                          user.user_roles.map((ur: any) => (
                            <span key={ur.role_id} className="px-3 py-1 bg-brand-teal/10 text-brand-teal text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-2">
                              {ur.roles?.label}
                              {hasPermission('users.manage') && (
                                <button 
                                  onClick={async () => {
                                    await apiFetch(`/api/admin/users/${user.id}/roles/${ur.role_id}`, { method: 'DELETE' });
                                    fetchUsers();
                                  }}
                                  className="hover:text-brand-coral transition-colors"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-brand-navy/20 font-bold uppercase tracking-widest">No Roles</span>
                        )}
                        {hasPermission('users.manage') && (
                          <RolePicker 
                            roles={roles} 
                            assignedRoleIds={user.user_roles?.map((ur: any) => ur.role_id) || []} 
                            onSelect={async (roleId) => {
                              await apiFetch(`/api/admin/users/${user.id}/roles`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ role_id: roleId })
                              });
                              fetchUsers();
                            }}
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${user.confirmed_at ? 'bg-green-500' : 'bg-brand-coral'}`} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/60">
                          {user.confirmed_at ? 'Active' : 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-brand-navy/40">
                          <Calendar size={12} />
                          <span className="text-[10px] font-medium font-sans">
                            {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                          </span>
                        </div>
                        {user.last_sign_in_at && (
                          <div className="flex items-center gap-2 text-brand-navy/40">
                            <Clock size={12} />
                            <span className="text-[10px] font-medium font-sans">
                              {new Date(user.last_sign_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        {hasPermission('users.manage') && (
                          <>
                            <button 
                              onClick={() => {
                                setEditingUser(user);
                                setIsModalOpen(true);
                              }}
                              className="p-2 text-brand-navy/20 hover:text-brand-teal hover:bg-brand-teal/5 rounded-lg transition-all"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 text-brand-navy/20 hover:text-brand-coral hover:bg-brand-coral/5 rounded-lg transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <UserModal 
            user={editingUser}
            roles={roles}
            onClose={() => setIsModalOpen(false)}
            onSuccess={() => {
              setIsModalOpen(false);
              fetchUsers();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const RolePicker = ({ roles, assignedRoleIds, onSelect }: { roles: any[], assignedRoleIds: string[], onSelect: (id: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const availableRoles = roles.filter(r => !assignedRoleIds.includes(r.id));

  if (availableRoles.length === 0) return null;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-6 h-6 bg-brand-paper rounded-full flex items-center justify-center text-brand-navy/40 hover:text-brand-teal hover:bg-brand-teal/10 transition-all"
      >
        <Plus size={14} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute left-0 top-8 w-48 bg-white rounded-2xl shadow-2xl border border-brand-navy/5 p-2 z-20"
            >
              {availableRoles.map(role => (
                <button
                  key={role.id}
                  onClick={() => {
                    onSelect(role.id);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-brand-navy/60 hover:bg-brand-teal/5 hover:text-brand-teal transition-all"
                >
                  {role.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const UserModal = ({ user, roles, onClose, onSuccess }: any) => {
  const [email, setEmail] = useState(user?.email || '');
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = user ? `/api/admin/users/${user.id}` : '/api/admin/users';
      const method = user ? 'PATCH' : 'POST';
      
      const body: any = { email, full_name: fullName };
      if (password) body.password = password;
      if (!user && roleId) body.role_id = roleId;

      const response = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-navy/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl relative overflow-hidden"
      >
        <button onClick={onClose} className="absolute top-8 right-8 text-brand-navy/20 hover:text-brand-coral transition-colors">
          <X size={24} />
        </button>

        <div className="mb-8">
          <div className="w-16 h-16 bg-brand-paper rounded-2xl flex items-center justify-center text-brand-teal mb-6">
            {user ? <Edit2 size={32} /> : <UserPlus size={32} />}
          </div>
          <h3 className="text-2xl font-serif text-brand-navy">{user ? 'Edit User' : 'Add New User'}</h3>
          <p className="text-brand-navy/40 text-sm mt-1">
            {user ? 'Update account details for this user.' : 'Create a new administrative or partner account.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 mb-2 ml-4">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-navy/20" size={18} />
                <input 
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-brand-paper/50 rounded-2xl border border-transparent focus:border-brand-teal focus:bg-white outline-none transition-all font-sans"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 mb-2 ml-4">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-navy/20" size={18} />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-brand-paper/50 rounded-2xl border border-transparent focus:border-brand-teal focus:bg-white outline-none transition-all font-sans"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 mb-2 ml-4">
                {user ? 'New Password (Optional)' : 'Password'}
              </label>
              <div className="relative">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-navy/20" size={18} />
                <input 
                  type="password"
                  required={!user}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-brand-paper/50 rounded-2xl border border-transparent focus:border-brand-teal focus:bg-white outline-none transition-all font-sans"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {!user && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 mb-2 ml-4">Initial Role</label>
                <select 
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="w-full px-6 py-4 bg-brand-paper/50 rounded-2xl border border-transparent focus:border-brand-teal focus:bg-white outline-none transition-all font-sans appearance-none"
                >
                  <option value="">Select a role...</option>
                  {roles.map((role: any) => (
                    <option key={role.id} value={role.id}>{role.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-brand-coral/10 rounded-2xl flex items-center gap-3 text-brand-coral text-xs font-medium">
              <Shield size={16} />
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-brand-navy text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-teal transition-all flex items-center justify-center gap-2 shadow-xl shadow-brand-navy/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : user ? 'Update User' : 'Create User'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
