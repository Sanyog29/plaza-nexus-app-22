import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  availability: string[];
  skills: string[];
  efficiency_score: number;
  overtime_hours: number;
}

interface ShiftOptimization {
  shift_time: string;
  required_staff: number;
  assigned_staff: StaffMember[];
  coverage_percentage: number;
  cost_estimate: number;
  optimization_score: number;
}

export const AIStaffScheduling: React.FC = () => {
  const [optimizationPeriod, setOptimizationPeriod] = useState<'week' | 'month'>('week');
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Mock data for AI scheduling
  const staffMembers: StaffMember[] = [
    { id: '1', name: 'John Smith', role: 'Maintenance', availability: ['morning', 'afternoon'], skills: ['electrical', 'plumbing'], efficiency_score: 92, overtime_hours: 2 },
    { id: '2', name: 'Sarah Johnson', role: 'Security', availability: ['night', 'morning'], skills: ['surveillance', 'emergency'], efficiency_score: 88, overtime_hours: 0 },
    { id: '3', name: 'Mike Chen', role: 'Cleaning', availability: ['morning', 'afternoon'], skills: ['janitorial', 'sanitization'], efficiency_score: 95, overtime_hours: 1 },
    { id: '4', name: 'Lisa Rodriguez', role: 'Admin', availability: ['morning', 'afternoon'], skills: ['coordination', 'communication'], efficiency_score: 90, overtime_hours: 3 }
  ];

  const shiftOptimizations: ShiftOptimization[] = [
    {
      shift_time: 'Morning (6AM-2PM)',
      required_staff: 4,
      assigned_staff: staffMembers.slice(0, 3),
      coverage_percentage: 85,
      cost_estimate: 2400,
      optimization_score: 87
    },
    {
      shift_time: 'Afternoon (2PM-10PM)',
      required_staff: 3,
      assigned_staff: staffMembers.slice(1, 4),
      coverage_percentage: 92,
      cost_estimate: 1800,
      optimization_score: 94
    },
    {
      shift_time: 'Night (10PM-6AM)',
      required_staff: 2,
      assigned_staff: [staffMembers[1]],
      coverage_percentage: 60,
      cost_estimate: 800,
      optimization_score: 72
    }
  ];

  const handleOptimizeSchedule = async () => {
    setIsOptimizing(true);
    // Simulate AI optimization
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsOptimizing(false);
  };

  const getOptimizationColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 80) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getCoverageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">AI Staff Scheduling</h2>
          <p className="text-muted-foreground">Optimize workforce allocation with AI-powered scheduling</p>
        </div>
        <Button 
          onClick={handleOptimizeSchedule}
          disabled={isOptimizing}
          className="bg-primary hover:bg-primary/90"
        >
          {isOptimizing ? (
            <>
              <TrendingUp className="h-4 w-4 mr-2 animate-spin" />
              Optimizing...
            </>
          ) : (
            <>
              <TrendingUp className="h-4 w-4 mr-2" />
              Optimize Schedule
            </>
          )}
        </Button>
      </div>

      <Tabs value={optimizationPeriod} onValueChange={(value) => setOptimizationPeriod(value as 'week' | 'month')}>
        <TabsList>
          <TabsTrigger value="week">Weekly View</TabsTrigger>
          <TabsTrigger value="month">Monthly View</TabsTrigger>
        </TabsList>

        <TabsContent value={optimizationPeriod} className="space-y-6">
          {/* Optimization Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Staff</p>
                    <p className="text-2xl font-bold text-foreground">{staffMembers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Coverage</p>
                    <p className="text-2xl font-bold text-foreground">79%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Efficiency Score</p>
                    <p className="text-2xl font-bold text-foreground">84%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Weekly Cost</p>
                    <p className="text-2xl font-bold text-foreground">$5,000</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Shift Optimization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Shift Optimization Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shiftOptimizations.map((shift, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-foreground">{shift.shift_time}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={getOptimizationColor(shift.optimization_score)}>
                          {shift.optimization_score}% Optimized
                        </Badge>
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${getCoverageColor(shift.coverage_percentage)}`} />
                          <span className="text-sm text-muted-foreground">{shift.coverage_percentage}% Coverage</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Required Staff</p>
                        <p className="font-medium text-foreground">{shift.required_staff}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Assigned</p>
                        <p className="font-medium text-foreground">{shift.assigned_staff.length}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Est. Cost</p>
                        <p className="font-medium text-foreground">${shift.cost_estimate}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {shift.assigned_staff.map((staff) => (
                        <Badge key={staff.id} variant="secondary" className="text-xs">
                          {staff.name} ({staff.role})
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Staff Performance Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Staff Performance & Availability</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {staffMembers.map((staff) => (
                  <div key={staff.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{staff.name}</h3>
                        <p className="text-sm text-muted-foreground">{staff.role}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={getOptimizationColor(staff.efficiency_score)}>
                          {staff.efficiency_score}% Efficiency
                        </Badge>
                        {staff.overtime_hours > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {staff.overtime_hours}h OT
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Availability</p>
                        <div className="flex flex-wrap gap-1">
                          {staff.availability.map((time) => (
                            <Badge key={time} variant="secondary" className="text-xs">
                              {time}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {staff.skills.map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};