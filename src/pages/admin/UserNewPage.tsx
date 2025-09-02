import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DepartmentSelector } from "@/components/admin/DepartmentSelector";
import { useInvitationRoles } from "@/hooks/useInvitationRoles";

export default function UserNewPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { roles, isLoading: rolesLoading, requiresSpecialization, getRoleDefaults, requiresDepartment } = useInvitationRoles();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobileNumber: "",
    password: "",
    empId: "",
    role: "",
    department: "",
    specialization: "",
  });

  // Set default role when roles are loaded  
  useEffect(() => {
    if (roles.length > 0 && !formData.role) {
      const defaultRole = roles[0].title;
      const roleDefaults = getRoleDefaults(defaultRole);
      const showDept = requiresDepartment(defaultRole);
      
      setFormData(prev => ({ 
        ...prev, 
        role: defaultRole,
        department: showDept ? (roleDefaults.department || '') : '',
        specialization: roleDefaults.specialization || ''
      }));
    }
  }, [roles, formData.role, getRoleDefaults, requiresDepartment]);

  const handleInputChange = (field: string, value: string) => {
    if (field === 'role') {
      const roleDefaults = getRoleDefaults(value);
      const showDept = requiresDepartment(value);
      
      setFormData(prev => ({
        ...prev,
        role: value,
        department: showDept ? (roleDefaults.department || prev.department) : '',
        specialization: roleDefaults.specialization || ''
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.role) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate email or mobile number is provided
    if (!formData.email && !formData.mobileNumber) {
      toast({
        title: "Contact Information Required",
        description: "Please provide either email address or mobile number",
        variant: "destructive",
      });
      return;
    }

    // Validate department for non-tenant roles
    if (requiresDepartment(formData.role) && !formData.department) {
      toast({
        title: "Department Required",
        description: "Department is required for this role",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: formData.email || null,
          mobile_number: formData.mobileNumber || null,
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: formData.role,
          department: requiresDepartment(formData.role) ? (formData.department || null) : null,
          specialization: formData.specialization || null,
          password: formData.password || null,
          emp_id: formData.empId || null,
          send_invitation: true,
        }
      });

      if (error) throw error;

      if (data && 'error' in data) {
        toast({
          title: "Error",
          description: data.error as string,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "User Created Successfully!",
        description: `User account created${formData.email ? ` and invitation sent to ${formData.email}` : ''}. ${formData.password ? 'Password has been set for direct login.' : ''}`,
      });
      
      navigate('/admin/users');
    } catch (error: any) {
      console.error('Error sending user invitation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send user invitation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/users')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Create New User</h1>
            <p className="text-muted-foreground mt-2">
              Add a new user to the system
            </p>
          </div>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              User Information
            </CardTitle>
            <CardDescription>
              Enter the user details. Email or mobile number is required. Password is optional (will be auto-generated if not provided).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input 
                      id="firstName" 
                      placeholder="Enter first name"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input 
                      id="lastName" 
                      placeholder="Enter last name"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="Enter email address"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobileNumber">Mobile Number</Label>
                    <Input 
                      id="mobileNumber" 
                      type="tel" 
                      placeholder="Enter mobile number"
                      value={formData.mobileNumber}
                      onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="empId">Employee ID</Label>
                    <Input 
                      id="empId" 
                      placeholder="Enter employee ID"
                      value={formData.empId}
                      onChange={(e) => handleInputChange('empId', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="Leave blank to auto-generate"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select user role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role.id} value={role.title}>{role.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Department Selector - Only show for roles that require departments */}
                {formData.role && requiresDepartment(formData.role) && (
                  <div className="space-y-4">
                    <DepartmentSelector
                      selectedDepartment={formData.department}
                      selectedSpecialization={formData.specialization}
                      onDepartmentChange={(dept) => handleInputChange('department', dept)}
                      onSpecializationChange={(spec) => handleInputChange('specialization', spec)}
                      showSpecialization={requiresSpecialization(formData.role)}
                      required={true}
                      className="w-full"
                    />
                  </div>
                )}
                
                {formData.role && !requiresDepartment(formData.role) && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Note:</strong> This role does not require department assignment.
                    </p>
                  </div>
                )}
                
                <div className="flex gap-4 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating User..." : "Create User"}
                  </Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => navigate('/admin/users')}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}