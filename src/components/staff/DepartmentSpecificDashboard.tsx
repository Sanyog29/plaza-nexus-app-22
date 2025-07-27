import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/AuthProvider';
import {
  Shield,
  Wrench,
  Sparkles,
  Cog,
  AlertTriangle,
  Monitor,
  Camera,
  MapPin,
  Clock,
  CheckCircle,
  Settings,
  Users,
  FileText,
  Thermometer,
  Zap,
  Droplets
} from 'lucide-react';

interface DepartmentTask {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  location: string;
  estimatedTime: number;
  status: 'pending' | 'in_progress' | 'completed';
  department: string;
  specialization: string;
}

export const DepartmentSpecificDashboard = () => {
  const { userDepartment } = useAuth();
  const userSpecialization = null; // Placeholder until auth context is updated
  
  // Mock department-specific tasks
  const [tasks] = useState<DepartmentTask[]>([
    // Security & Safety
    {
      id: 'sec1',
      title: 'Perimeter Security Check',
      description: 'Complete patrol of building perimeter and parking areas',
      priority: 'high',
      location: 'Building Perimeter',
      estimatedTime: 45,
      status: 'pending',
      department: 'Security & Safety',
      specialization: 'Physical Security'
    },
    {
      id: 'sec2',
      title: 'Fire Safety Inspection',
      description: 'Monthly fire extinguisher and alarm system check',
      priority: 'medium',
      location: 'All Floors',
      estimatedTime: 60,
      status: 'in_progress',
      department: 'Security & Safety',
      specialization: 'Emergency Response'
    },
    
    // Technical Services
    {
      id: 'tech1',
      title: 'HVAC System Maintenance',
      description: 'Replace filters and check system performance',
      priority: 'high',
      location: 'Roof HVAC Units',
      estimatedTime: 90,
      status: 'pending',
      department: 'Technical Services',
      specialization: 'HVAC Systems'
    },
    {
      id: 'tech2',
      title: 'Network Infrastructure Check',
      description: 'Test and verify network connectivity in all zones',
      priority: 'medium',
      location: 'Server Room & Common Areas',
      estimatedTime: 120,
      status: 'pending',
      department: 'Technical Services',
      specialization: 'IT Systems'
    },
    
    // Cleaning Services
    {
      id: 'clean1',
      title: 'Deep Clean Conference Rooms',
      description: 'Sanitize and deep clean all conference facilities',
      priority: 'medium',
      location: 'Conference Levels',
      estimatedTime: 180,
      status: 'pending',
      department: 'Cleaning Services',
      specialization: 'Commercial Cleaning'
    },
    
    // Facilities Management
    {
      id: 'fac1',
      title: 'Elevator Maintenance Check',
      description: 'Monthly safety inspection and lubrication',
      priority: 'high',
      location: 'All Elevator Shafts',
      estimatedTime: 75,
      status: 'pending',
      department: 'Facilities Management',
      specialization: 'Building Maintenance'
    }
  ]);

  const getDepartmentIcon = (department: string) => {
    switch (department) {
      case 'Security & Safety':
        return Shield;
      case 'Technical Services':
        return Monitor;
      case 'Cleaning Services':
        return Sparkles;
      case 'Facilities Management':
        return Cog;
      case 'Operations':
        return Settings;
      default:
        return Wrench;
    }
  };

  const getSpecializationTools = (specialization: string) => {
    switch (specialization) {
      case 'Physical Security':
        return [
          { name: 'Security Patrol', icon: Shield },
          { name: 'Incident Report', icon: AlertTriangle },
          { name: 'Access Control', icon: Users },
          { name: 'Emergency Alert', icon: AlertTriangle }
        ];
      case 'Emergency Response':
        return [
          { name: 'Fire Safety Check', icon: AlertTriangle },
          { name: 'First Aid Kit', icon: FileText },
          { name: 'Emergency Drill', icon: Users },
          { name: 'Safety Report', icon: FileText }
        ];
      case 'HVAC Systems':
        return [
          { name: 'Temperature Monitor', icon: Thermometer },
          { name: 'Filter Replacement', icon: Wrench },
          { name: 'System Diagnostics', icon: Monitor },
          { name: 'Energy Usage', icon: Zap }
        ];
      case 'IT Systems':
        return [
          { name: 'Network Test', icon: Monitor },
          { name: 'System Update', icon: Settings },
          { name: 'Security Scan', icon: Shield },
          { name: 'Backup Check', icon: FileText }
        ];
      case 'Commercial Cleaning':
        return [
          { name: 'Supply Inventory', icon: FileText },
          { name: 'Deep Clean Mode', icon: Sparkles },
          { name: 'Quality Check', icon: CheckCircle },
          { name: 'Schedule Optimizer', icon: Clock }
        ];
      case 'Building Maintenance':
        return [
          { name: 'Equipment Check', icon: Cog },
          { name: 'Repair Request', icon: Wrench },
          { name: 'Preventive Schedule', icon: Clock },
          { name: 'Safety Inspection', icon: Shield }
        ];
      default:
        return [
          { name: 'General Tools', icon: Wrench },
          { name: 'Task Manager', icon: FileText },
          { name: 'Location Check', icon: MapPin },
          { name: 'Time Tracker', icon: Clock }
        ];
    }
  };

  // Filter tasks based on user's department and specialization
  const relevantTasks = tasks.filter(task => 
    task.department === userDepartment && 
    (!userSpecialization || task.specialization === userSpecialization)
  );

  const DepartmentIcon = getDepartmentIcon(userDepartment || '');
  const specializationTools = getSpecializationTools(userSpecialization || '');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'low':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Department Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/20">
              <DepartmentIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{userDepartment}</h1>
              <p className="text-muted-foreground">
                {userSpecialization ? `${userSpecialization} Specialist` : 'Field Operations'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Specialized Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Specialized Tools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {specializationTools.map((tool, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-16 flex-col gap-2"
                size="sm"
              >
                <tool.icon className="h-5 w-5" />
                <span className="text-xs">{tool.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Department-Specific Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Department Tasks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {relevantTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tasks assigned for your specialization</p>
            </div>
          ) : (
            relevantTasks.map((task) => (
              <div key={task.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{task.title}</h3>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  </div>
                  <Badge className={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{task.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{task.estimatedTime} min</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(task.status)}>
                    {task.status.replace('_', ' ')}
                  </Badge>
                  
                  {task.status === 'pending' && (
                    <Button size="sm">
                      Start Task
                    </Button>
                  )}
                  
                  {task.status === 'in_progress' && (
                    <Button size="sm" variant="outline">
                      Continue
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-12">
              <Camera className="h-4 w-4 mr-2" />
              Take Photo
            </Button>
            <Button variant="outline" className="h-12">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Report Issue
            </Button>
            <Button variant="outline" className="h-12">
              <CheckCircle className="h-4 w-4 mr-2" />
              QR Scan
            </Button>
            <Button variant="outline" className="h-12">
              <MapPin className="h-4 w-4 mr-2" />
              Navigation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};