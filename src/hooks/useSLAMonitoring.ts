import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/components/ui/sonner';

interface SLAMetrics {
  totalRequests: number;
  breachedRequests: number;
  warningRequests: number;
  complianceRate: number;
  avgResolutionTime: number;
  totalPenalties: number;
}

interface SLABreach {
  id: string;
  request_id: string;
  escalation_type: string;
  penalty_amount: number;
  escalation_reason: string;
  created_at: string;
  metadata: any;
  maintenance_requests?: {
    id: string;
    title: string;
    priority: string;
    status: string;
    sla_breach_at: string;
  };
}

export const useSLAMonitoring = () => {
  const { user, isAdmin, isStaff } = useAuth();
  const [metrics, setMetrics] = useState<SLAMetrics>({
    totalRequests: 0,
    breachedRequests: 0,
    warningRequests: 0,
    complianceRate: 0,
    avgResolutionTime: 0,
    totalPenalties: 0,
  });
  const [recentBreaches, setRecentBreaches] = useState<SLABreach[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSLAMetrics = async () => {
    if (!user || !isStaff) return;

    try {
      // Get current SLA metrics
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Fetch total requests in last 30 days
      const { data: totalRequestsData } = await supabase
        .from('maintenance_requests')
        .select('id, status, created_at, completed_at, sla_breach_at')
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Fetch escalation logs (SLA breaches) using raw SQL query
      const { data: breachesData } = await supabase
        .rpc('get_recent_sla_breaches', { 
          days_back: 30 
        }) as { data: SLABreach[] | null };

      if (totalRequestsData) {
        const totalRequests = totalRequestsData.length;
        const completedRequests = totalRequestsData.filter(r => r.status === 'completed');
        const breachedRequests = breachesData?.length || 0;
        
        // Calculate warning requests (approaching SLA breach)
        const warningRequests = totalRequestsData.filter(r => {
          if (!r.sla_breach_at || r.status === 'completed') return false;
          const timeToBreach = new Date(r.sla_breach_at).getTime() - Date.now();
          return timeToBreach > 0 && timeToBreach < 30 * 60 * 1000; // 30 minutes
        }).length;

        // Calculate average resolution time
        const avgResolutionTime = completedRequests.length > 0 
          ? completedRequests.reduce((sum, req) => {
              if (req.completed_at && req.created_at) {
                const duration = new Date(req.completed_at).getTime() - new Date(req.created_at).getTime();
                return sum + (duration / (1000 * 60 * 60)); // Convert to hours
              }
              return sum;
            }, 0) / completedRequests.length
          : 0;

        // Calculate total penalties
        const totalPenalties = breachesData?.reduce((sum, breach) => 
          sum + (breach.penalty_amount || 0), 0) || 0;

        const complianceRate = totalRequests > 0 
          ? ((totalRequests - breachedRequests) / totalRequests) * 100 
          : 100;

        setMetrics({
          totalRequests,
          breachedRequests,
          warningRequests,
          complianceRate,
          avgResolutionTime,
          totalPenalties,
        });

        setRecentBreaches(breachesData || []);
      }
    } catch (error) {
      console.error('Error fetching SLA metrics:', error);
      toast.error('Failed to load SLA metrics');
    } finally {
      setIsLoading(false);
    }
  };

  const runSLAChecker = async () => {
    if (!isAdmin) return;

    try {
      // Call the SLA check function
      const { error } = await supabase.rpc('check_sla_breaches');
      
      if (error) throw error;
      
      toast.success('SLA check completed');
      
      // Refresh metrics after running check
      await fetchSLAMetrics();
    } catch (error: any) {
      console.error('Error running SLA check:', error);
      toast.error('Failed to run SLA check: ' + error.message);
    }
  };

  const getSLAStatusColor = (request: any) => {
    if (!request.sla_breach_at) return 'gray';
    
    const now = Date.now();
    const breachTime = new Date(request.sla_breach_at).getTime();
    
    if (breachTime < now) return 'red'; // Breached
    
    const timeToBreach = breachTime - now;
    if (timeToBreach < 30 * 60 * 1000) return 'orange'; // Warning (30 min)
    if (timeToBreach < 60 * 60 * 1000) return 'yellow'; // Caution (1 hour)
    
    return 'green'; // Safe
  };

  const formatTimeRemaining = (breachTime: string) => {
    const now = Date.now();
    const breach = new Date(breachTime).getTime();
    const diff = breach - now;
    
    if (diff < 0) {
      const overdue = Math.abs(diff);
      const hours = Math.floor(overdue / (1000 * 60 * 60));
      const minutes = Math.floor((overdue % (1000 * 60 * 60)) / (1000 * 60));
      return `Overdue by ${hours}h ${minutes}m`;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
  };

  // Set up real-time monitoring
  useEffect(() => {
    if (!user || !isStaff) return;

    fetchSLAMetrics();

    // Listen for new escalation logs
    const escalationChannel = supabase
      .channel('sla-monitoring')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'escalation_logs'
        },
        (payload) => {
          console.log('New SLA escalation:', payload);
          fetchSLAMetrics(); // Refresh metrics
          
          // Show notification for new breach
          if (payload.new.escalation_type === 'sla_breach') {
            toast.error(`SLA Breach Alert! Request ${payload.new.request_id}`, {
              description: `Penalty: $${payload.new.penalty_amount || 0}`,
              duration: 10000,
            });
          }
        }
      )
      .subscribe();

    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchSLAMetrics();
    }, 5 * 60 * 1000);

    return () => {
      supabase.removeChannel(escalationChannel);
      clearInterval(interval);
    };
  }, [user, isStaff]);

  return {
    metrics,
    recentBreaches,
    isLoading,
    runSLAChecker,
    getSLAStatusColor,
    formatTimeRemaining,
    refreshMetrics: fetchSLAMetrics,
  };
};