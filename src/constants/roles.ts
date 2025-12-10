// Centralized role definitions for the new role system
export const ALLOWED_ROLES = [
  { value: 'super_admin', label: 'Super Admin', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'admin', label: 'Admin', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'tenant', label: 'Tenant', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  { value: 'super_tenant', label: 'Super Tenant', color: 'bg-violet-100 text-violet-800 border-violet-200' },
  { value: 'vendor', label: 'Vendor', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'food_vendor', label: 'Food Vendor', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'mst', label: 'MST', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'fe', label: 'Field Expert', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'hk', label: 'House Keeping', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'se', label: 'Security Executive', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'bms_operator', label: 'BMS Operator', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { value: 'field_staff', label: 'Field Staff', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  { value: 'assistant_manager', label: 'Assistant Manager', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { value: 'assistant_floor_manager', label: 'Assistant Floor Manager', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  { value: 'assistant_general_manager', label: 'Assistant General Manager', color: 'bg-pink-100 text-pink-800 border-pink-200' },
  { value: 'assistant_vice_president', label: 'Assistant Vice President', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  { value: 'vp', label: 'VP', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'ceo', label: 'CEO', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'cxo', label: 'CXO', color: 'bg-teal-100 text-teal-800 border-teal-200' },
  { value: 'ops_supervisor', label: 'Operations Supervisor', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'procurement_manager', label: 'Procurement Manager', color: 'bg-sky-100 text-sky-800 border-sky-200' },
  { value: 'purchase_executive', label: 'Purchase Executive', color: 'bg-lime-100 text-lime-800 border-lime-200' },
  { value: 'property_manager', label: 'Property Manager', color: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200' }
] as const;

export const DEFAULT_ROLE = 'tenant';

// Helper functions
export const getRoleLabel = (roleValue: string): string => {
  const role = ALLOWED_ROLES.find(r => r.value === roleValue);
  return role?.label || roleValue;
};

export const getRoleColor = (roleValue: string): string => {
  const role = ALLOWED_ROLES.find(r => r.value === roleValue);
  return role?.color || 'bg-gray-100 text-gray-800 border-gray-200';
};

// Check if role requires department specialization (only L1 roles)
export const requiresSpecialization = (role: string): boolean => {
  return ['mst', 'fe', 'hk', 'se'].includes(role);
};

/**
 * Check if a role is a procurement role (executes procurement, does NOT approve)
 */
export const isProcurementRole = (role: string): boolean => {
  return ['procurement_manager', 'purchase_executive'].includes(role);
};

/**
 * Check if a role is an operations role (creates requisitions or approves them)
 */
export const isOperationsRole = (role: string): boolean => {
  return ['fe', 'ops_supervisor'].includes(role);
};

/**
 * Check if a role is eligible to approve requisitions (management L2+ only)
 * Operational roles like FE, MST, HK, SE cannot be approvers
 */
export const isApproverEligibleRole = (role: string): boolean => {
  return [
    'assistant_manager',
    'assistant_floor_manager',
    'assistant_general_manager',
    'assistant_vice_president',
    'vp',
    'ceo',
    'cxo',
    'admin'
  ].includes(role);
};

/**
 * Check if user is a procurement manager (has delete permissions and dashboard access)
 */
export const isProcurementManager = (role: string): boolean => {
  return role === 'procurement_manager';
};

/**
 * Check if user is a purchase executive (execution only, no delete permissions)
 */
export const isPurchaseExecutive = (role: string): boolean => {
  return role === 'purchase_executive';
};

// ==================== ROLE HIERARCHY ====================
export const ROLE_HIERARCHY = {
  'L4+': {
    label: 'Multi-Property Access',
    description: 'View all properties, full system access',
    roles: ['super_admin']
  },
  L3: {
    label: 'Property-Level Management',
    description: 'View assigned properties, senior management',
    roles: ['admin', 'ceo', 'cxo', 'vp', 'assistant_vice_president', 'assistant_general_manager']
  },
  L2: {
    label: 'Department-Level',
    description: 'Department-specific access within property',
    roles: ['assistant_manager', 'assistant_floor_manager', 'ops_supervisor', 'property_manager', 'procurement_manager', 'super_tenant']
  },
  L1: {
    label: 'Field-Level',
    description: 'Operational field staff and end users',
    roles: ['mst', 'fe', 'hk', 'se', 'bms_operator', 'field_staff', 'purchase_executive', 'tenant', 'vendor', 'food_vendor']
  }
} as const;

// Helper functions for role hierarchy
export const getRoleLevel = (role: string): 'L4+' | 'L3' | 'L2' | 'L1' | null => {
  for (const [level, config] of Object.entries(ROLE_HIERARCHY)) {
    if ((config.roles as readonly string[]).includes(role)) {
      return level as 'L4+' | 'L3' | 'L2' | 'L1';
    }
  }
  return null;
};

export const canSwitchProperties = (role: string): boolean => {
  const level = getRoleLevel(role);
  return level === 'L4+' || level === 'L3';
};

export const canViewAllProperties = (role: string): boolean => {
  return getRoleLevel(role) === 'L4+';
};

export const isRestrictedToSingleProperty = (role: string): boolean => {
  const level = getRoleLevel(role);
  return level === 'L1' || level === 'L2';
};