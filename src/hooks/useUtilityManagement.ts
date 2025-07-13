import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface UtilityMeter {
  id: string;
  meter_id: string;
  meter_type: string;
  location: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UtilityReading {
  id: string;
  meter_id: string;
  reading_date: string;
  reading_value: number;
  consumption: number | null;
  cost_per_unit: number | null;
  total_cost: number | null;
  recorded_by: string | null;
  reading_method: string;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useUtilityManagement = () => {
  const [meters, setMeters] = useState<UtilityMeter[]>([]);
  const [readings, setReadings] = useState<UtilityReading[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = () => {
    // Initialize with mock data for demo
    const mockMeters: UtilityMeter[] = [
      { id: '1', meter_id: 'ELE-001', meter_type: 'electricity', location: 'Main Building - Floor 1', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '2', meter_id: 'WAT-001', meter_type: 'water', location: 'Main Building - Kitchen', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: '3', meter_id: 'GAS-001', meter_type: 'gas', location: 'Main Building - Kitchen', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ];

    setMeters(mockMeters);
    setReadings(generateMockReadings());
    setLoading(false);
  };

  const generateMockReadings = (): UtilityReading[] => {
    const readings: UtilityReading[] = [];
    const meterIds = ['1', '2', '3'];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      meterIds.forEach(meterId => {
        readings.push({
          id: `${meterId}-${i}`,
          meter_id: meterId,
          reading_date: date.toISOString().split('T')[0],
          reading_value: Math.floor(Math.random() * 1000) + 100,
          consumption: Math.floor(Math.random() * 100) + 10,
          cost_per_unit: Math.random() * 5 + 1,
          total_cost: Math.random() * 500 + 50,
          recorded_by: null,
          reading_method: 'manual',
          photo_url: null,
          notes: null,
          created_at: date.toISOString(),
          updated_at: date.toISOString()
        });
      });
    }
    
    return readings.sort((a, b) => new Date(b.reading_date).getTime() - new Date(a.reading_date).getTime());
  };

  const fetchMeters = async () => {
    // Mock implementation - in production would fetch from Supabase
    console.log('Fetching meters from database...');
  };

  const fetchReadings = async () => {
    // Mock implementation - in production would fetch from Supabase
    console.log('Fetching readings from database...');
  };

  const createReading = async (reading: Omit<UtilityReading, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // For demo purposes, create a mock reading
      const mockReading: UtilityReading = {
        id: `mock-${Date.now()}`,
        ...reading,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setReadings(prev => [mockReading, ...prev]);
      toast({
        title: "Success",
        description: "Reading added successfully (demo mode)"
      });
      
      return { data: mockReading, error: null };
    } catch (error) {
      console.error('Error creating reading:', error);
      toast({
        title: "Error",
        description: "Failed to create reading",
        variant: "destructive"
      });
      return { data: null, error };
    }
  };

  const getReadingsByMeter = (meterId: string) => {
    return readings.filter(reading => reading.meter_id === meterId);
  };

  const getReadingsByType = (meterType: string) => {
    const meterIds = meters
      .filter(meter => meter.meter_type === meterType)
      .map(meter => meter.id);
    
    return readings.filter(reading => meterIds.includes(reading.meter_id));
  };

  const getReadingsByDateRange = (startDate: string, endDate: string) => {
    return readings.filter(reading => 
      reading.reading_date >= startDate && reading.reading_date <= endDate
    );
  };

  return {
    meters,
    readings,
    loading,
    fetchMeters,
    fetchReadings,
    createReading,
    getReadingsByMeter,
    getReadingsByType,
    getReadingsByDateRange
  };
};