// PHASE 3: TypeScript Security Types for Profile Data
// This file defines strict type boundaries for public vs sensitive profile data

/**
 * Public Profile Fields - Safe for all authenticated users to view
 * These fields can be displayed in user directories, search results, etc.
 */
export interface PublicProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  office_number: string | null;
  phone_number: string | null;
  created_at: string;
  updated_at: string;
  avatar_url: string | null;
  floor: string | null;
  zone: string | null;
  department: string | null;
  approval_status: string;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  profile_visibility: string | null;
  notification_preferences: any;
  bio: string | null;
  skills: string[] | null;
  interests: string[] | null;
  specialization: string | null;
  designation: string | null;
  supervisor_id: string | null;
  shift_start: string | null;
  shift_end: string | null;
  onboarding_date: string | null;
  is_active: boolean | null;
  mobile_number: string | null;
  assigned_role_title: string | null;
  email: string | null;
  user_category: string;
  role: string;
}

/**
 * Sensitive Profile Fields - Only for authorized users (owner, admin, supervisor)
 * These fields contain PII and should be protected
 */
export interface SensitiveProfile {
  email: string;
  phone_number: string | null;
  mobile_number: string | null;
  government_id: string | null;
  employee_id: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  office_number: string | null;
}

/**
 * Full Profile - Combination of public and sensitive fields
 * Only returned when user has permission to view sensitive data
 */
export type FullProfile = PublicProfile & SensitiveProfile;

/**
 * Profile with conditional sensitive data
 * Sensitive fields may be undefined if user lacks permission
 */
export type ConditionalProfile = PublicProfile & Partial<SensitiveProfile>;

/**
 * Type guard to check if profile includes sensitive data
 */
export function hasSensitiveData(profile: ConditionalProfile): profile is FullProfile {
  return 'email' in profile && profile.email !== undefined;
}

/**
 * Fields that should never be exposed in public APIs
 */
export const SENSITIVE_FIELDS = [
  'email',
  'phone_number', 
  'mobile_number',
  'government_id',
  'employee_id',
  'emergency_contact_name',
  'emergency_contact_phone',
  'emergency_contact_relationship',
  'office_number',
  'password_hash'
] as const;

/**
 * Safe fields that can be queried publicly
 */
export const PUBLIC_FIELDS = [
  'id',
  'first_name',
  'last_name',
  'office_number',
  'phone_number',
  'created_at',
  'updated_at',
  'avatar_url',
  'floor',
  'zone',
  'department',
  'approval_status',
  'approved_by',
  'approved_at',
  'rejection_reason',
  'profile_visibility',
  'notification_preferences',
  'bio',
  'skills',
  'interests',
  'specialization',
  'designation',
  'supervisor_id',
  'shift_start',
  'shift_end',
  'onboarding_date',
  'is_active',
  'mobile_number',
  'assigned_role_title',
  'email',
  'user_category',
  'role'
] as const;

/**
 * SQL column selection string for public fields
 */
export const PUBLIC_FIELDS_SELECT = PUBLIC_FIELDS.join(', ');
