import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';

interface SmartRoutingRule {
  id: string;
  condition_type: 'keywords' | 'priority' | 'location' | 'category';
  condition_value: string;
  assignment_logic: 'round_robin' | 'least_workload' | 'skill_match' | 'location_proximity';
  target_staff_roles: string[];
  is_active: boolean;
}

interface StaffWorkload {
  staff_id: string;
  active_requests: number;
  avg_completion_time: number;
  current_capacity: number;
  skills: string[];
  location_zones: string[];
}

export const useSmartRequestRouting = () => {
  const { user, isAdmin } = useAuth();
  const [routingRules, setRoutingRules] = useState<SmartRoutingRule[]>([]);
  const [staffWorkloads, setStaffWorkloads] = useState<StaffWorkload[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // AI-powered request categorization
  const categorizeRequest = async (title: string, description: string, location: string) => {
    const text = `${title} ${description} ${location}`.toLowerCase();
    
    // Simple keyword-based categorization (in production, use ML model)
    const categories = {
      'electrical': ['light', 'power', 'electrical', 'switch', 'outlet', 'circuit'],
      'plumbing': ['water', 'leak', 'pipe', 'drain', 'faucet', 'toilet'],
      'hvac': ['ac', 'heating', 'cooling', 'temperature', 'ventilation', 'air'],
      'cleaning': ['clean', 'trash', 'spill', 'dirty', 'sanitize', 'vacuum'],
      'security': ['lock', 'key', 'access', 'door', 'security', 'card'],
      'general': []
    };

    let bestMatch = 'general';
    let maxScore = 0;

    Object.entries(categories).forEach(([category, keywords]) => {
      let score = 0;
      keywords.forEach(keyword => {
        if (text.includes(keyword)) score++;
      });
      
      if (score > maxScore) {
        maxScore = score;
        bestMatch = category;
      }
    });

    // Determine priority based on keywords
    const urgentKeywords = ['emergency', 'urgent', 'immediate', 'danger', 'safety'];
    const highKeywords = ['broken', 'not working', 'failed', 'blocked'];
    
    let priority = 'medium';
    if (urgentKeywords.some(keyword => text.includes(keyword))) {
      priority = 'urgent';
    } else if (highKeywords.some(keyword => text.includes(keyword))) {
      priority = 'high';
    }

    return { category: bestMatch, priority, confidence: maxScore / 10 };
  };

  // Intelligent staff assignment
  const assignOptimalStaff = async (requestData: {
    category: string;
    priority: string;
    location: string;
    floor?: string;
    zone?: string;
  }) => {
    try {
      // Get available staff with their current workloads
      const { data: staff, error } = await supabase
        .from('profiles')
        .select(`
          id, first_name, last_name, role, floor, zone,
          maintenance_requests:maintenance_requests!assigned_to(
            id, status, priority, created_at
          )
        `)
        .in('role', ['field_staff', 'ops_supervisor']);

      if (error) throw error;

      // Calculate workload scores for each staff member
      const staffScores = staff.map(member => {
        const activeRequests = member.maintenance_requests?.filter(
          req => ['pending', 'in_progress'].includes(req.status)
        ) || [];

        const urgentRequests = activeRequests.filter(req => req.priority === 'urgent').length;
        const totalRequests = activeRequests.length;

        // Location proximity score (same floor/zone gets higher score)
        let locationScore = 0;
        if (member.floor === requestData.floor) locationScore += 3;
        if (member.zone === requestData.zone) locationScore += 2;

        // Workload score (lower workload gets higher score)
        const workloadScore = Math.max(0, 10 - totalRequests);
        const urgencyPenalty = urgentRequests * 2;

        // Role-based scoring
        const roleScore = member.role === 'ops_supervisor' ? 2 : 1;

        const totalScore = locationScore + workloadScore + roleScore - urgencyPenalty;

        return {
          staff_id: member.id,
          name: `${member.first_name} ${member.last_name}`,
          role: member.role,
          score: totalScore,
          workload: totalRequests,
          location: `${member.floor || 'Any'} - ${member.zone || 'Any'}`
        };
      });

      // Sort by score (highest first) and return top candidate
      const sortedStaff = staffScores.sort((a, b) => b.score - a.score);
      return sortedStaff[0] || null;
    } catch (error) {
      console.error('Error in staff assignment:', error);
      return null;
    }
  };

  // Predictive escalation based on historical data
  const predictEscalationRisk = async (requestData: any) => {
    try {
      // Get historical data for similar requests
      const { data: historicalRequests, error } = await supabase
        .from('maintenance_requests')
        .select('completed_at, created_at, sla_breach_at, priority, location')
        .eq('status', 'completed')
        .limit(100);

      if (error) throw error;

      // Simple risk calculation based on historical patterns
      const similarRequests = historicalRequests.filter(req => 
        req.priority === requestData.priority ||
        req.location === requestData.location
      );

      if (similarRequests.length === 0) return { risk: 'medium', confidence: 0.5 };

      const breachedCount = similarRequests.filter(req => 
        req.sla_breach_at && new Date(req.completed_at) > new Date(req.sla_breach_at)
      ).length;

      const riskPercentage = breachedCount / similarRequests.length;
      
      let risk = 'low';
      if (riskPercentage > 0.7) risk = 'high';
      else if (riskPercentage > 0.4) risk = 'medium';

      return { risk, confidence: similarRequests.length / 100 };
    } catch (error) {
      console.error('Error predicting escalation risk:', error);
      return { risk: 'medium', confidence: 0.5 };
    }
  };

  // Smart bulk assignment of requests
  const performSmartBulkAssignment = async (requestIds: string[]) => {
    if (!isAdmin) return false;

    setIsLoading(true);
    try {
      // Get requests data
      const { data: requests, error: reqError } = await supabase
        .from('maintenance_requests')
        .select('*')
        .in('id', requestIds);

      if (reqError) throw reqError;

      const assignments = [];

      // Process each request for optimal assignment
      for (const request of requests) {
        const optimalStaff = await assignOptimalStaff({
          category: request.category_id || 'general',
          priority: request.priority,
          location: request.location,
        });

        if (optimalStaff) {
          assignments.push({
            request_id: request.id,
            staff_id: optimalStaff.staff_id,
            assignment_reason: `Auto-assigned based on workload (${optimalStaff.workload}) and location match`
          });
        }
      }

      // Execute assignments
      const updatePromises = assignments.map(assignment =>
        supabase
          .from('maintenance_requests')
          .update({ 
            assigned_to: assignment.staff_id,
            status: 'in_progress'
          })
          .eq('id', assignment.request_id)
      );

      await Promise.all(updatePromises);

      toast({
        title: "Smart Assignment Completed",
        description: `Successfully assigned ${assignments.length} requests to optimal staff members.`
      });

      return true;
    } catch (error: any) {
      console.error('Error in smart bulk assignment:', error);
      toast({
        title: "Error",
        description: "Smart assignment failed: " + error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Load staff workload data
  const loadStaffWorkloads = async () => {
    try {
      const { data: staff, error } = await supabase
        .from('profiles')
        .select(`
          id, first_name, last_name, role, floor, zone,
          maintenance_requests:maintenance_requests!assigned_to(
            id, status, priority, created_at, completed_at
          )
        `)
        .in('role', ['field_staff', 'ops_supervisor']);

      if (error) throw error;

      const workloads = staff.map(member => {
        const requests = member.maintenance_requests || [];
        const activeRequests = requests.filter(req => 
          ['pending', 'in_progress'].includes(req.status)
        );
        
        const completedRequests = requests.filter(req => req.status === 'completed');
        const avgCompletionTime = completedRequests.length > 0
          ? completedRequests.reduce((acc, req) => {
              const duration = new Date(req.completed_at).getTime() - new Date(req.created_at).getTime();
              return acc + duration;
            }, 0) / completedRequests.length / (1000 * 60 * 60) // Convert to hours
          : 0;

        return {
          staff_id: member.id,
          name: `${member.first_name} ${member.last_name}`,
          role: member.role,
          active_requests: activeRequests.length,
          avg_completion_time: Math.round(avgCompletionTime * 100) / 100,
          current_capacity: Math.max(0, 10 - activeRequests.length), // Assume max 10 concurrent
          skills: [], // Would be populated from staff skills table
          location_zones: [member.zone || 'Any']
        };
      });

      setStaffWorkloads(workloads);
    } catch (error) {
      console.error('Error loading staff workloads:', error);
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      loadStaffWorkloads();
    }
  }, [user, isAdmin]);

  return {
    categorizeRequest,
    assignOptimalStaff,
    predictEscalationRisk,
    performSmartBulkAssignment,
    staffWorkloads,
    isLoading,
    loadStaffWorkloads
  };
};