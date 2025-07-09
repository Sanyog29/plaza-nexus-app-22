import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';

interface EscalationPrediction {
  id: string;
  request_id: string;
  predicted_escalation_probability: number;
  risk_factors: any;
  recommended_actions: any; // JSON array from database
  model_version?: string;
  prediction_date: string;
  actual_escalated?: boolean;
  escalation_date?: string;
  request?: {
    title: string;
    priority: string;
    status: string;
    created_at: string;
  };
}

export function useEscalationPredictions() {
  const { user, isAdmin, isStaff } = useAuth();
  const [predictions, setPredictions] = useState<EscalationPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isStaff || isAdmin) {
      fetchPredictions();
    }
  }, [user, isStaff, isAdmin]);

  const fetchPredictions = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('escalation_predictions')
        .select(`
          *,
          request:maintenance_requests(title, priority, status, created_at)
        `)
        .order('predicted_escalation_probability', { ascending: false });
      
      if (error) throw error;
      
      setPredictions(data || []);
      
    } catch (error: any) {
      console.error('Error fetching escalation predictions:', error);
      toast({
        title: "Error",
        description: "Failed to load escalation predictions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getHighRiskPredictions = (threshold = 0.7) => {
    return predictions.filter(p => p.predicted_escalation_probability >= threshold);
  };

  const getPredictionsByRiskLevel = () => {
    const high = predictions.filter(p => p.predicted_escalation_probability >= 0.7);
    const medium = predictions.filter(p => p.predicted_escalation_probability >= 0.4 && p.predicted_escalation_probability < 0.7);
    const low = predictions.filter(p => p.predicted_escalation_probability < 0.4);

    return { high, medium, low };
  };

  const updateActualOutcome = async (predictionId: string, escalated: boolean) => {
    try {
      const { error } = await supabase
        .from('escalation_predictions')
        .update({
          actual_escalated: escalated,
          escalation_date: escalated ? new Date().toISOString() : null
        })
        .eq('id', predictionId);

      if (error) throw error;

      await fetchPredictions();
      toast({
        title: "Success",
        description: "Prediction outcome updated",
      });
    } catch (error: any) {
      console.error('Error updating prediction outcome:', error);
      toast({
        title: "Error",
        description: "Failed to update prediction outcome",
        variant: "destructive",
      });
    }
  };

  const getModelAccuracy = () => {
    const predictionsWithOutcomes = predictions.filter(p => p.actual_escalated !== null);
    if (predictionsWithOutcomes.length === 0) return 0;

    const correct = predictionsWithOutcomes.filter(p => {
      const predicted = p.predicted_escalation_probability >= 0.5;
      return predicted === p.actual_escalated;
    }).length;

    return Math.round((correct / predictionsWithOutcomes.length) * 100);
  };

  return {
    predictions,
    isLoading,
    getHighRiskPredictions,
    getPredictionsByRiskLevel,
    updateActualOutcome,
    getModelAccuracy,
    refetch: fetchPredictions
  };
}