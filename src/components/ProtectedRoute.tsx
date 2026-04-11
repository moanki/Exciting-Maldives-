import React from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { AccessDenied } from './admin/rbac/AccessDenied';

interface ProtectedRouteProps {
  permission?: string;
  admin?: boolean;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ permission, admin, children }) => {
  const { hasPermission, canAccessAdmin, loading } = usePermissions();

  if (loading) return null;
  if (admin && !canAccessAdmin) return <AccessDenied />;
  if (permission && !hasPermission(permission)) return <AccessDenied />;

  return <>{children}</>;
};
