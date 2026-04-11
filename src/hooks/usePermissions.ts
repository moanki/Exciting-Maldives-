import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { getUserPermissions, Permission, canAccessAdmin } from '../lib/rbac';

export function usePermissions() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [canAccessAdminState, setCanAccessAdminState] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPermissions() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Safety bootstrap for super admin email
        if (user.email === 'monk.eemoan@gmail.com') {
          const { data: roles } = await supabase.from('roles').select('id').eq('key', 'super_admin').single();
          if (roles) {
            await supabase.from('user_roles').upsert({
              user_id: user.id,
              role_id: roles.id
            }, { onConflict: 'user_id,role_id' });
          }
        }

        const perms = await getUserPermissions(user.id);
        const canAccess = await canAccessAdmin(user.id);
        setPermissions(perms);
        setCanAccessAdminState(canAccess);
      }
      setLoading(false);
    }
    fetchPermissions();
  }, []);

  const hasPermission = (key: string) => permissions.some(p => p.key === key);

  return { permissions, hasPermission, canAccessAdmin: canAccessAdminState, loading };
}
