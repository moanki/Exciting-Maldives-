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
      .select('roles(key)')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching role keys:', error);
      return [];
    }
    
    return data?.map((ur: any) => ur.roles?.key).filter(Boolean) || [];
  } catch (e) {
    return [];
  }
}

export async function getUserPermissions(userId: string): Promise<Permission[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('roles(role_permissions(permissions(key, module, action)))')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching permissions:', error);
    return [];
  }
  
  if (!data) return [];

  // Flatten and unique
  const permissions: Permission[] = [];
  data.forEach((ur: any) => {
    ur.roles?.role_permissions?.forEach((rp: any) => {
      if (rp.permissions) permissions.push(rp.permissions);
    });
  });
  
  return Array.from(new Map(permissions.map((p: Permission) => [p.key, p])).values());
}

export async function hasPermission(userId: string, permissionKey: string): Promise<boolean> {
  const roleKeys = await getUserRoleKeys(userId);
  if (roleKeys.includes('super_admin')) return true;
  
  const permissions = await getUserPermissions(userId);
  return permissions.some(p => p.key === permissionKey);
}

export async function canAccessAdmin(userId: string): Promise<boolean> {
  const roleKeys = await getUserRoleKeys(userId);
  if (roleKeys.includes('super_admin')) return true;

  const permissions = await getUserPermissions(userId);
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
  
  return permissions.some(p => adminPermissions.includes(p.key));
}

export async function getUserRoleLabels(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('roles(label)')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching role labels:', error);
    return [];
  }
  
  return data?.map((ur: any) => ur.roles?.label).filter(Boolean) || [];
}
