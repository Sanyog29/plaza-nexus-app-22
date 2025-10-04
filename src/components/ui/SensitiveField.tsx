import { ReactNode, useState, useEffect } from 'react';
import { useCanViewSensitiveData } from '@/hooks/useSecureProfile';
import { ShieldAlert } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface SensitiveFieldProps {
  userId: string;
  value: string | null | undefined;
  fallback?: ReactNode;
  redactedText?: string;
  children?: (value: string) => ReactNode;
}

/**
 * PHASE 4: UI Security Enforcement Component
 * 
 * Component that only renders sensitive data if user has permission
 * Automatically checks permissions and shows fallback for unauthorized users
 * 
 * Usage:
 * <SensitiveField userId={profileId} value={email}>
 *   {(email) => <a href={`mailto:${email}`}>{email}</a>}
 * </SensitiveField>
 */
export const SensitiveField = ({ 
  userId, 
  value, 
  fallback = <span className="text-muted-foreground italic">Hidden</span>,
  redactedText = "[Hidden]",
  children 
}: SensitiveFieldProps) => {
  const { canView, isChecking } = useCanViewSensitiveData(userId);

  // Show loading state
  if (isChecking) {
    return <Skeleton className="h-4 w-24" />;
  }

  // No permission - show fallback
  if (!canView) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <ShieldAlert className="h-4 w-4" />
        {fallback}
      </div>
    );
  }

  // No value provided
  if (!value) {
    return <span className="text-muted-foreground">—</span>;
  }

  // Has permission - render value
  if (children) {
    return <>{children(value)}</>;
  }

  return <span>{value}</span>;
};

/**
 * Simple text version for when you just need to hide/show text
 */
export const SensitiveText = ({ 
  userId, 
  value,
  redacted = "[Hidden]"
}: { 
  userId: string; 
  value: string | null | undefined;
  redacted?: string;
}) => {
  const { canView, isChecking } = useCanViewSensitiveData(userId);

  if (isChecking) return <Skeleton className="h-4 w-20 inline-block" />;
  if (!canView) return <span className="text-muted-foreground">{redacted}</span>;
  if (!value) return <span className="text-muted-foreground">—</span>;
  
  return <span>{value}</span>;
};

/**
 * Link version for emails, phones, etc.
 * Automatically fetches sensitive data if user has permission
 */
export const SensitiveLink = ({
  userId,
  value,
  field,
  type = 'email',
  className
}: {
  userId: string;
  value?: string | null;
  field?: 'phone_number' | 'mobile_number' | 'email' | 'office_number';
  type?: 'email' | 'phone' | 'url';
  className?: string;
}) => {
  const { canView, isChecking } = useCanViewSensitiveData(userId);
  const [fieldValue, setFieldValue] = useState<string | null>(value || null);
  const [loading, setLoading] = useState(!value && !!field);

  // Fetch the specific field if not provided but field name is given
  useEffect(() => {
    if (value || !field || !canView) {
      setLoading(false);
      return;
    }

    const fetchField = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_sensitive_profile_fields', { profile_id: userId });
        
        if (error) throw error;
        
        // data is an array with one row
        if (data && data.length > 0) {
          setFieldValue(data[0][field] as string);
        }
      } catch (error) {
        console.error('Error fetching sensitive field:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchField();
  }, [userId, field, value, canView]);

  if (isChecking || loading) return <Skeleton className="h-4 w-32 inline-block" />;
  if (!canView) return <span className="text-muted-foreground">[Hidden]</span>;
  
  const displayValue = value || fieldValue;
  if (!displayValue) return <span className="text-muted-foreground">—</span>;

  const href = type === 'email' 
    ? `mailto:${displayValue}`
    : type === 'phone'
    ? `tel:${displayValue}`
    : displayValue;

  return (
    <a 
      href={href} 
      className={className || "text-primary hover:underline"}
      onClick={(e) => e.stopPropagation()}
    >
      {displayValue}
    </a>
  );
};
