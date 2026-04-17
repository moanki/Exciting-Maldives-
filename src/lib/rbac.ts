import { supabase } from '../supabase';

export interface Permission {
  key: string;
  module: string;
  action: string;
}

export async function getUserRoleKeys(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', userId);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    const roleIds = data.map((ur: any) => ur.role_id);
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('key')
      .in('id', roleIds);

    if (rolesError) throw rolesError;
    
    return roles?.map((r: any) => r.key).filter(Boolean) || [];
  } catch (e) {
    console.error('Error fetching role keys:', e);
    return [];
  }
}

export async function getUserPermissions(userId: string): Promise<Permission[]> {
  try {
    console.log('Fetching permissions for user:', userId);
    
    // 1. Get role IDs for user
    const { data: userRoles, error: urError } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', userId);

    if (urError) throw urError;
    if (!userRoles || userRoles.length === 0) return [];

    const roleIds = userRoles.map(ur => ur.role_id);

    // 2. Get permission IDs for these roles
    const { data: rolePerms, error: rpError } = await supabase
      .from('role_permissions')
      .select('permission_id')
      .in('role_id', roleIds);

    if (rpError) throw rpError;
    if (!rolePerms || rolePerms.length === 0) return [];

    const permIds = rolePerms.map(rp => rp.permission_id);

    // 3. Get permission details
    const { data: perms, error: pError } = await supabase
      .from('permissions')
      .select('key, module, action')
      .in('id', permIds);

    if (pError) throw pError;

    const uniquePermissions = Array.from(new Map(perms.map((p: Permission) => [p.key, p])).values());
    console.log('Unique permissions count:', uniquePermissions.length);
    return uniquePermissions;
  } catch (e) {
    console.error('Error fetching permissions:', e);
    return [];
  }
}

export async function hasPermission(userId: string, permissionKey: string): Promise<boolean> {
  const roleKeys = await getUserRoleKeys(userId);
  if (roleKeys.includes('super_admin')) return true;

  const permissions = await getUserPermissions(userId);
  return permissions.some(p => p.key === permissionKey);
}

export async function canAccessAdmin(userId: string): Promise<boolean> {
  // Hardcoded bypass for the bootstrap user to ensure they can always access the admin portal
  // even if the RBAC database state is inconsistent or unseeded.
  // Using getSession() as it's more reliable than getUser() in some environments
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  
  if (user?.email === 'monk.eemoan@gmail.com') {
    console.log('Admin access granted via bootstrap email bypass for:', user.email);
    return true;
  }

  const roleKeys = await getUserRoleKeys(userId);
  if (roleKeys.includes('super_admin')) {
    console.log('Admin access granted: User is super_admin');
    return true;
  }

  const permissions = await getUserPermissions(userId);
  
  // Diagnostic: Check if roles table is even populated
  if (permissions.length === 0) {
    try {
      const { data: rolesData } = await supabase.from('roles').select('id').limit(1);
      if (!rolesData || rolesData.length === 0) {
        console.warn('The roles table is empty or inaccessible. RBAC will not function until the database is seeded.');
      }
    } catch (e) {
      console.error('Failed to check roles table status:', e);
    }
  }

  const adminPermissions = [
    'resorts.read', 
    'site_content.read', 
    'imports.read', 
    'analytics.read', 
    'audit_logs.read', 
    'users.read', 
    'roles.read', 
    'security.read',
    'settings.read'
  ];
  
  const hasAccess = permissions.some(p => adminPermissions.includes(p.key));
  console.log('Admin access check for user:', userId, 'Result:', hasAccess);
  return hasAccess;
}

export async function getUserRoleLabels(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', userId);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    const roleIds = data.map((ur: any) => ur.role_id);
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('id, label')
      .in('id', roleIds);

    if (rolesError) throw rolesError;
    
    return roles?.map((r: any) => r.label).filter(Boolean) || [];
  } catch (e) {
    console.error('Error fetching role labels:', e);
    return [];
  }
}
