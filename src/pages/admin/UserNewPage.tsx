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
  const { roles, isLoading: rolesLoading, requiresSpecialization } = useInvitationRoles();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    department: "",
    specialization: "",
  });

  // Set default role when roles are loaded
  useEffect(() => {
    if (roles.length > 0 && !formData.role) {
      setFormData(prev => ({ ...prev, role: roles[0].title }));
    }
  }, [roles, formData.role]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.role) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: formData.role,
          department: formData.department || null,
          specialization: formData.specialization || null,
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
        title: "Invitation Sent!",
        description: `Invitation email sent to ${formData.email}. They will receive an email to set up their account.`,
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
              Enter the details and send an invitation email to the new user
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
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
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
                
                {/* Enhanced Department Selector */}
                <div className="col-span-2">
                  <DepartmentSelector
                    selectedDepartment={formData.department}
                    selectedSpecialization={formData.specialization}
                    onDepartmentChange={(dept) => handleInputChange('department', dept)}
                    onSpecializationChange={(spec) => handleInputChange('specialization', spec)}
                    showSpecialization={requiresSpecialization(formData.role)}
                    required={requiresSpecialization(formData.role)}
                    className="w-full"
                  />
                </div>
                
                <div className="flex gap-4 pt-4">
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending Invitation..." : "Send Invitation"}
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