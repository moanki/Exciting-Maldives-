import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { getUserPermissions, Permission } from '../lib/rbac';

export function usePermissions() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPermissions() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const perms = await getUserPermissions(user.id);
        setPermissions(perms);
      }
      setLoading(false);
    }
    fetchPermissions();
  }, []);

  const hasPermission = (key: string) => permissions.some(p => p.key === key);

  return { permissions, hasPermission, loading };
}
