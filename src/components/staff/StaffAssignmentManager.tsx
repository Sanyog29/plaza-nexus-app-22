import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, MapPin, Users, Filter, Plus, Trash2, User, Building, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  employee_id: string;
  designation: string;
  avatar_url: string;
  is_active: boolean;
  assignments: Assignment[];
}

interface Assignment {
  id: string;
  zone_id: string;
  department_id: string;
  is_primary: boolean;
  is_active: boolean;
  zone: {
    zone_name: string;
    zone_code: string;
    floor: string;
    building: string;
  };
  department: {
    name: string;
  };
}

interface Department {
  id: string;
  name: string;
  description: string;
}

interface Zone {
  id: string;
  zone_name: string;
  zone_code: string;
  floor: string;
  building: string;
  department_id: string;
}

export const StaffAssignmentManager: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterDesignation, setFilterDesignation] = useState('');
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Assignment Modal State
  const [assignmentZone, setAssignmentZone] = useState('');
  const [assignmentDepartment, setAssignmentDepartment] = useState('');
  const [isPrimaryAssignment, setIsPrimaryAssignment] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchStaff();
      fetchDepartments();
      fetchZones();
    }
  }, [isAdmin]);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          employee_id,
          designation,
          avatar_url,
          is_active,
          staff_area_assignments!inner(
            id,
            zone_id,
            department_id,
            is_primary,
            is_active,
            operational_zones(
              zone_name,
              zone_code,
              floor,
              building
            ),
            operational_departments(
              name
            )
          )
        `)
        .eq('role', 'field_staff')
        .eq('staff_area_assignments.is_active', true);

      if (error) throw error;

      const processedStaff = data?.map(member => ({
        ...member,
        assignments: member.staff_area_assignments?.map((assignment: any) => ({
          id: assignment.id,
          zone_id: assignment.zone_id,
          department_id: assignment.department_id,
          is_primary: assignment.is_primary,
          is_active: assignment.is_active,
          zone: assignment.operational_zones,
          department: assignment.operational_departments
        })) || []
      })) || [];

      setStaff(processedStaff);
    } catch (error: any) {
      console.error('Error fetching staff:', error);
      toast({
        title: "Error",
        description: "Failed to load staff data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    const { data, error } = await supabase
      .from('operational_departments')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (!error && data) {
      setDepartments(data);
    }
  };

  const fetchZones = async () => {
    const { data, error } = await supabase
      .from('operational_zones')
      .select('*')
      .eq('is_active', true)
      .order('zone_name');

    if (!error && data) {
      setZones(data);
    }
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = 
      `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.designation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = !filterDepartment || 
      member.assignments.some(a => a.department_id === filterDepartment);

    const matchesDesignation = !filterDesignation || 
      member.designation === filterDesignation;

    return matchesSearch && matchesDepartment && matchesDesignation;
  });

  const handleStaffSelection = (staffId: string, checked: boolean) => {
    if (checked) {
      setSelectedStaff([...selectedStaff, staffId]);
    } else {
      setSelectedStaff(selectedStaff.filter(id => id !== staffId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStaff(filteredStaff.map(s => s.id));
    } else {
      setSelectedStaff([]);
    }
  };

  const handleBulkAssignment = async () => {
    if (selectedStaff.length === 0 || !assignmentZone || !assignmentDepartment) {
      toast({
        title: "Validation Error",
        description: "Please select staff, zone, and department for assignment.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      for (const staffId of selectedStaff) {
        const { error } = await supabase.rpc('assign_staff_to_zone', {
          p_staff_id: staffId,
          p_zone_id: assignmentZone,
          p_department_id: assignmentDepartment,
          p_is_primary: isPrimaryAssignment
        });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Assigned ${selectedStaff.length} staff members to selected zone.`,
        variant: "default"
      });

      // Refresh data
      await fetchStaff();
      
      // Reset form
      setSelectedStaff([]);
      setAssignmentZone('');
      setAssignmentDepartment('');
      setIsPrimaryAssignment(false);
      setShowAssignmentModal(false);

    } catch (error: any) {
      console.error('Error assigning staff:', error);
      toast({
        title: "Error",
        description: `Failed to assign staff: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('staff_area_assignments')
        .update({ is_active: false })
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assignment removed successfully.",
        variant: "default"
      });

      await fetchStaff();
    } catch (error: any) {
      console.error('Error removing assignment:', error);
      toast({
        title: "Error",
        description: `Failed to remove assignment: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">
            You don't have permission to access this page.
          </p>
        </CardContent>
      </Card>
    );
  }

  const availableZones = zones.filter(zone => 
    !assignmentDepartment || zone.department_id === assignmentDepartment
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff Assignment Manager</h1>
          <p className="text-muted-foreground">
            Assign L1 staff to operational zones and departments
          </p>
        </div>
        <Button
          onClick={() => setShowAssignmentModal(!showAssignmentModal)}
          disabled={selectedStaff.length === 0}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Assign Selected ({selectedStaff.length})
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Staff</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Name, ID, or designation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="filterDepartment">Filter by Department</Label>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filterDesignation">Filter by Designation</Label>
              <Select value={filterDesignation} onValueChange={setFilterDesignation}>
                <SelectTrigger>
                  <SelectValue placeholder="All designations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All designations</SelectItem>
                  <SelectItem value="electrician">Electrician</SelectItem>
                  <SelectItem value="plumber">Plumber</SelectItem>
                  <SelectItem value="cleaner">Cleaner</SelectItem>
                  <SelectItem value="security_guard">Security Guard</SelectItem>
                  <SelectItem value="maintenance_tech">Maintenance Tech</SelectItem>
                  <SelectItem value="hvac_tech">HVAC Tech</SelectItem>
                  <SelectItem value="janitor">Janitor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterDepartment('');
                  setFilterDesignation('');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Assign Staff to Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="assignmentDepartment">Department *</Label>
                <Select value={assignmentDepartment} onValueChange={setAssignmentDepartment}>
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
                <Label htmlFor="assignmentZone">Zone *</Label>
                <Select value={assignmentZone} onValueChange={setAssignmentZone}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableZones.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.zone_name} ({zone.zone_code}) - {zone.floor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="isPrimary"
                  checked={isPrimaryAssignment}
                  onCheckedChange={(checked) => setIsPrimaryAssignment(checked as boolean)}
                />
                <Label htmlFor="isPrimary">Primary Assignment</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowAssignmentModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkAssignment}
                disabled={isLoading}
              >
                {isLoading ? 'Assigning...' : 'Assign Staff'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Staff List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              L1 Staff ({filteredStaff.length})
            </CardTitle>
            <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedStaff.length === filteredStaff.length && filteredStaff.length > 0}
                  onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                />
              <Label>Select All</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading staff data...</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No staff members found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStaff.map((member) => (
                <div
                  key={member.id}
                  className={`p-4 border rounded-lg ${
                    selectedStaff.includes(member.id) ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={selectedStaff.includes(member.id)}
                        onCheckedChange={(checked) => handleStaffSelection(member.id, checked as boolean)}
                      />
                      
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback>
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">
                            {member.first_name} {member.last_name}
                          </h3>
                          <Badge variant={member.is_active ? "default" : "secondary"}>
                            {member.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-2">
                          ID: {member.employee_id} • {member.designation}
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {member.assignments.length === 0 ? (
                            <Badge variant="outline">No assignments</Badge>
                          ) : (
                            member.assignments.map((assignment) => (
                              <div key={assignment.id} className="flex items-center gap-1">
                                <Badge
                                  variant={assignment.is_primary ? "default" : "secondary"}
                                  className="flex items-center gap-1"
                                >
                                  <Building className="h-3 w-3" />
                                  {assignment.zone.zone_name} ({assignment.zone.floor})
                                  {assignment.is_primary && <ShieldCheck className="h-3 w-3" />}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveAssignment(assignment.id)}
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};