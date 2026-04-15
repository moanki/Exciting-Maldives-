import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import { usePermissions } from '../../../hooks/usePermissions';
import { Shield, ShieldCheck, ShieldAlert, Loader2, Info, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { apiFetch } from '../../../lib/api';

export const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  useEffect(() => {
    async function fetchRoles() {
      setLoading(true);
      setError(null);

      try {
        const response = await apiFetch("/api/admin/roles");
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || "Failed to fetch roles");
        setRoles(data);
      } catch (err: any) {
        console.error("Failed to fetch roles:", err);
        setError(err.message || "Failed to load roles");
      } finally {
        setLoading(false);
      }
    }

    if (!permissionsLoading && hasPermission("roles.read")) {
      fetchRoles();
    }
  }, [permissionsLoading, hasPermission]);

  if (permissionsLoading || loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-brand-teal" />
    </div>
  );

  if (!hasPermission('roles.read')) return (
    <div className="p-8 text-center bg-white rounded-3xl border border-brand-navy/5 shadow-xl">
      <ShieldAlert className="w-12 h-12 mx-auto text-brand-coral mb-4" />
      <h2 className="text-xl font-serif text-brand-navy mb-2">Access Denied</h2>
      <p className="text-brand-navy/60">You do not have permission to view role management.</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif text-brand-navy">Role Management</h1>
        <p className="text-brand-navy/40 text-sm mt-1">View system roles and their associated permissions.</p>
      </div>

      {error && (
        <div className="p-4 bg-brand-coral/10 border border-brand-coral/20 rounded-2xl text-brand-coral text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {roles.map((role, idx) => (
          <motion.div 
            key={role.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-[32px] border border-brand-navy/5 shadow-xl shadow-brand-navy/5 p-8 flex flex-col hover:shadow-2xl transition-all group"
          >
            <div className="flex items-start justify-between mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                role.key === 'super_admin' ? 'bg-brand-navy text-brand-beige' : 'bg-brand-paper text-brand-teal group-hover:bg-brand-teal/10'
              }`}>
                {role.key === 'super_admin' ? <ShieldCheck size={28} /> : <Shield size={28} />}
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/20 mb-1">Role Key</span>
                <code className="text-[10px] bg-brand-paper px-2 py-1 rounded font-mono text-brand-navy/60">{role.key}</code>
              </div>
            </div>

            <h3 className="text-2xl font-serif text-brand-navy mb-3">{role.label}</h3>
            <p className="text-sm text-brand-navy/60 font-sans leading-relaxed mb-8 flex-1">
              {role.description || 'No description provided for this role.'}
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-brand-paper pb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">Permissions</span>
                <button
                  type="button"
                  onClick={() => setExpandedRoleId(expandedRoleId === role.id ? null : role.id)}
                  className="text-[10px] font-bold text-brand-teal bg-brand-teal/10 px-2 py-0.5 rounded-full"
                >
                  {expandedRoleId === role.id ? "Hide" : `${role.role_permissions?.length || 0} Total`}
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {(expandedRoleId === role.id ? role.role_permissions : role.role_permissions?.slice(0, 6))?.map((rp: any) => (
                  <div
                    key={rp.permissions.key}
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-navy/40 bg-brand-paper px-3 py-1.5 rounded-lg"
                    title={rp.permissions.description || rp.permissions.key}
                  >
                    <CheckCircle2 size={10} className="text-brand-teal" />
                    {rp.permissions.label}
                  </div>
                ))}
                {expandedRoleId !== role.id && role.role_permissions?.length > 6 && (
                  <div className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/20 px-3 py-1.5">
                    + {role.role_permissions.length - 6} more
                  </div>
                )}
              </div>
            </div>

            {role.key === 'super_admin' && (
              <div className="mt-8 p-4 bg-brand-navy/5 rounded-2xl flex items-start gap-3">
                <Info size={16} className="text-brand-navy/40 shrink-0 mt-0.5" />
                <p className="text-[10px] text-brand-navy/40 font-medium leading-relaxed">
                  Super Admin has absolute access to all system modules and bypasses all permission checks.
                </p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
