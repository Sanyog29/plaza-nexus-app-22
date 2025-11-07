import { toast } from "@/hooks/use-toast";
import { PostgrestError } from "@supabase/supabase-js";

/**
 * Procurement-specific error types
 */
export interface ProcurementError {
  code: string;
  message: string;
  details?: string;
  retryable: boolean;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Error patterns and their user-friendly messages
 */
const ERROR_PATTERNS = {
  // Constraint violations
  POSITIVE_AMOUNT: {
    pattern: /po_positive_total|po_items_positive/i,
    message: "Invalid amount or quantity",
    details: "All amounts and quantities must be positive values",
    retryable: false,
    severity: 'error' as const
  },
  DUPLICATE_PO: {
    pattern: /purchase_orders_property_requisition_unique|duplicate key value violates unique constraint/i,
    message: "Purchase order already exists",
    details: "A purchase order has already been created for this requisition",
    retryable: false,
    severity: 'warning' as const
  },
  IDEMPOTENCY_VIOLATION: {
    pattern: /purchase_orders_idempotency_key_unique/i,
    message: "Duplicate operation detected",
    details: "This operation has already been processed",
    retryable: false,
    severity: 'warning' as const
  },
  
  // Status transition errors
  INVALID_STATUS_TRANSITION: {
    pattern: /Invalid status transition/i,
    message: "Invalid status change",
    details: "This status transition is not allowed",
    retryable: false,
    severity: 'error' as const
  },
  FINAL_STATE_MODIFICATION: {
    pattern: /Cannot change status from final state/i,
    message: "Cannot modify completed order",
    details: "This purchase order is in a final state and cannot be modified",
    retryable: false,
    severity: 'error' as const
  },
  
  // Property consistency errors
  PROPERTY_MISMATCH: {
    pattern: /property_id.*does not match.*requisition property_id/i,
    message: "Property mismatch detected",
    details: "Purchase order property does not match the requisition property",
    retryable: false,
    severity: 'error' as const
  },
  
  // RLS and permission errors
  RLS_VIOLATION: {
    pattern: /row-level security policy|violates row-level security/i,
    message: "Access denied",
    details: "You don't have permission to perform this action",
    retryable: false,
    severity: 'error' as const
  },
  INSUFFICIENT_PRIVILEGES: {
    pattern: /permission denied|insufficient privileges/i,
    message: "Insufficient permissions",
    details: "Your role does not allow this operation",
    retryable: false,
    severity: 'error' as const
  },
  
  // Optimistic locking errors
  VERSION_CONFLICT: {
    pattern: /version.*mismatch|concurrent update/i,
    message: "Data was modified by another user",
    details: "Please refresh and try again",
    retryable: true,
    severity: 'warning' as const
  },
  
  // Network and connectivity errors
  NETWORK_ERROR: {
    pattern: /network|fetch.*failed|ECONNREFUSED|timeout/i,
    message: "Network connection issue",
    details: "Please check your internet connection and try again",
    retryable: true,
    severity: 'error' as const
  },
  CONNECTION_TIMEOUT: {
    pattern: /connection.*timeout|timed out/i,
    message: "Request timed out",
    details: "The server took too long to respond. Please try again",
    retryable: true,
    severity: 'error' as const
  },
  
  // Database errors
  FOREIGN_KEY_VIOLATION: {
    pattern: /foreign key constraint|violates foreign key/i,
    message: "Related data not found",
    details: "The referenced record does not exist",
    retryable: false,
    severity: 'error' as const
  },
  NOT_NULL_VIOLATION: {
    pattern: /null value.*violates not-null constraint/i,
    message: "Required field missing",
    details: "Please provide all required information",
    retryable: false,
    severity: 'error' as const
  }
};

/**
 * Parse error from various sources into ProcurementError
 */
export function parseProcurementError(error: unknown): ProcurementError {
  // Handle Supabase PostgrestError
  if (error && typeof error === 'object' && 'code' in error) {
    const pgError = error as PostgrestError;
    const errorMessage = pgError.message || 'An error occurred';
    const errorDetails = pgError.details || '';
    const fullError = `${errorMessage} ${errorDetails}`;
    
    // Check against patterns
    for (const [key, pattern] of Object.entries(ERROR_PATTERNS)) {
      if (pattern.pattern.test(fullError)) {
        return {
          code: key,
          message: pattern.message,
          details: pattern.details,
          retryable: pattern.retryable,
          severity: pattern.severity
        };
      }
    }
    
    // Default PostgrestError handling
    return {
      code: pgError.code || 'PGRST_ERROR',
      message: 'Database operation failed',
      details: errorMessage,
      retryable: false,
      severity: 'error'
    };
  }
  
  // Handle Error objects
  if (error instanceof Error) {
    const errorMessage = error.message;
    
    // Check against patterns
    for (const [key, pattern] of Object.entries(ERROR_PATTERNS)) {
      if (pattern.pattern.test(errorMessage)) {
        return {
          code: key,
          message: pattern.message,
          details: pattern.details,
          retryable: pattern.retryable,
          severity: pattern.severity
        };
      }
    }
    
    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
      details: errorMessage,
      retryable: false,
      severity: 'error'
    };
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    for (const [key, pattern] of Object.entries(ERROR_PATTERNS)) {
      if (pattern.pattern.test(error)) {
        return {
          code: key,
          message: pattern.message,
          details: pattern.details,
          retryable: pattern.retryable,
          severity: pattern.severity
        };
      }
    }
    
    return {
      code: 'UNKNOWN_ERROR',
      message: error,
      details: undefined,
      retryable: false,
      severity: 'error'
    };
  }
  
  // Fallback
  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
    details: 'Please try again or contact support',
    retryable: false,
    severity: 'error'
  };
}

/**
 * Display error toast with appropriate styling
 */
export function showErrorToast(error: ProcurementError): void {
  const variant = error.severity === 'error' ? 'destructive' : 'default';
  
  toast({
    variant,
    title: error.message,
    description: error.details,
  });
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: ProcurementError | undefined;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = parseProcurementError(error);
      
      // Don't retry if error is not retryable
      if (!lastError.retryable || attempt === maxRetries) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = initialDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 0.3 * delay; // Add 0-30% jitter
      
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay + jitter}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw lastError!;
}

/**
 * Wrap async operation with error handling and display
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  options: {
    showToast?: boolean;
    onError?: (error: ProcurementError) => void;
  } = {}
): Promise<T | null> {
  const { showToast = true, onError } = options;
  
  try {
    return await operation();
  } catch (error) {
    const procError = parseProcurementError(error);
    
    if (showToast) {
      showErrorToast(procError);
    }
    
    if (onError) {
      onError(procError);
    }
    
    console.error('[ProcurementError]', procError);
    
    return null;
  }
}

/**
 * Combined retry + error handling wrapper
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    showToast?: boolean;
    onError?: (error: ProcurementError) => void;
  } = {}
): Promise<T | null> {
  const { maxRetries = 3, initialDelay = 1000, showToast = true, onError } = options;
  
  try {
    return await retryWithBackoff(operation, maxRetries, initialDelay);
  } catch (error) {
    const procError = error as ProcurementError;
    
    if (showToast) {
      showErrorToast(procError);
    }
    
    if (onError) {
      onError(procError);
    }
    
    console.error('[ProcurementError]', procError);
    
    return null;
  }
}

/**
 * Procurement Error Handler - Main API
 */
export const ProcurementErrorHandler = {
  parse: parseProcurementError,
  showToast: showErrorToast,
  retry: retryWithBackoff,
  handle: withErrorHandling,
  withRetry,
};
