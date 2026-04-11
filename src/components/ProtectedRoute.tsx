import React from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { AccessDenied } from './admin/rbac/AccessDenied';

interface ProtectedRouteProps {
  permission?: string;
  admin?: boolean;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ permission, admin, children }) => {
  const { hasPermission, canAccessAdmin, loading, error, isSuperAdmin, permissions } = usePermissions();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-paper">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-teal"></div>
          <p className="text-brand-navy/50 text-[10px] uppercase tracking-widest font-bold font-sans">Verifying Permissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-brand-paper">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-brand-coral/10 text-center">
          <h1 className="text-2xl font-serif text-brand-coral mb-4">Permission Error</h1>
          <p className="text-brand-navy/60 mb-8 font-sans text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-brand-navy text-white rounded-full font-bold uppercase tracking-widest hover:bg-brand-teal transition-all font-sans text-[10px]"
          >
            Retry Verification
          </button>
        </div>
      </div>
    );
  }

  if (admin && !canAccessAdmin) {
    console.warn('Access denied: User is not an admin', { isSuperAdmin, permissionsCount: permissions.length });
    return <AccessDenied />;
  }

  if (permission && !hasPermission(permission)) {
    console.warn(`Access denied: Missing permission ${permission}`, { isSuperAdmin, permissionsCount: permissions.length });
    return <AccessDenied />;
  }

  return <>{children}</>;
};
