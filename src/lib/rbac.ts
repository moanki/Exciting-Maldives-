import { supabase } from '../supabase';

export interface Permission {
  key: string;
  module: string;
  action: string;
}

export async function getUserPermissions(userId: string): Promise<Permission[]> {
  const { data, error } = await supabase
    .from('role_permissions')
    .select('permissions(key, module, action)')
    .in('role_id', supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', userId)
    );

  if (error || !data) {
    console.error('Error fetching permissions:', error);
    return [];
  }

  return data.map((rp: any) => rp.permissions);
}

export async function hasPermission(userId: string, permissionKey: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.some(p => p.key === permissionKey);
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
