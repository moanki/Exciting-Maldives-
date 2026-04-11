import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { getUserPermissions, Permission, canAccessAdmin } from '../lib/rbac';

export function usePermissions() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [canAccessAdminState, setCanAccessAdminState] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPermissions() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const superAdmin = user.email === 'monk.eemoan@gmail.com';
        setIsSuperAdmin(superAdmin);

        const perms = await getUserPermissions(user.id);
        const canAccess = await canAccessAdmin(user.id);
        setPermissions(perms);
        setCanAccessAdminState(canAccess || superAdmin);
      }
      setLoading(false);
    }
    fetchPermissions();
  }, []);

  const hasPermission = (key: string) => isSuperAdmin || permissions.some(p => p.key === key);

  return { permissions, hasPermission, canAccessAdmin: canAccessAdminState, loading, isSuperAdmin };
}
