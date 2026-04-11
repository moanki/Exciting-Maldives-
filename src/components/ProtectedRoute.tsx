import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { AccessDenied } from './admin/rbac/AccessDenied';

interface ProtectedRouteProps {
  permission: string;
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ permission, children }) => {
  const { hasPermission, loading } = usePermissions();

  if (loading) return null;
  if (!hasPermission(permission)) return <AccessDenied />;

  return <>{children}</>;
};
