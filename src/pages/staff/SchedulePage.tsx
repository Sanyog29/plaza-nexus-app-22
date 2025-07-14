import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, User } from "lucide-react";

export default function SchedulePage() {
  const todaySchedule = [
    {
      time: "08:00 - 09:00",
      task: "Morning Security Rounds",
      location: "Building A - All Floors",
      priority: "high",
      status: "completed"
    },
    {
      time: "09:30 - 11:00",
      task: "HVAC System Inspection",
      location: "Basement - Equipment Room",
      priority: "medium",
      status: "in-progress"
    },
    {
      time: "11:30 - 12:30",
      task: "Cafeteria Equipment Check",
      location: "Ground Floor - Cafeteria",
      priority: "low",
      status: "pending"
    },
    {
      time: "14:00 - 15:30",
      task: "Fire Safety System Test",
      location: "Building B - Fire Control Room",
      priority: "high",
      status: "pending"
    },
    {
      time: "16:00 - 17:00",
      task: "Evening Security Patrol",
      location: "Perimeter - Parking Areas",
      priority: "medium",
      status: "pending"
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">My Schedule</h1>
          <p className="text-muted-foreground mt-2">
            Today's tasks and assignments
          </p>
        </div>

        <div className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">5</p>
                    <p className="text-sm text-muted-foreground">Total Tasks</p>
                  </div>
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">1</p>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">1</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                  <User className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Schedule
              </CardTitle>
              <CardDescription>
                Your assigned tasks for today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todaySchedule.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{item.time}</span>
                          <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getPriorityColor(item.priority)}`}>
                            {item.priority}
                          </span>
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </div>
                        <h3 className="font-semibold text-lg">{item.task}</h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-4 w-4" />
                          {item.location}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {item.status === 'pending' && (
                          <Button size="sm">
                            Start Task
                          </Button>
                        )}
                        {item.status === 'in-progress' && (
                          <Button size="sm" variant="outline">
                            Complete
                          </Button>
                        )}
                        {item.status === 'completed' && (
                          <Button size="sm" variant="ghost" disabled>
                            Done
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}