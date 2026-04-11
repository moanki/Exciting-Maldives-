import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { getUserPermissions, Permission, canAccessAdmin, getUserRoleLabels } from '../lib/rbac';

export function usePermissions() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [canAccessAdminState, setCanAccessAdminState] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPermissions() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const roles = await getUserRoleLabels(user.id);
        const superAdmin = roles.includes('Super Admin');
        setIsSuperAdmin(superAdmin);

        const perms = await getUserPermissions(user.id);
        const canAccess = await canAccessAdmin(user.id);
        setPermissions(perms);
        setCanAccessAdminState(canAccess);
      }
      setLoading(false);
    }
    fetchPermissions();
  }, []);

  const hasPermission = (key: string) => isSuperAdmin || permissions.some(p => p.key === key);

  return { permissions, hasPermission, canAccessAdmin: canAccessAdminState, loading, isSuperAdmin };
}
