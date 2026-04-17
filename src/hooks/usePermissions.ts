import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { getUserPermissions, Permission, canAccessAdmin, getUserRoleKeys } from '../lib/rbac';

export function usePermissions() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [canAccessAdminState, setCanAccessAdminState] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchPermissions(userId: string) {
      if (!mounted) return;
      setLoading(true);
      setError(null);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const roleKeys = await getUserRoleKeys(userId);
        const superAdmin = roleKeys.includes('super_admin') || session?.user?.email === 'monk.eemoan@gmail.com';
        
        if (mounted) {
          setIsSuperAdmin(superAdmin);
          
          const perms = await getUserPermissions(userId);
          const canAccess = await canAccessAdmin(userId);
          
          if (mounted) {
            setPermissions(perms);
            setCanAccessAdminState(canAccess);
          }
        }
      } catch (err: any) {
        console.error('Failed to load permissions:', err);
        if (mounted) {
          setError(err.message || 'Failed to load permissions');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        fetchPermissions(user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        fetchPermissions(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setPermissions([]);
        setCanAccessAdminState(false);
        setIsSuperAdmin(false);
        setLoading(false);
        setError(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const hasPermission = useCallback((key: string) => {
    if (isSuperAdmin) return true;
    return permissions.some(p => p.key === key);
  }, [permissions, isSuperAdmin]);

  return { permissions, hasPermission, canAccessAdmin: canAccessAdminState, loading, isSuperAdmin, error };
}
