
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';
import RequestFormHeader from '@/components/maintenance/RequestFormHeader';
import MaintenanceRequestForm from '@/components/maintenance/MaintenanceRequestForm';
import { Loader2 } from 'lucide-react';

const NewRequestPage = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="px-4 py-6">
      <RequestFormHeader />
      
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 text-plaza-blue animate-spin" />
        </div>
      ) : (
        <MaintenanceRequestForm 
          categories={categories}
          isLoading={isLoading}
          userId={user?.id}
        />
      )}
    </div>
  );
};

export default NewRequestPage;
