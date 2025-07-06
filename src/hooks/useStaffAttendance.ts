import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/components/ui/sonner';

interface AttendanceRecord {
  id: string;
  zone_qr_code: string;
  check_in_time: string;
  check_out_time?: string;
  location?: string;
  metadata: any;
}

interface ZoneQRCode {
  id: string;
  zone_name: string;
  floor: string;
  qr_code_data: string;
  location_description?: string;
}

export function useStaffAttendance() {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [activeAttendance, setActiveAttendance] = useState<AttendanceRecord | null>(null);
  const [availableZones, setAvailableZones] = useState<ZoneQRCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAttendanceRecords();
      fetchAvailableZones();
    }
  }, [user]);

  const fetchAttendanceRecords = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('staff_attendance')
        .select('*')
        .eq('staff_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAttendanceRecords(data || []);
      
      // Find active attendance (checked in but not checked out)
      const active = data?.find(record => !record.check_out_time);
      setActiveAttendance(active || null);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      toast.error('Failed to load attendance records');
    }
  };

  const fetchAvailableZones = async () => {
    try {
      const { data, error } = await supabase
        .from('zone_qr_codes')
        .select('*')
        .eq('is_active', true)
        .order('floor', { ascending: true });

      if (error) throw error;
      setAvailableZones(data || []);
    } catch (error) {
      console.error('Error fetching zones:', error);
    }
  };

  const checkIn = async (qrData: any) => {
    if (!user || activeAttendance) {
      toast.error(activeAttendance ? 'Already checked in' : 'User not authenticated');
      return false;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('staff_attendance')
        .insert({
          staff_id: user.id,
          zone_qr_code: qrData.zone,
          location: qrData.floor,
          metadata: qrData
        })
        .select()
        .single();

      if (error) throw error;

      setActiveAttendance(data);
      await fetchAttendanceRecords();
      
      toast.success(`Checked in at ${qrData.zone}`);
      return true;
    } catch (error) {
      console.error('Error checking in:', error);
      toast.error('Failed to check in');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const checkOut = async () => {
    if (!user || !activeAttendance) {
      toast.error('No active attendance found');
      return false;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('staff_attendance')
        .update({ check_out_time: new Date().toISOString() })
        .eq('id', activeAttendance.id);

      if (error) throw error;

      setActiveAttendance(null);
      await fetchAttendanceRecords();
      
      toast.success('Checked out successfully');
      return true;
    } catch (error) {
      console.error('Error checking out:', error);
      toast.error('Failed to check out');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getTodaysAttendance = () => {
    const today = new Date().toDateString();
    return attendanceRecords.filter(record => 
      new Date(record.check_in_time).toDateString() === today
    );
  };

  return {
    attendanceRecords,
    activeAttendance,
    availableZones,
    isLoading,
    checkIn,
    checkOut,
    getTodaysAttendance,
    refetch: fetchAttendanceRecords
  };
}