import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/components/ui/sonner';

interface Asset {
  id: string;
  asset_name: string;
  asset_type: string;
  location: string;
  floor: string;
  zone?: string;
  brand?: string;
  model_number?: string;
  serial_number?: string;
  purchase_date?: string;
  installation_date?: string;
  warranty_expiry?: string;
  last_service_date?: string;
  next_service_due?: string;
  service_frequency_months: number;
  amc_vendor?: string;
  amc_contract_number?: string;
  amc_start_date?: string;
  amc_end_date?: string;
  amc_cost?: number;
  status: string;
  notes?: string;
  photo_urls?: string[];
  created_at: string;
  updated_at: string;
}

interface AmcAlert {
  id: string;
  asset_id: string;
  alert_type: string;
  alert_date: string;
  due_date: string;
  is_sent: boolean;
  is_resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  notes?: string;
  asset?: Asset;
}

interface ServiceRecord {
  id: string;
  asset_id: string;
  service_type: string;
  service_date: string;
  performed_by: string;
  service_description: string;
  issues_found?: string;
  actions_taken?: string;
  parts_replaced?: string;
  cost?: number;
  invoice_number?: string;
  invoice_url?: string;
  next_service_date?: string;
  warranty_extended_until?: string;
  service_rating?: number;
  asset?: {
    asset_name: string;
    location: string;
  };
}

export function useAssetManagement() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [amcAlerts, setAmcAlerts] = useState<AmcAlert[]>([]);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAssets();
      fetchAmcAlerts();
      fetchServiceRecords();
    }
  }, [user]);

  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
      toast.error('Failed to load assets');
    }
  };

  const fetchAmcAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('amc_alerts')
        .select(`
          *,
          asset:assets(*)
        `)
        .eq('is_resolved', false)
        .order('alert_date', { ascending: true });

      if (error) throw error;
      setAmcAlerts(data || []);
    } catch (error) {
      console.error('Error fetching AMC alerts:', error);
      toast.error('Failed to load AMC alerts');
    }
  };

  const fetchServiceRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('service_records')
        .select(`
          *,
          asset:assets(asset_name, location)
        `)
        .order('service_date', { ascending: false })
        .limit(20);

      if (error) throw error;
      setServiceRecords(data || []);
    } catch (error) {
      console.error('Error fetching service records:', error);
      toast.error('Failed to load service records');
    }
  };

  const createAsset = async (assetData: Omit<Asset, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('assets')
        .insert(assetData)
        .select()
        .maybeSingle();

      if (error) throw error;

      await fetchAssets();
      toast.success('Asset created successfully');
      return data;
    } catch (error) {
      console.error('Error creating asset:', error);
      toast.error('Failed to create asset');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAsset = async (id: string, updates: Partial<Asset>) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('assets')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchAssets();
      toast.success('Asset updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating asset:', error);
      toast.error('Failed to update asset');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const createServiceRecord = async (serviceData: Omit<ServiceRecord, 'id' | 'asset'>) => {
    if (!user) return null;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_records')
        .insert({
          asset_id: serviceData.asset_id,
          service_type: serviceData.service_type,
          service_date: serviceData.service_date,
          performed_by: serviceData.performed_by,
          service_description: serviceData.service_description,
          issues_found: serviceData.issues_found,
          actions_taken: serviceData.actions_taken,
          parts_replaced: serviceData.parts_replaced,
          cost: serviceData.cost,
          invoice_number: serviceData.invoice_number,
          invoice_url: serviceData.invoice_url,
          next_service_date: serviceData.next_service_date,
          warranty_extended_until: serviceData.warranty_extended_until,
          service_rating: serviceData.service_rating,
          performed_by_user_id: user.id
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      // Update asset's last service date and next service due
      if (serviceData.asset_id && serviceData.service_date) {
        const asset = assets.find(a => a.id === serviceData.asset_id);
        if (asset) {
          const nextServiceDate = new Date(serviceData.service_date);
          nextServiceDate.setMonth(nextServiceDate.getMonth() + asset.service_frequency_months);
          
          await updateAsset(serviceData.asset_id, {
            last_service_date: serviceData.service_date,
            next_service_due: nextServiceDate.toISOString().split('T')[0]
          });
        }
      }

      await fetchServiceRecords();
      toast.success('Service record created successfully');
      return data;
    } catch (error) {
      console.error('Error creating service record:', error);
      toast.error('Failed to create service record');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const resolveAmcAlert = async (alertId: string, notes?: string) => {
    if (!user) return false;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('amc_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
          notes
        })
        .eq('id', alertId);

      if (error) throw error;

      await fetchAmcAlerts();
      toast.success('Alert resolved successfully');
      return true;
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Failed to resolve alert');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const generateAmcAlerts = async () => {
    try {
      const { error } = await supabase.rpc('create_amc_alerts');
      if (error) throw error;

      await fetchAmcAlerts();
      toast.success('AMC alerts generated successfully');
    } catch (error) {
      console.error('Error generating AMC alerts:', error);
      toast.error('Failed to generate AMC alerts');
    }
  };

  const getAssetsByType = (type: string) => {
    return assets.filter(asset => asset.asset_type === type);
  };

  const getAssetsByStatus = (status: string) => {
    return assets.filter(asset => asset.status === status);
  };

  const getUpcomingServices = (days: number = 30) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return assets.filter(asset => {
      if (!asset.next_service_due) return false;
      const serviceDate = new Date(asset.next_service_due);
      return serviceDate <= futureDate && serviceDate >= new Date();
    });
  };

  return {
    assets,
    amcAlerts,
    serviceRecords,
    isLoading,
    createAsset,
    updateAsset,
    createServiceRecord,
    resolveAmcAlert,
    generateAmcAlerts,
    getAssetsByType,
    getAssetsByStatus,
    getUpcomingServices,
    refetch: () => Promise.all([fetchAssets(), fetchAmcAlerts(), fetchServiceRecords()])
  };
}