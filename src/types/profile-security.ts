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
  avatar_url: string | null;
  department: string | null;
  floor: string | null;
  zone: string | null;
  bio: string | null;
  skills: string[] | null;
  interests: string[] | null;
  designation: string | null;
  role: string;
  approval_status: string;
  created_at: string;
  updated_at: string;
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
  'avatar_url',
  'department',
  'floor',
  'zone',
  'bio',
  'skills',
  'interests',
  'designation',
  'role',
  'approval_status',
  'created_at',
  'updated_at'
] as const;

/**
 * SQL column selection string for public fields
 */
export const PUBLIC_FIELDS_SELECT = PUBLIC_FIELDS.join(', ');
