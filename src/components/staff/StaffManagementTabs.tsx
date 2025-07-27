import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Clock, 
  Calendar, 
  MapPin, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Activity,
  Plus,
  User
} from 'lucide-react';

interface StaffMember {
  id: string;
  full_name: string;
  email: string;
  user_role: string;
  phone?: string;
  department?: string;
  is_active: boolean;
  last_seen?: string;
  shift_start?: string;
  shift_end?: string;
  location?: string;
  status: 'active' | 'on_break' | 'offline';
}

interface Shift {
  id: string;
  staff_id: string;
  date: string;
  start_time: string;
  end_time: string;
  hours_worked: number;
  location: string;
  status: 'scheduled' | 'active' | 'completed';
}

export const StaffManagementTabs = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Mock staff members data
  const { data: staffMembers = [] } = useQuery({
    queryKey: ['staff-members'],
    queryFn: async () => {
      // Mock staff data since user_management table doesn't exist
      const mockStaff: StaffMember[] = [
        {
          id: '1',
          full_name: 'John Smith',
          email: 'john.smith@facility.com',
          user_role: 'facility_staff',
          phone: '+1234567890',
          department: 'Maintenance',
          is_active: true,
          status: 'active',
          location: 'Building A',
          shift_start: '09:00',
          shift_end: '18:00'
        },
        {
          id: '2',
          full_name: 'Sarah Johnson',
          email: 'sarah.johnson@facility.com',
          user_role: 'security_guard',
          phone: '+1234567891',
          department: 'Security',
          is_active: true,
          status: 'on_break',
          location: 'Lobby',
          shift_start: '08:00',
          shift_end: '20:00'
        },
        {
          id: '3',
          full_name: 'Mike Chen',
          email: 'mike.chen@facility.com',
          user_role: 'maintenance_tech',
          phone: '+1234567892',
          department: 'Technical',
          is_active: true,
          status: 'active',
          location: 'Floor 5',
          shift_start: '09:00',
          shift_end: '17:00'
        },
        {
          id: '4',
          full_name: 'Lisa Wong',
          email: 'lisa.wong@facility.com',
          user_role: 'housekeeping',
          phone: '+1234567893',
          department: 'Housekeeping',
          is_active: true,
          status: 'offline',
          location: 'Floor 3',
          shift_start: '07:00',
          shift_end: '15:00'
        }
      ];
      
      return mockStaff;
    },
  });

  // Mock shifts data
  const { data: todayShifts = [] } = useQuery({
    queryKey: ['today-shifts', selectedDate],
    queryFn: async () => {
      // Mock data for demonstration
      return staffMembers.map(staff => ({
        id: `shift-${staff.id}`,
        staff_id: staff.id,
        date: selectedDate,
        start_time: staff.shift_start || '09:00',
        end_time: staff.shift_end || '18:00',
        hours_worked: Math.floor(Math.random() * 8) + 1,
        location: staff.location || 'Main Building',
        status: staff.status === 'active' ? 'active' : 'scheduled'
      })) as Shift[];
    },
    enabled: staffMembers.length > 0
  });

  const activeStaff = staffMembers.filter(s => s.status === 'active').length;
  const onBreakStaff = staffMembers.filter(s => s.status === 'on_break').length;
  const offlineStaff = staffMembers.filter(s => s.status === 'offline').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      case 'on_break':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">On Break</Badge>;
      case 'offline':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Offline</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staffMembers.length}</div>
            <p className="text-xs text-muted-foreground">Facility management team</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{activeStaff}</div>
            <p className="text-xs text-muted-foreground">{onBreakStaff} on break</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayShifts.reduce((sum, shift) => sum + shift.hours_worked, 0)}</div>
            <p className="text-xs text-muted-foreground">Total worked</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">+2% from yesterday</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active Staff</TabsTrigger>
          <TabsTrigger value="schedule">Today's Schedule</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Current Staff Status</h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Staff
            </Button>
          </div>
          
          <div className="grid gap-4">
            {staffMembers.map((staff) => (
              <Card key={staff.id} className="bg-card/30 backdrop-blur">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback>
                          {staff.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <h4 className="font-medium">{staff.full_name}</h4>
                        <p className="text-sm text-muted-foreground capitalize">
                          {staff.user_role?.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{staff.location}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{staff.shift_start} - {staff.shift_end}</span>
                      </div>
                      
                      {getStatusBadge(staff.status)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Today's Schedule</h3>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-card border border-border rounded px-3 py-2 text-foreground"
            />
          </div>
          
          <div className="grid gap-4">
            {todayShifts.map((shift) => {
              const staff = staffMembers.find(s => s.id === shift.staff_id);
              return (
                <Card key={shift.id} className="bg-card/30 backdrop-blur">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback>
                            {staff?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <h4 className="font-medium">{staff?.full_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {shift.start_time} - {shift.end_time} • {shift.location}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">{shift.hours_worked}h</p>
                          <p className="text-sm text-muted-foreground">worked</p>
                        </div>
                        
                        <Badge 
                          className={
                            shift.status === 'active' 
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                          }
                        >
                          {shift.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <h3 className="text-lg font-semibold">Staff Performance Metrics</h3>
          
          <div className="grid gap-4">
            {staffMembers.slice(0, 5).map((staff) => {
              const efficiency = Math.floor(Math.random() * 20) + 80; // 80-100%
              const tasksCompleted = Math.floor(Math.random() * 10) + 5; // 5-15 tasks
              
              return (
                <Card key={staff.id} className="bg-card/30 backdrop-blur">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback>
                            {staff.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <h4 className="font-medium">{staff.full_name}</h4>
                          <p className="text-sm text-muted-foreground capitalize">
                            {staff.user_role?.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="font-medium text-green-400">{efficiency}%</p>
                          <p className="text-xs text-muted-foreground">Efficiency</p>
                        </div>
                        
                        <div className="text-center">
                          <p className="font-medium">{tasksCompleted}</p>
                          <p className="text-xs text-muted-foreground">Tasks Today</p>
                        </div>
                        
                        <div className="text-center">
                          <CheckCircle className="h-5 w-5 text-green-400 mx-auto" />
                          <p className="text-xs text-muted-foreground">On Track</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};