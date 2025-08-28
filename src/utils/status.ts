import type { Database } from '@/integrations/supabase/types';

// UI-facing status type (includes 'closed' for display)
export type UIStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'closed' | 'en_route';

// Database enum status type (no 'closed', uses 'completed' instead)
export type DBRequestStatus = Database['public']['Enums']['request_status'];

// Convert UI status to database status
export const toDBStatus = (status: UIStatus): DBRequestStatus => {
  return status === 'closed' ? 'completed' : status as DBRequestStatus;
};

// Convert database status to UI status (optional, for display purposes)
export const toUIStatus = (status: DBRequestStatus): UIStatus => {
  return status; // In most cases, they're the same
};

// Map array of UI statuses to DB statuses, removing duplicates
export const mapStatusArrayToDB = (statuses: string[]): DBRequestStatus[] => {
  return [...new Set(statuses.map(status => toDBStatus(status as UIStatus)))];
};