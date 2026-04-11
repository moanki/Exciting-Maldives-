import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';

export const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<any[]>([]);

  useEffect(() => {
    async function fetchRoles() {
      const { data } = await supabase.from('roles').select('*, role_permissions(permissions(*))');
      if (data) setRoles(data);
    }
    fetchRoles();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Role Management</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map(role => (
          <div key={role.id} className="border p-4 rounded">
            <h3 className="font-bold">{role.label}</h3>
            <p className="text-sm text-gray-600">{role.description}</p>
            <h4 className="font-semibold mt-2">Permissions:</h4>
            <ul className="text-sm">
              {role.role_permissions.map((rp: any) => (
                <li key={rp.permissions.key}>{rp.permissions.label}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
