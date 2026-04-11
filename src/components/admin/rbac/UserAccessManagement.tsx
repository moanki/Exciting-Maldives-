import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';

export const UserAccessManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    async function fetchUsers() {
      const { data } = await supabase
        .from('profiles')
        .select('*, user_roles(roles(label))');
      if (data) setUsers(data);
    }
    fetchUsers();
  }, []);

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
                <button className="text-blue-500">Edit Roles</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
