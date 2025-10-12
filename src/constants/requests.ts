// Canonical request status definitions
export const ACTIVE_REQUEST_STATUSES = ['pending', 'in_progress', 'assigned', 'en_route'] as const;

export type ActiveRequestStatus = typeof ACTIVE_REQUEST_STATUSES[number];
