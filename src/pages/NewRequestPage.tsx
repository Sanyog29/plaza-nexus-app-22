
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import RequestFormHeader from '@/components/maintenance/RequestFormHeader';
import MaintenanceRequestForm from '@/components/maintenance/MaintenanceRequestForm';

const NewRequestPage = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_categories')
        .select('*');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching categories",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="px-4 py-6">
      <RequestFormHeader />
      <MaintenanceRequestForm 
        categories={categories}
        isLoading={isLoading}
        userId={user?.id}
      />
    </div>
  );
};

export default NewRequestPage;
