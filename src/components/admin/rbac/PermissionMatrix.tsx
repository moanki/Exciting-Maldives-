import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import { usePermissions } from '../../../hooks/usePermissions';

export const PermissionMatrix: React.FC = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const { hasPermission, loading } = usePermissions();

  useEffect(() => {
    async function fetchData() {
      const { data: rolesData } = await supabase.from('roles').select('*, role_permissions(permission_id)');
      const { data: permsData } = await supabase.from('permissions').select('*');
      if (rolesData) setRoles(rolesData);
      if (permsData) setPermissions(permsData);
    }
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!hasPermission('permissions.read')) return <div>Access Denied</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Permission Matrix</h2>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border p-2">Permission</th>
            {roles.map(role => <th key={role.id} className="border p-2">{role.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {permissions.map(perm => (
            <tr key={perm.id}>
              <td className="border p-2">{perm.label}</td>
              {roles.map(role => (
                <td key={role.id} className="border p-2 text-center">
                  {role.role_permissions.some((rp: any) => rp.permission_id === perm.id) ? '✅' : '❌'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
