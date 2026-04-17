import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import { usePermissions } from '../../../hooks/usePermissions';
import { Shield, ShieldAlert, Loader2, Users, Plus, X, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const UserAccessManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  const handleRoleUpdate = async (userId: string, roleId: string, action: 'assign' | 'remove') => {
    if (action === 'assign') await assignRole(userId, roleId);
    else await removeRole(userId, roleId);
    fetchData(); // Refresh UI in the modal
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'x-session-id': `Bearer ${session?.access_token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch users');
      const usersData = await response.json();
      
      // Need to fetch roles separately if not included or if needed for picker
      const { data: rolesRes } = await supabase
        .from('roles')
        .select('id, key, label, description')
        .order('label');

      setUsers(usersData);
      setRoles(rolesRes || []);
    } catch (err: any) {
      console.error("Failed to fetch data:", err);
      setError(err.message || "Failed to load user role assignment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!permissionsLoading && hasPermission('users.read')) {
      fetchData();
    }
  }, [permissionsLoading, hasPermission]);

  const assignRole = async (userId: string, roleId: string) => {
    setActionLoading(true);
    setError(null);
    try {
      const { session } = (await supabase.auth.getSession()).data;
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role_id: roleId });
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to assign role");
    } finally {
      setActionLoading(false);
    }
  };

  const removeRole = async (userId: string, roleId: string) => {
    setActionLoading(true);
    setError(null);
    try {
      const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role_id', roleId);
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to remove role");
    } finally {
      setActionLoading(false);
    }
  };

  const updateUserName = async (userId: string, fullName: string) => {
    setActionLoading(true);
    setError(null);
    try {
      const { session } = (await supabase.auth.getSession()).data;
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'x-session-id': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ full_name: fullName })
      });
      if (!response.ok) throw new Error('Failed to update user name');
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to update user name");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    setActionLoading(true);
    setError(null);
    try {
      const { session } = (await supabase.auth.getSession()).data;
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'x-session-id': `Bearer ${session?.access_token}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete user');
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to delete user");
    } finally {
      setActionLoading(false);
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
      <p className="text-brand-navy/60">You do not have permission to view user role assignment.</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif text-brand-navy">User Role Assignment</h1>
          <p className="text-brand-navy/40 text-sm mt-1">Manage user roles directly. Roles are defined in the database schema.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="px-6 py-3 bg-brand-teal text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-brand-teal/90 transition-all flex items-center gap-2"
        >
          <Plus size={14} /> Add New User
        </button>
      </div>

          {isCreateModalOpen && (
        <CreateUserModal 
          onClose={() => setIsCreateModalOpen(false)} 
          onSuccess={() => {
            setIsCreateModalOpen(false);
            fetchData();
          }}
          roles={roles}
        />
      )}

      {editingUser && (
        <EditUserModal 
          user={editingUser}
          onClose={() => setEditingUser(null)} 
          onSuccess={() => {
            setEditingUser(null);
            fetchData();
          }}
          roles={roles}
          onAssignRole={(u, r) => handleRoleUpdate(u, r, 'assign')}
          onRemoveRole={(u, r) => handleRoleUpdate(u, r, 'remove')}
        />
      )}

      {error && (
        <div className="p-4 bg-brand-coral/10 border border-brand-coral/20 rounded-2xl text-brand-coral text-sm font-medium">
          {error}
        </div>
      )}

      <div className="bg-white rounded-[32px] border border-brand-navy/5 shadow-xl shadow-brand-navy/5 overflow-hidden">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-brand-paper border-b border-brand-navy/5">
            <tr>
              <th className="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40">User</th>
              <th className="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40">Roles</th>
              <th className="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-brand-navy/40">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-paper">
            {loading ? (
              <tr><td colSpan={3} className="px-8 py-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-teal mx-auto" /></td></tr>
            ) : filteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-brand-paper/50 transition-colors">
                <td className="px-8 py-5">
                  <p className="font-bold text-brand-navy">{user.full_name || 'No Name'}</p>
                  <p className="text-xs text-brand-navy/40">{user.email}</p>
                </td>
                <td className="px-8 py-5">
                  <div className="flex flex-wrap gap-2">
                    {user.user_roles?.map((ur: any) => (
                      <span key={ur.role_id} className="px-3 py-1 bg-brand-teal/10 text-brand-teal text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-2">
                        {ur.roles?.label || ur.roles?.key}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-8 py-5">
                   {hasPermission('users.manage') && (
                     <div className="flex gap-2">
                       <button onClick={() => setEditingUser(user)} className="text-brand-navy/40 hover:text-brand-teal p-2">
                         <Pencil size={14} />
                       </button>
                       <button onClick={() => deleteUser(user.id)} className="text-brand-navy/40 hover:text-brand-coral p-2">
                         <Trash2 size={14} />
                       </button>
                     </div>
                   )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const RolePicker = ({ roles, assignedRoleIds, onSelect }: { roles: any[], assignedRoleIds: string[], onSelect: (id: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const availableRoles = roles.filter(r => !assignedRoleIds.includes(r.id));
  if (availableRoles.length === 0) return null;
  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="w-6 h-6 bg-brand-paper rounded-full flex items-center justify-center text-brand-navy/40 hover:text-brand-teal hover:bg-brand-teal/10"><Plus size={14} /></button>
      {isOpen && (
        <div className="absolute left-0 top-8 w-48 bg-white rounded-2xl shadow-2xl border border-brand-navy/5 p-2 z-20">
          {availableRoles.map(role => (
            <button key={role.id} onClick={() => { onSelect(role.id); setIsOpen(false); }} className="w-full text-left px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-brand-navy/60 hover:bg-brand-teal/5 hover:text-brand-teal">{role.label}</button>
          ))}
        </div>
      )}
    </div>
  );
};

const CreateUserModal = ({ onClose, onSuccess, roles }: { onClose: () => void, onSuccess: () => void, roles: any[] }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [roleId, setRoleId] = useState(roles[0]?.id || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { session } = (await supabase.auth.getSession()).data;
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'x-session-id': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ email, password, full_name: fullName, role_id: roleId })
      });
      if (!response.ok) throw new Error('Failed to create user');
      onSuccess();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] p-8 max-w-md w-full">
        <h2 className="text-2xl font-serif text-brand-navy mb-6">Create New User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full p-4 rounded-xl border border-brand-navy/10" required />
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 rounded-xl border border-brand-navy/10" required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 rounded-xl border border-brand-navy/10" required />
          <select value={roleId} onChange={e => setRoleId(e.target.value)} className="w-full p-4 rounded-xl border border-brand-navy/10 bg-white">
            {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
          <div className="flex gap-4 mt-6">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-brand-paper text-brand-navy rounded-full text-[10px] font-bold uppercase tracking-widest">Cancel</button>
            <button type="submit" className="flex-1 py-3 bg-brand-teal text-white rounded-full text-[10px] font-bold uppercase tracking-widest" disabled={loading}>{loading ? 'Creating...' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditUserModal = ({ user, onClose, onSuccess, roles, onAssignRole, onRemoveRole }: { user: any, onClose: () => void, onSuccess: () => void, roles: any[], onAssignRole: (u: string, r: string) => Promise<void>, onRemoveRole: (u: string, r: string) => Promise<void> }) => {
  const [fullName, setFullName] = useState(user.full_name || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { session } = (await supabase.auth.getSession()).data;
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'x-session-id': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ full_name: fullName })
      });
      if (!response.ok) throw new Error('Failed to update user name');
      onSuccess();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] p-8 max-w-md w-full">
        <h2 className="text-2xl font-serif text-brand-navy mb-6">Edit User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full p-4 rounded-xl border border-brand-navy/10" required />
          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-navy/60 uppercase">Roles</label>
            <div className="flex flex-wrap gap-2 p-4 bg-brand-paper rounded-xl">
              {user.user_roles?.map((ur: any) => (
                <span key={ur.role_id} className="px-3 py-1 bg-white text-brand-teal text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-2 border border-brand-teal/20">
                  {ur.roles?.label || ur.roles?.key}
                  <button type="button" onClick={() => onRemoveRole(user.id, ur.role_id)} className="hover:text-brand-coral"><X size={12} /></button>
                </span>
              ))}
              <RolePicker roles={roles} assignedRoleIds={user.user_roles?.map((ur: any) => ur.role_id) || []} onSelect={(roleId) => onAssignRole(user.id, roleId)} />
            </div>
          </div>
          <div className="flex gap-4 mt-6">
            <button type="button" onClick={onClose} className="flex-1 py-3 bg-brand-paper text-brand-navy rounded-full text-[10px] font-bold uppercase tracking-widest">Cancel</button>
            <button type="submit" className="flex-1 py-3 bg-brand-teal text-white rounded-full text-[10px] font-bold uppercase tracking-widest" disabled={loading}>{loading ? 'Updating...' : 'Update'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
