import React from 'react';

export const AccessDenied: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold text-red-600">Access Denied</h1>
      <p className="text-gray-600">You do not have permission to view this page.</p>
    </div>
  );
};
