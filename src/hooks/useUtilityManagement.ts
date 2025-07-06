import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/components/ui/sonner';

interface UtilityMeter {
  id: string;
  meter_number: string;
  utility_type: 'electricity' | 'water' | 'gas' | 'internet' | 'hvac' | 'waste_management';
  location: string;
  floor: string;
  zone?: string;
  installation_date?: string;
  last_reading_date?: string;
  last_reading_value?: number;
  unit_of_measurement: string;
  meter_status: string;
  supplier_name?: string;
  contract_number?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  monthly_budget?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface UtilityReading {
  id: string;
  meter_id: string;
  reading_date: string;
  reading_value: number;
  consumption?: number;
  cost_per_unit?: number;
  total_cost?: number;
  recorded_by?: string;
  reading_method: string;
  photo_url?: string;
  notes?: string;
  meter?: {
    meter_number: string;
    utility_type: string;
    location: string;
    unit_of_measurement: string;
  };
}

interface CostCenter {
  id: string;
  name: string;
  code: string;
  department?: string;
  budget_annual?: number;
  budget_monthly?: number;
  manager_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BudgetAllocation {
  id: string;
  cost_center_id: string;
  allocation_month: string;
  category: string;
  allocated_amount: number;
  spent_amount: number;
  cost_center?: {
    name: string;
    code: string;
  };
}

export function useUtilityManagement() {
  const { user } = useAuth();
  const [meters, setMeters] = useState<UtilityMeter[]>([]);
  const [readings, setReadings] = useState<UtilityReading[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [budgetAllocations, setBudgetAllocations] = useState<BudgetAllocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMeters();
      fetchReadings();
      fetchCostCenters();
      fetchBudgetAllocations();
    }
  }, [user]);

  const fetchMeters = async () => {
    try {
      const { data, error } = await supabase
        .from('utility_meters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMeters(data || []);
    } catch (error) {
      console.error('Error fetching utility meters:', error);
      toast.error('Failed to load utility meters');
    }
  };

  const fetchReadings = async () => {
    try {
      const { data, error } = await supabase
        .from('utility_readings')
        .select(`
          *,
          meter:utility_meters(meter_number, utility_type, location, unit_of_measurement)
        `)
        .order('reading_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setReadings(data || []);
    } catch (error) {
      console.error('Error fetching utility readings:', error);
      toast.error('Failed to load utility readings');
    }
  };

  const fetchCostCenters = async () => {
    try {
      const { data, error } = await supabase
        .from('cost_centers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCostCenters(data || []);
    } catch (error) {
      console.error('Error fetching cost centers:', error);
      toast.error('Failed to load cost centers');
    }
  };

  const fetchBudgetAllocations = async () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
      const { data, error } = await supabase
        .from('budget_allocations')
        .select(`
          *,
          cost_center:cost_centers(name, code)
        `)
        .gte('allocation_month', currentMonth)
        .order('allocation_month', { ascending: false });

      if (error) throw error;
      setBudgetAllocations(data || []);
    } catch (error) {
      console.error('Error fetching budget allocations:', error);
      toast.error('Failed to load budget allocations');
    }
  };

  const createMeter = async (meterData: Omit<UtilityMeter, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('utility_meters')
        .insert(meterData)
        .select()
        .single();

      if (error) throw error;

      await fetchMeters();
      toast.success('Utility meter created successfully');
      return data;
    } catch (error) {
      console.error('Error creating meter:', error);
      toast.error('Failed to create utility meter');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const createReading = async (readingData: Omit<UtilityReading, 'id' | 'meter' | 'consumption' | 'total_cost'>) => {
    if (!user) return null;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('utility_readings')
        .insert({
          ...readingData,
          recorded_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Calculate consumption and costs
      await supabase.rpc('calculate_utility_consumption');

      await fetchReadings();
      await fetchMeters(); // Update last reading info
      toast.success('Utility reading recorded successfully');
      return data;
    } catch (error) {
      console.error('Error creating reading:', error);
      toast.error('Failed to record utility reading');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateMeter = async (id: string, updates: Partial<UtilityMeter>) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('utility_meters')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchMeters();
      toast.success('Utility meter updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating meter:', error);
      toast.error('Failed to update utility meter');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getConsumptionByType = (utilityType: string, days: number = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return readings
      .filter(reading => 
        reading.meter?.utility_type === utilityType &&
        new Date(reading.reading_date) >= cutoffDate
      )
      .reduce((total, reading) => total + (reading.consumption || 0), 0);
  };

  const getCostByType = (utilityType: string, days: number = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return readings
      .filter(reading => 
        reading.meter?.utility_type === utilityType &&
        new Date(reading.reading_date) >= cutoffDate
      )
      .reduce((total, reading) => total + (reading.total_cost || 0), 0);
  };

  const getMetersByType = (type: string) => {
    return meters.filter(meter => meter.utility_type === type);
  };

  const getMetersByStatus = (status: string) => {
    return meters.filter(meter => meter.meter_status === status);
  };

  const getUpcomingContracts = (days: number = 30) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return meters.filter(meter => {
      if (!meter.contract_end_date) return false;
      const endDate = new Date(meter.contract_end_date);
      return endDate <= futureDate && endDate >= new Date();
    });
  };

  return {
    meters,
    readings,
    costCenters,
    budgetAllocations,
    isLoading,
    createMeter,
    createReading,
    updateMeter,
    getConsumptionByType,
    getCostByType,
    getMetersByType,
    getMetersByStatus,
    getUpcomingContracts,
    refetch: () => Promise.all([
      fetchMeters(),
      fetchReadings(),
      fetchCostCenters(),
      fetchBudgetAllocations()
    ])
  };
}