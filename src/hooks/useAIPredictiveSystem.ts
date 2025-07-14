import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PredictiveInsight {
  id: string;
  insight_type: string;
  target_entity_type: string;
  target_entity_id: string;
  prediction_data: any;
  confidence_score: number;
  valid_until: string;
  created_at: string;
}

interface AutomationRule {
  id: string;
  rule_name: string;
  rule_type: string;
  trigger_conditions: any;
  actions: any;
  priority: number;
  is_active: boolean;
}

interface AIModel {
  id: string;
  model_name: string;
  model_type: string;
  model_config: any;
  accuracy_score: number;
  is_active: boolean;
  version: string;
}

export const useAIPredictiveSystem = () => {
  const [insights, setInsights] = useState<PredictiveInsight[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [aiModels, setAIModels] = useState<AIModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPredictiveInsights = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('predictive_insights')
        .select('*')
        .gte('valid_until', new Date().toISOString())
        .order('confidence_score', { ascending: false });

      if (error) throw error;
      setInsights(data || []);
    } catch (error) {
      console.error('Error fetching predictive insights:', error);
    }
  }, []);

  const fetchAutomationRules = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (error) throw error;
      setAutomationRules(data || []);
    } catch (error) {
      console.error('Error fetching automation rules:', error);
    }
  }, []);

  const fetchAIModels = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .eq('is_active', true)
        .order('accuracy_score', { ascending: false });

      if (error) throw error;
      setAIModels(data || []);
    } catch (error) {
      console.error('Error fetching AI models:', error);
    }
  }, []);

  const generateWorkloadForecast = useCallback(async (timeframe: 'day' | 'week' | 'month') => {
    try {
      // Simulate AI prediction based on historical data
      const { data: historicalData, error } = await supabase
        .from('maintenance_requests')
        .select('created_at, priority, status, assigned_to')
        .gte('created_at', new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)).toISOString());

      if (error) throw error;

      // Simple predictive logic (in real implementation, this would use ML)
      const requestsPerDay = historicalData?.length ? historicalData.length / 30 : 0;
      const forecasted = Math.round(requestsPerDay * (timeframe === 'day' ? 1 : timeframe === 'week' ? 7 : 30));

      const insight = {
        insight_type: 'workload_forecast',
        target_entity_type: 'system',
        target_entity_id: null,
        prediction_data: {
          timeframe,
          predicted_requests: forecasted,
          confidence_factors: ['historical_trends', 'seasonal_patterns'],
          recommendations: [
            'Consider increasing staff during peak hours',
            'Pre-schedule maintenance for high-demand periods'
          ]
        },
        confidence_score: 0.85,
        valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      const { data, error: insertError } = await supabase
        .from('predictive_insights')
        .insert([insight])
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    } catch (error) {
      console.error('Error generating workload forecast:', error);
      throw error;
    }
  }, []);

  const predictMaintenanceNeeds = useCallback(async (assetId: string) => {
    try {
      // Get asset maintenance history
      const { data: asset, error: assetError } = await supabase
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .single();

      if (assetError) throw assetError;

      // Calculate next maintenance prediction
      const lastServiceDate = asset.last_service_date ? new Date(asset.last_service_date) : new Date();
      const serviceFrequency = asset.service_frequency_months || 12;
      const nextDue = new Date(lastServiceDate.getTime() + (serviceFrequency * 30 * 24 * 60 * 60 * 1000));
      const daysUntilDue = Math.ceil((nextDue.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

      let riskLevel = 'low';
      let confidence = 0.7;

      if (daysUntilDue <= 7) {
        riskLevel = 'critical';
        confidence = 0.95;
      } else if (daysUntilDue <= 30) {
        riskLevel = 'high';
        confidence = 0.85;
      } else if (daysUntilDue <= 60) {
        riskLevel = 'medium';
        confidence = 0.75;
      }

      const insight = {
        insight_type: 'maintenance_alert',
        target_entity_type: 'asset',
        target_entity_id: assetId,
        prediction_data: {
          asset_name: asset.asset_name,
          risk_level: riskLevel,
          days_until_due: daysUntilDue,
          predicted_failure_probability: confidence,
          recommended_actions: [
            'Schedule preventive maintenance',
            'Order required parts',
            'Assign qualified technician'
          ]
        },
        confidence_score: confidence,
        valid_until: nextDue.toISOString()
      };

      const { data, error: insertError } = await supabase
        .from('predictive_insights')
        .insert([insight])
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    } catch (error) {
      console.error('Error predicting maintenance needs:', error);
      throw error;
    }
  }, []);

  const optimizeSLATargets = useCallback(async () => {
    try {
      // Analyze current SLA performance
      const { data: recentRequests, error } = await supabase
        .from('maintenance_requests')
        .select('priority, created_at, completed_at, sla_breach_at')
        .gte('created_at', new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)).toISOString());

      if (error) throw error;

      // Calculate performance metrics by priority
      const performanceByPriority = ['urgent', 'high', 'medium', 'low'].map(priority => {
        const priorityRequests = recentRequests?.filter(r => r.priority === priority) || [];
        const completedOnTime = priorityRequests.filter(r => 
          r.completed_at && r.sla_breach_at && 
          new Date(r.completed_at) <= new Date(r.sla_breach_at)
        ).length;
        
        return {
          priority,
          total: priorityRequests.length,
          onTimeCompletion: priorityRequests.length > 0 ? completedOnTime / priorityRequests.length : 1,
          avgCompletionTime: priorityRequests.length > 0 ? 
            priorityRequests.reduce((acc, r) => {
              if (r.completed_at) {
                return acc + (new Date(r.completed_at).getTime() - new Date(r.created_at).getTime());
              }
              return acc;
            }, 0) / priorityRequests.length / (60 * 60 * 1000) : 0
        };
      });

      const insight = {
        insight_type: 'sla_optimization',
        target_entity_type: 'system',
        target_entity_id: null,
        prediction_data: {
          current_performance: performanceByPriority,
          recommendations: performanceByPriority.map(p => ({
            priority: p.priority,
            suggested_sla_hours: Math.ceil(p.avgCompletionTime * 1.2), // 20% buffer
            current_compliance: p.onTimeCompletion
          }))
        },
        confidence_score: 0.8,
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      const { data, error: insertError } = await supabase
        .from('predictive_insights')
        .insert([insight])
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    } catch (error) {
      console.error('Error optimizing SLA targets:', error);
      throw error;
    }
  }, []);

  const executeAutomationRule = useCallback(async (ruleId: string, triggerData: any) => {
    try {
      const rule = automationRules.find(r => r.id === ruleId);
      if (!rule) throw new Error('Automation rule not found');

      // Log the execution
      const { data, error } = await supabase
        .from('workflow_executions')
        .insert([{
          workflow_rule_id: ruleId,
          trigger_context: triggerData,
          execution_status: 'running'
        }])
        .select()
        .single();

      if (error) throw error;

      // Execute the actions (simplified implementation)
      for (const action of rule.actions) {
        switch (action.type) {
          case 'assign_request':
            // Auto-assign request logic
            console.log('Auto-assigning request:', action);
            break;
          case 'send_notification':
            // Send notification logic
            console.log('Sending notification:', action);
            break;
          case 'escalate':
            // Escalation logic
            console.log('Escalating:', action);
            break;
        }
      }

      // Update execution status
      await supabase
        .from('workflow_executions')
        .update({ 
          execution_status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', data.id);

      return data;
    } catch (error) {
      console.error('Error executing automation rule:', error);
      throw error;
    }
  }, [automationRules]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchPredictiveInsights(),
        fetchAutomationRules(),
        fetchAIModels()
      ]);
      setIsLoading(false);
    };

    loadData();
  }, [fetchPredictiveInsights, fetchAutomationRules, fetchAIModels]);

  // Set up real-time subscriptions
  useEffect(() => {
    const insightsChannel = supabase
      .channel('predictive-insights-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'predictive_insights' 
      }, (payload) => {
        fetchPredictiveInsights();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(insightsChannel);
    };
  }, [fetchPredictiveInsights]);

  return {
    insights,
    automationRules,
    aiModels,
    isLoading,
    generateWorkloadForecast,
    predictMaintenanceNeeds,
    optimizeSLATargets,
    executeAutomationRule,
    refreshData: useCallback(() => {
      fetchPredictiveInsights();
      fetchAutomationRules();
      fetchAIModels();
    }, [fetchPredictiveInsights, fetchAutomationRules, fetchAIModels])
  };
};