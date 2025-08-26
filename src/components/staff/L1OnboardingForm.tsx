import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, User, Clock, Phone, Mail, Shield, MapPin, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';

interface L1OnboardingFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  employeeId: string;
  designation: string;
  department: string;
  supervisorId: string;
  shiftStart: string;
  shiftEnd: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  governmentId: string;
  avatarUrl: string;
  skills: string[];
  isActive: boolean;
}

interface Department {
  id: string;
  name: string;
  description: string;
}

interface Skill {
  id: string;
  skill_name: string;
  category: string;
}

interface Supervisor {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

export const L1OnboardingForm: React.FC<{ staffId?: string; onSuccess?: () => void }> = ({ 
  staffId, 
  onSuccess 
}) => {
  const { user, isAdmin } = useAuth();
  // Check if user is ops supervisor
  const isOpsStaff = user?.role === 'ops_supervisor';
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<L1OnboardingFormData>({
    defaultValues: {
      isActive: true,
      skills: []
    }
  });

  const designation = watch('designation');
  const department = watch('department');

  useEffect(() => {
    if (!isAdmin && !isOpsStaff) return;
    
    fetchDepartments();
    fetchSkills();
    fetchSupervisors();
    
    if (staffId) {
      fetchStaffData();
    }
  }, [staffId, isAdmin, isOpsStaff]);

  const fetchDepartments = async () => {
    const { data, error } = await supabase
      .from('operational_departments')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      console.error('Error fetching departments:', error);
      return;
    }
    
    setDepartments(data || []);
  };

  const fetchSkills = async () => {
    const { data, error } = await supabase
      .from('skills_master')
      .select('*')
      .eq('is_active', true)
      .order('skill_name');
    
    if (error) {
      console.error('Error fetching skills:', error);
      return;
    }
    
    setSkills(data || []);
  };

  const fetchSupervisors = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role')
      .in('role', ['admin', 'ops_supervisor'])
      .order('first_name');
    
    if (error) {
      console.error('Error fetching supervisors:', error);
      return;
    }
    
    setSupervisors(data || []);
  };

  const fetchStaffData = async () => {
    if (!staffId) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        staff_skills!inner(
          skill_id,
          skills_master(skill_name)
        )
      `)
      .eq('id', staffId)
      .single();
    
    if (error) {
      console.error('Error fetching staff data:', error);
      return;
    }
    
    if (data) {
      // Populate form with existing data
      setValue('firstName', data.first_name || '');
      setValue('lastName', data.last_name || '');
      // Email is handled separately through auth system
      setValue('phoneNumber', data.phone_number || '');
      setValue('employeeId', data.employee_id || '');
      setValue('designation', data.designation || '');
      setValue('supervisorId', data.supervisor_id || '');
      setValue('shiftStart', data.shift_start || '');
      setValue('shiftEnd', data.shift_end || '');
      setValue('emergencyContactName', data.emergency_contact_name || '');
      setValue('emergencyContactPhone', data.emergency_contact_phone || '');
      setValue('governmentId', data.government_id || '');
      setValue('avatarUrl', data.avatar_url || '');
      setValue('isActive', data.is_active || true);
      
      if (data.avatar_url) {
        setAvatarPreview(data.avatar_url);
      }
      
      // Set selected skills
      const userSkills = data.staff_skills?.map((s: any) => s.skill_id) || [];
      setSelectedSkills(userSkills);
      setValue('skills', userSkills);
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return null;
    
    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(filePath, avatarFile);
    
    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      return null;
    }
    
    const { data } = supabase.storage
      .from('profiles')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  };

  const toggleSkill = (skillId: string) => {
    const newSkills = selectedSkills.includes(skillId)
      ? selectedSkills.filter(id => id !== skillId)
      : [...selectedSkills, skillId];
    
    setSelectedSkills(newSkills);
    setValue('skills', newSkills);
  };

  const onSubmit = async (data: L1OnboardingFormData) => {
    if (!isAdmin && !isOpsStaff) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to manage L1 staff.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Upload avatar if provided
      let avatarUrl = data.avatarUrl;
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar();
        if (uploadedUrl) avatarUrl = uploadedUrl;
      }
      
      const profileData = {
        first_name: data.firstName,
        last_name: data.lastName,
        phone_number: data.phoneNumber,
        employee_id: data.employeeId,
        designation: data.designation,
        supervisor_id: data.supervisorId || null,
        shift_start: data.shiftStart || null,
        shift_end: data.shiftEnd || null,
        emergency_contact_name: data.emergencyContactName,
        emergency_contact_phone: data.emergencyContactPhone,
        government_id: data.governmentId,
        avatar_url: avatarUrl,
        is_active: data.isActive
      };
      
      if (staffId) {
        // Update existing staff
        const { error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', staffId);
        
        if (error) throw error;
      } else {
        // Create new staff member (handled by admin-create-user function)
        toast({
          title: "Info",
          description: "Use the admin user creation flow to create new L1 staff members.",
          variant: "default"
        });
        return;
      }
      
      // Note: Skills management is simplified for now
      // Skills can be managed separately through the admin interface
      
      toast({
        title: "Success",
        description: `L1 staff ${staffId ? 'updated' : 'created'} successfully.`,
        variant: "default"
      });
      
      onSuccess?.();
      
    } catch (error: any) {
      console.error('Error saving L1 staff:', error);
      toast({
        title: "Error",
        description: `Failed to ${staffId ? 'update' : 'create'} L1 staff: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdmin && !isOpsStaff) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">
            You don't have permission to access this form.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {staffId ? 'Update L1 Staff Profile' : 'L1 Staff Onboarding'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Photo */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarPreview} />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <Label htmlFor="avatar" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-md hover:bg-secondary/80">
                  <Upload className="h-4 w-4" />
                  Upload Photo
                </div>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </Label>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                {...register('firstName', { required: 'First name is required' })}
                placeholder="Enter first name"
              />
              {errors.firstName && (
                <p className="text-sm text-destructive mt-1">{errors.firstName.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                {...register('lastName', { required: 'Last name is required' })}
                placeholder="Enter last name"
              />
              {errors.lastName && (
                <p className="text-sm text-destructive mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Work Email *
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email', { required: 'Email is required' })}
                placeholder="Enter work email"
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Mobile Number *
              </Label>
              <Input
                id="phoneNumber"
                {...register('phoneNumber', { required: 'Phone number is required' })}
                placeholder="Enter mobile number"
              />
              {errors.phoneNumber && (
                <p className="text-sm text-destructive mt-1">{errors.phoneNumber.message}</p>
              )}
            </div>
          </div>

          {/* Employment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employeeId">Employee ID *</Label>
              <Input
                id="employeeId"
                {...register('employeeId', { required: 'Employee ID is required' })}
                placeholder="Enter employee ID"
              />
              {errors.employeeId && (
                <p className="text-sm text-destructive mt-1">{errors.employeeId.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="designation">Role/Designation *</Label>
              <Select onValueChange={(value) => setValue('designation', value)} value={designation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electrician">Electrician</SelectItem>
                  <SelectItem value="plumber">Plumber</SelectItem>
                  <SelectItem value="cleaner">Cleaner</SelectItem>
                  <SelectItem value="security_guard">Security Guard</SelectItem>
                  <SelectItem value="maintenance_tech">Maintenance Technician</SelectItem>
                  <SelectItem value="hvac_tech">HVAC Technician</SelectItem>
                  <SelectItem value="janitor">Janitor</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Department and Supervisor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="department">Department *</Label>
              <Select onValueChange={(value) => setValue('department', value)} value={department}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="supervisorId">Supervisor</Label>
              <Select onValueChange={(value) => setValue('supervisorId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supervisor" />
                </SelectTrigger>
                <SelectContent>
                  {supervisors.map((supervisor) => (
                    <SelectItem key={supervisor.id} value={supervisor.id}>
                      {supervisor.first_name} {supervisor.last_name} ({supervisor.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Shift Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shiftStart" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Shift Start Time
              </Label>
              <Input
                id="shiftStart"
                type="time"
                {...register('shiftStart')}
              />
            </div>
            
            <div>
              <Label htmlFor="shiftEnd" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Shift End Time
              </Label>
              <Input
                id="shiftEnd"
                type="time"
                {...register('shiftEnd')}
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
              <Input
                id="emergencyContactName"
                {...register('emergencyContactName')}
                placeholder="Enter emergency contact name"
              />
            </div>
            
            <div>
              <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
              <Input
                id="emergencyContactPhone"
                {...register('emergencyContactPhone')}
                placeholder="Enter emergency contact phone"
              />
            </div>
          </div>

          {/* Government ID */}
          <div>
            <Label htmlFor="governmentId" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Government ID
            </Label>
            <Input
              id="governmentId"
              {...register('governmentId')}
              placeholder="Enter government ID number"
            />
          </div>

          {/* Skills */}
          <div>
            <Label className="flex items-center gap-2 mb-3">
              <Award className="h-4 w-4" />
              Skills & Certifications
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  className={`p-2 rounded-md border cursor-pointer transition-colors ${
                    selectedSkills.includes(skill.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-secondary border-border'
                  }`}
                  onClick={() => toggleSkill(skill.id)}
                >
                  <div className="text-sm font-medium">{skill.skill_name}</div>
                  <div className="text-xs opacity-70">{skill.category}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-4 border rounded-md">
            <div>
              <Label htmlFor="isActive" className="text-base font-medium">
                Active Status
              </Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable this staff member's access
              </p>
            </div>
            <Switch
              id="isActive"
              checked={watch('isActive')}
              onCheckedChange={(checked) => setValue('isActive', checked)}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-8"
            >
              {isSubmitting ? 'Saving...' : (staffId ? 'Update Profile' : 'Create L1 Staff')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};