import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import { usePermissions } from '../../../hooks/usePermissions';
import { Shield, ShieldAlert, Loader2, Users, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const UserAccessManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, email, full_name, created_at, user_roles(role_id, roles(id, key, label, description))')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);

      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('id, key, label, description')
        .order('label');

      if (rolesError) throw rolesError;
      setRoles(rolesData || []);
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
      <div>
        <h1 className="text-3xl font-serif text-brand-navy">User Role Assignment</h1>
        <p className="text-brand-navy/40 text-sm mt-1">Manage user roles directly in the database.</p>
      </div>

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
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-paper">
            {loading ? (
              <tr><td colSpan={2} className="px-8 py-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-brand-teal mx-auto" /></td></tr>
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
                        {hasPermission('roles.manage') && (
                          <button onClick={() => removeRole(user.id, ur.role_id)} className="hover:text-brand-coral"><X size={12} /></button>
                        )}
                      </span>
                    ))}
                    {hasPermission('roles.manage') && (
                      <RolePicker roles={roles} assignedRoleIds={user.user_roles?.map((ur: any) => ur.role_id) || []} onSelect={(roleId) => assignRole(user.id, roleId)} />
                    )}
                  </div>
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
