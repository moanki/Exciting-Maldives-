import { supabase } from '../supabase';

export interface Permission {
  key: string;
  module: string;
  action: string;
}

export async function getUserRoles(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }
  if (!data) return [];
  return data.map(ur => ur.role_id);
}

export async function getUserRoleKeys(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('roles(key)')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching role keys:', error);
    return [];
  }
  if (!data) return [];

  return data
    .map((ur: any) => ur.roles?.key)
    .filter(Boolean);
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
  if (!data) return [];

  return data
    .map((ur: any) => ur.roles?.label)
    .filter(Boolean);
}

export async function getUserPermissions(userId: string): Promise<Permission[]> {
  const roleIds = await getUserRoles(userId);
  if (roleIds.length === 0) {
    console.warn(`No roles found for user ${userId}`);
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
    console.warn(`No permissions found for roles: ${roleIds.join(', ')}`);
  }

  return uniquePermissions;
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
  
  const hasAccess = permissions.some(p => adminPermissions.includes(p.key));
  
  if (!hasAccess) {
    console.log(`User ${userId} denied admin access. Roles: ${roleKeys.join(', ')}. Permissions: ${permissions.map(p => p.key).join(', ')}`);
  }
  
  return hasAccess;
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
