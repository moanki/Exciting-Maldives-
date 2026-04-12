import { supabase } from '../supabase';

export interface Permission {
  key: string;
  module: string;
  action: string;
}

export async function getLegacyUserRole(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching legacy role:', error);
    return null;
  }
  return data?.role || null;
}

export async function getUserRoles(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', userId);

    if (error) {
      // If table doesn't exist, this is expected during migration
      if (error.code === '42P01') {
        console.warn('user_roles table does not exist yet.');
      } else {
        console.error('Error fetching user roles:', error);
      }
      return [];
    }
    if (!data) return [];
    return data.map(ur => ur.role_id);
  } catch (e) {
    return [];
  }
}

export async function getUserRoleKeys(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('roles(key)')
      .eq('user_id', userId);

    if (error) {
      if (error.code === '42P01') {
        console.warn('user_roles or roles table does not exist yet.');
      } else {
        console.error('Error fetching role keys:', error);
      }
      return [];
    }
    
    if (!data || data.length === 0) {
      return [];
    }

    return data
      .map((ur: any) => ur.roles?.key)
      .filter(Boolean);
  } catch (e) {
    return [];
  }
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
  
  if (!data || data.length === 0) return [];

  return data
    .map((ur: any) => ur.roles?.label)
    .filter(Boolean);
}

export async function getUserPermissions(userId: string): Promise<Permission[]> {
  const roleIds = await getUserRoles(userId);
  if (roleIds.length === 0) {
    console.warn(`Cannot fetch permissions: No roles for user ${userId}`);
    return [];
  }

  const { data, error } = await supabase
    .from('role_permissions')
    .select('permissions(key, module, action)')
    .in('role_id', roleIds);

  if (error) {
    console.error('Error fetching permissions:', error);
    return [];
  }
  
  if (!data) return [];

  // Flatten and unique
  const permissions = data.map((rp: any) => rp.permissions).filter(Boolean);
  const uniquePermissions = Array.from(new Map(permissions.map((p: Permission) => [p.key, p])).values());
  
  if (uniquePermissions.length === 0) {
    console.warn(`No permissions found for user ${userId} with roles ${roleIds.join(', ')}`);
  }

  return uniquePermissions;
}

export async function hasPermission(userId: string, permissionKey: string): Promise<boolean> {
  const roleKeys = await getUserRoleKeys(userId);
  if (roleKeys.includes('super_admin')) return true;
  
  const permissions = await getUserPermissions(userId);
  if (permissions.some(p => p.key === permissionKey)) return true;

  // Fallback for legacy roles during migration
  const legacyRole = await getLegacyUserRole(userId);
  if (legacyRole === 'superadmin' || legacyRole === 'admin') return true;
  if (legacyRole === 'content_manager') {
    // Content managers get a subset of permissions in fallback mode
    const contentManagerPerms = ['resorts.read', 'resorts.create', 'resorts.update', 'site_content.read', 'site_content.update', 'imports.read'];
    return contentManagerPerms.includes(permissionKey);
  }

  return false;
}

export async function canAccessAdmin(userId: string): Promise<boolean> {
  // 1. Try RBAC first
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
  
  if (permissions.some(p => adminPermissions.includes(p.key))) return true;

  // 2. Fallback to legacy profiles.role
  const legacyRole = await getLegacyUserRole(userId);
  const legacyAdminRoles = ['admin', 'superadmin', 'content_manager'];
  
  if (legacyRole && legacyAdminRoles.includes(legacyRole)) {
    console.log(`Admin access granted via legacy role: ${legacyRole}`);
    return true;
  }
  
  console.log(`Admin access denied for user ${userId}. Roles: ${roleKeys.join(', ')}`);
  return false;
}

export async function logAuditAction(
  actorUserId: string,
  actionKey: string,
  entityType?: string,
  entityId?: string,
  beforeJson?: any,
  afterJson?: any,
  metadataJson?: any
) {
  await supabase.from('audit_logs').insert({
    actor_user_id: actorUserId,
    action_key: actionKey,
    entity_type: entityType,
    entity_id: entityId,
    before_json: beforeJson,
    after_json: afterJson,
    metadata_json: metadataJson
  });
}
