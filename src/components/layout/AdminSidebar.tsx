import React from 'react';
import { SimplifiedAdminSidebar } from './SimplifiedAdminSidebar';

interface AdminSidebarProps {
  userRole: string;
  userDepartment?: string;
}

export function AdminSidebar({ userRole, userDepartment }: AdminSidebarProps) {
  return <SimplifiedAdminSidebar userRole={userRole} />;
}