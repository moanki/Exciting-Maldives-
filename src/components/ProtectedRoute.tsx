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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Permission Error</h1>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
        >
          Retry
        </button>
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
