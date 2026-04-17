import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import { usePermissions } from '../../../hooks/usePermissions';
import { Shield, ShieldCheck, ShieldAlert, Loader2, Info, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

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
        console.log('[RoleManagement] Fetching roles from server API...');
        
        const { data: { session } } = await supabase.auth.getSession();
        
        const response = await fetch('/api/admin/roles', {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'x-session-id': `Bearer ${session?.access_token}`
          }
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server error: ${response.status}`);
        }

        const rolesData = await response.json();
        console.log('[RoleManagement] Roles received:', rolesData?.length);

        if (!rolesData || rolesData.length === 0) {
          setRoles([]);
          return;
        }

        // The server API already returns permissions combined if implemented correctly,
        // but looking at server.ts line 670, it does:
        // .select("*, role_permissions(permission_id, permissions(key, label, description, module, action))")
        // So the data structure is already exactly what we need.
        
        setRoles(rolesData);
      } catch (err: any) {
        console.error('[RoleManagement] Fetch failed:', err);
        setError(err.message || 'Failed to fetch roles from server');
      } finally {
        setLoading(false);
      }
    }

    fetchRoles();
  }, []);

  if (permissionsLoading || loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-brand-teal" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif text-brand-navy">Role Management</h1>
        <p className="text-brand-navy/40 text-sm mt-1 uppercase tracking-widest font-bold">System Governance & RBAC Configuration</p>
      </div>

      {error && (
        <div className="p-4 bg-brand-coral/10 border border-brand-coral/20 rounded-2xl text-brand-coral text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {roles.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white rounded-[40px] border border-dashed border-brand-navy/10">
            <ShieldAlert className="w-12 h-12 mx-auto text-brand-navy/20 mb-4" />
            <h3 className="text-xl font-serif text-brand-navy mb-2">No Roles Detected</h3>
            <p className="text-brand-navy/40 max-w-md mx-auto">
              The database did not return any roles. This could be due to an empty table or security policies preventing access.
            </p>
            {!loading && (
              <button 
                onClick={() => window.location.reload()}
                className="mt-6 px-6 py-3 bg-brand-paper hover:bg-brand-teal/10 text-brand-navy text-[10px] font-bold uppercase tracking-widest rounded-full transition-all border border-brand-navy/5"
              >
                Refresh Data
              </button>
            )}
          </div>
        ) : roles.map((role, idx) => {
          // Group permissions by module for the comprehensive view
          const groupedPerms = (role.role_permissions || []).reduce((acc: any, rp: any) => {
            const module = rp.permissions?.module || 'other';
            if (!acc[module]) acc[module] = [];
            acc[module].push(rp.permissions);
            return acc;
          }, {});

          return (
            <motion.div 
              key={role.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-[40px] border border-brand-navy/5 shadow-2xl shadow-brand-navy/5 overflow-hidden flex flex-col group"
            >
              {/* Header section with distinct branding */}
              <div className={`p-8 pb-4 flex items-start justify-between ${role.key === 'super_admin' ? 'bg-brand-navy text-brand-paper' : ''}`}>
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6 ${
                    role.key === 'super_admin' ? 'bg-brand-teal text-brand-navy' : 'bg-brand-paper text-brand-teal'
                  }`}>
                    {role.key === 'super_admin' ? <ShieldCheck size={32} /> : <Shield size={32} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className={`text-3xl font-serif ${role.key === 'super_admin' ? 'text-white' : 'text-brand-navy'}`}>
                        {role.label}
                      </h3>
                      {role.is_system && (
                        <span className={`text-[8px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${
                          role.key === 'super_admin' ? 'border-brand-teal/30 text-brand-teal' : 'border-brand-navy/10 text-brand-navy/40'
                        }`}>
                          System
                        </span>
                      )}
                    </div>
                    <code className={`text-[10px] font-mono opacity-40 uppercase tracking-tighter`}>Key Identifier: {role.key}</code>
                  </div>
                </div>
              </div>

              {/* Description & Core Purpose */}
              <div className="px-8 py-6 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/30 mb-2 font-sans italic">Core Purpose</p>
                <p className="text-lg font-serif text-brand-navy/80 leading-snug mb-8">
                  {role.description || 'No formal description defined for this system role.'}
                </p>

                {/* Permissions Breakdown */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-brand-paper pb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">Access Matrix</span>
                    <button
                      type="button"
                      onClick={() => setExpandedRoleId(expandedRoleId === role.id ? null : role.id)}
                      className="text-[10px] font-bold text-brand-teal hover:text-brand-navy transition-colors flex items-center gap-2"
                    >
                      {expandedRoleId === role.id ? "Minimize Details" : `Explore ${role.role_permissions?.length || 0} Permissions`}
                      <Info size={12} />
                    </button>
                  </div>

                  {expandedRoleId === role.id ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                      {Object.entries(groupedPerms).map(([module, perms]: [string, any]) => (
                        <div key={module} className="space-y-3">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-teal flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-teal" />
                            {module}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {perms.map((p: any) => (
                              <div key={p.id} className="p-3 bg-brand-paper/50 rounded-2xl border border-brand-navy/5">
                                <div className="flex items-center gap-2 mb-1">
                                  <CheckCircle2 size={10} className="text-brand-teal" />
                                  <span className="text-[10px] font-bold text-brand-navy/70 uppercase tracking-tight">{p.label}</span>
                                </div>
                                <p className="text-[9px] text-brand-navy/40 leading-relaxed font-sans pl-4">
                                  {p.description || 'Standard module access granted.'}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                       {Object.keys(groupedPerms).slice(0, 6).map(module => (
                         <div key={module} className="px-3 py-2 bg-brand-paper rounded-xl border border-transparent hover:border-brand-teal/20 transition-all text-center">
                           <p className="text-[9px] font-bold uppercase tracking-widest text-brand-navy/40 mb-1">{module}</p>
                           <p className="text-sm font-serif text-brand-teal">{groupedPerms[module].length} Active</p>
                         </div>
                       ))}
                       {Object.keys(groupedPerms).length > 6 && (
                         <div className="px-3 py-2 bg-brand-paper/50 rounded-xl border border-dashed border-brand-navy/10 flex items-center justify-center">
                           <p className="text-[9px] font-bold text-brand-navy/20">+{Object.keys(groupedPerms).length - 6} More</p>
                         </div>
                       )}
                    </div>
                  )}
                </div>
              </div>

              {/* Special Handling/Footer */}
              <div className="p-8 pt-0 mt-auto">
                {role.key === 'super_admin' ? (
                  <div className="p-5 bg-brand-teal/5 rounded-[32px] border border-brand-teal/10 flex items-start gap-4">
                    <ShieldCheck size={20} className="text-brand-teal shrink-0 mt-1" />
                    <div>
                      <p className="text-[11px] font-bold text-brand-teal uppercase tracking-widest mb-1">Priority Override Active</p>
                      <p className="text-xs text-brand-navy/60 font-sans leading-relaxed italic">
                        This role possesses absolute administrative sovereignty. It bypasses all incremental permission checks.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 bg-brand-paper/50 rounded-[32px] border border-brand-navy/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-brand-teal animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/30">Active Role</span>
                    </div>
                    <span className="text-[10px] font-serif italic text-brand-navy/40">Secure Access Layer 3.0</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
