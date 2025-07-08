import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';

interface SystemSetting {
  id: string;
  category: string;
  key: string;
  value: any;
  data_type: string;
  description?: string;
  is_encrypted: boolean;
  created_at: string;
  updated_at: string;
}

export interface SystemConfig {
  maintenance: {
    autoAssignment: boolean;
    defaultSlaHours: number;
    escalationEnabled: boolean;
    notificationEmail: string;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    requirePasswordChange: boolean;
    twoFactorEnabled: boolean;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    alertThreshold: number;
  };
  system: {
    maintenanceMode: boolean;
    debugMode: boolean;
    backupFrequency: string;
    logRetention: number;
  };
}

export const useSystemSettings = () => {
  const { isAdmin } = useAuth();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [config, setConfig] = useState<SystemConfig>({
    maintenance: {
      autoAssignment: true,
      defaultSlaHours: 24,
      escalationEnabled: true,
      notificationEmail: 'admin@ssplaza.com'
    },
    security: {
      sessionTimeout: 60,
      maxLoginAttempts: 5,
      requirePasswordChange: false,
      twoFactorEnabled: false
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      alertThreshold: 5
    },
    system: {
      maintenanceMode: false,
      debugMode: false,
      backupFrequency: 'daily',
      logRetention: 30
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchSettings = async () => {
    if (!isAdmin) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;

      setSettings(data || []);
      
      // Transform settings into config object
      const newConfig = { ...config };
      data?.forEach((setting) => {
        const category = setting.category as keyof SystemConfig;
        const key = setting.key;
        let value = setting.value;
        
        // Parse JSON values
        if (setting.data_type === 'boolean') {
          value = value === true || value === 'true';
        } else if (setting.data_type === 'number') {
          value = typeof value === 'string' ? parseInt(value) : value;
        } else if (setting.data_type === 'string' && typeof value === 'string') {
          // Remove quotes from JSON strings
          value = value.replace(/^"|"$/g, '');
        }
        
        if (newConfig[category] && key in newConfig[category]) {
          (newConfig[category] as any)[key] = value;
        }
      });
      
      setConfig(newConfig);
    } catch (error: any) {
      console.error('Error fetching system settings:', error);
      toast({
        title: "Error",
        description: "Failed to load system settings: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (category: string, key: string, value: any, dataType: string) => {
    if (!isAdmin) return false;

    try {
      // Convert value to appropriate format for storage
      let jsonValue = value;
      if (dataType === 'string') {
        jsonValue = JSON.stringify(value);
      }

      const { error } = await supabase.rpc('set_system_setting', {
        setting_category: category,
        setting_key: key,
        setting_value: jsonValue,
        setting_type: dataType
      });

      if (error) throw error;

      // Update local config
      setConfig(prev => ({
        ...prev,
        [category]: {
          ...prev[category as keyof SystemConfig],
          [key]: value
        }
      }));

      toast({
        title: "Success",
        description: `${category} settings updated successfully.`,
      });

      return true;
    } catch (error: any) {
      console.error('Error updating setting:', error);
      toast({
        title: "Error",
        description: "Failed to update setting: " + error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const updateConfig = (section: keyof SystemConfig, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const saveSection = async (section: keyof SystemConfig) => {
    if (!isAdmin) return false;

    try {
      setIsLoading(true);
      const sectionConfig = config[section];
      const promises = Object.entries(sectionConfig).map(([key, value]) => {
        const dataType = typeof value === 'boolean' ? 'boolean' 
                        : typeof value === 'number' ? 'number' 
                        : 'string';
        return updateSetting(section, key, value, dataType);
      });

      const results = await Promise.all(promises);
      const success = results.every(result => result);

      if (success) {
        await fetchSettings(); // Refresh from database
      }

      return success;
    } catch (error: any) {
      console.error('Error saving section:', error);
      toast({
        title: "Error",
        description: "Failed to save settings: " + error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchSettings();
    }
  }, [isAdmin]);

  return {
    settings,
    config,
    isLoading,
    updateConfig,
    saveSection,
    fetchSettings
  };
};