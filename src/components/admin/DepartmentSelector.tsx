import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Department {
  id: string;
  name: string;
  description: string;
  specializations: string[];
}

interface DepartmentSelectorProps {
  selectedDepartment?: string;
  selectedSpecialization?: string;
  onDepartmentChange: (department: string) => void;
  onSpecializationChange: (specialization: string) => void;
  showSpecialization?: boolean;
  required?: boolean;
  className?: string;
}

export const DepartmentSelector: React.FC<DepartmentSelectorProps> = ({
  selectedDepartment,
  selectedSpecialization,
  onDepartmentChange,
  onSpecializationChange,
  showSpecialization = true,
  required = false,
  className = ""
}) => {
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [availableSpecializations, setAvailableSpecializations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      const dept = departments.find(d => d.name === selectedDepartment);
      if (dept) {
        setAvailableSpecializations(dept.specializations || []);
      }
    } else {
      setAvailableSpecializations([]);
    }
  }, [selectedDepartment, departments]);

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error: any) {
      console.error('Error fetching departments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch departments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDepartmentChange = (value: string) => {
    onDepartmentChange(value);
    // Clear specialization when department changes
    if (selectedSpecialization) {
      onSpecializationChange('');
    }
  };

  const getDepartmentDisplayName = (dept: Department) => {
    return dept.description ? `${dept.name} - ${dept.description}` : dept.name;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Department Selection */}
      <div className="space-y-2">
        <Label htmlFor="department" className="flex items-center">
          Department {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <Select 
          value={selectedDepartment || ''} 
          onValueChange={handleDepartmentChange}
          disabled={isLoading}
        >
          <SelectTrigger id="department">
            <SelectValue placeholder={isLoading ? "Loading departments..." : "Select department"} />
          </SelectTrigger>
          <SelectContent>
            {departments.map(dept => (
              <SelectItem key={dept.id} value={dept.name}>
                <div className="flex flex-col">
                  <span className="font-medium">{dept.name}</span>
                  {dept.description && (
                    <span className="text-xs text-muted-foreground">{dept.description}</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Specialization Selection */}
      {showSpecialization && selectedDepartment && availableSpecializations.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="specialization" className="flex items-center">
            Specialization {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Select 
            value={selectedSpecialization || ''} 
            onValueChange={onSpecializationChange}
          >
            <SelectTrigger id="specialization">
              <SelectValue placeholder="Select specialization" />
            </SelectTrigger>
            <SelectContent>
              {availableSpecializations.map(specialization => (
                <SelectItem key={specialization} value={specialization}>
                  {specialization}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Available specializations for {selectedDepartment}
          </p>
        </div>
      )}

      {/* Preview Badge */}
      {selectedDepartment && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {selectedDepartment}
            {selectedSpecialization && ` • ${selectedSpecialization}`}
          </Badge>
        </div>
      )}
    </div>
  );
};

export default DepartmentSelector;