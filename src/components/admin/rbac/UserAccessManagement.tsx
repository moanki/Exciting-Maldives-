import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import { logAuditAction } from '../../../lib/rbac';
import { usePermissions } from '../../../hooks/usePermissions';

export const UserAccessManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const { hasPermission, loading } = usePermissions();

  useEffect(() => {
    async function fetchData() {
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*, user_roles(role_id, roles(label))');
      const { data: rolesData } = await supabase.from('roles').select('*');
      if (usersData) setUsers(usersData);
      if (rolesData) setRoles(rolesData);
    }
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!hasPermission('users.read')) return <div>Access Denied</div>;

  const assignRole = async (userId: string, roleId: string) => {
    if (!hasPermission('users.manage')) return alert('Access Denied');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('user_roles').insert({ user_id: userId, role_id: roleId });
    await logAuditAction(user.id, 'role.assign', 'user_roles', userId, null, { roleId });
    window.location.reload();
  };

  const removeRole = async (userId: string, roleId: string) => {
    if (!hasPermission('users.manage')) return alert('Access Denied');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('user_roles').delete().eq('user_id', userId).eq('role_id', roleId);
    await logAuditAction(user.id, 'role.remove', 'user_roles', userId, { roleId }, null);
    window.location.reload();
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">User Access Management</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2">Email</th>
            <th className="border p-2">Roles</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td className="border p-2">{user.email}</td>
              <td className="border p-2">{user.user_roles.map((ur: any) => ur.roles.label).join(', ')}</td>
              <td className="border p-2">
                <select onChange={(e) => assignRole(user.id, e.target.value)} className="border p-1">
                  <option value="">Assign Role</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.label}</option>
                  ))}
                </select>
                {user.user_roles.map((ur: any) => (
                  <button key={ur.role_id} onClick={() => removeRole(user.id, ur.role_id)} className="text-red-500 ml-2">Remove {ur.roles.label}</button>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
