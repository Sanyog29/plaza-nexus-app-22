/**
 * Idempotency Key Generation Utilities
 * Ensures unique, collision-resistant keys for procurement operations
 */

/**
 * Generate a cryptographically random string
 */
function generateRandomString(length: number = 8): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(36).padStart(2, '0'))
    .join('')
    .substring(0, length)
    .toUpperCase();
}

/**
 * Generate idempotency key for requisition creation
 * Format: REQ-{property_code}-{timestamp}-{random}
 */
export function generateRequisitionIdempotencyKey(
  propertyCode: string,
  timestamp: Date = new Date()
): string {
  const timeStr = timestamp.getTime().toString(36).toUpperCase();
  const random = generateRandomString(6);
  const sanitizedCode = propertyCode.replace(/[^A-Z0-9]/g, '').substring(0, 5);
  
  return `REQ-${sanitizedCode}-${timeStr}-${random}`;
}

/**
 * Generate idempotency key for purchase order creation
 * Format: PO-{property_code}-{timestamp}-{random}
 */
export function generatePOIdempotencyKey(
  propertyCode: string,
  timestamp: Date = new Date()
): string {
  const timeStr = timestamp.getTime().toString(36).toUpperCase();
  const random = generateRandomString(6);
  const sanitizedCode = propertyCode.replace(/[^A-Z0-9]/g, '').substring(0, 5);
  
  return `PO-${sanitizedCode}-${timeStr}-${random}`;
}

/**
 * Validate idempotency key format
 */
export function isValidIdempotencyKey(key: string, type: 'REQ' | 'PO'): boolean {
  const pattern = type === 'REQ' 
    ? /^REQ-[A-Z0-9]{1,5}-[A-Z0-9]+-[A-Z0-9]{6}$/
    : /^PO-[A-Z0-9]{1,5}-[A-Z0-9]+-[A-Z0-9]{6}$/;
  
  return pattern.test(key);
}

/**
 * Extract property code from idempotency key
 */
export function extractPropertyCode(idempotencyKey: string): string | null {
  const parts = idempotencyKey.split('-');
  return parts.length >= 2 ? parts[1] : null;
}

/**
 * Check if idempotency key is recent (within last 24 hours)
 */
export function isRecentIdempotencyKey(idempotencyKey: string): boolean {
  try {
    const parts = idempotencyKey.split('-');
    if (parts.length < 3) return false;
    
    const timestamp = parseInt(parts[2], 36);
    const now = Date.now();
    const hoursDiff = (now - timestamp) / (1000 * 60 * 60);
    
    return hoursDiff <= 24;
  } catch {
    return false;
  }
}
