
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, User, ServerCog, Clock } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format, subDays } from 'date-fns';

// Sample data for charts
const generatePerformanceData = () => {
  const result = [];
  for (let i = 30; i >= 0; i--) {
    const date = subDays(new Date(), i);
    result.push({
      date: format(date, 'MMM dd'),
      totalRequests: Math.floor(Math.random() * 10) + 5,
      completed: Math.floor(Math.random() * 8) + 2,
      breached: Math.floor(Math.random() * 2),
    });
  }
  return result;
};

const performanceData = generatePerformanceData();

// Sample staff data
const staff = [
  { id: 'staff-1', name: 'Amit Sharma', role: 'Maintenance Technician', status: 'active', currentTask: 'HVAC repair on 3rd floor', attendance: 'present' },
  { id: 'staff-2', name: 'Priya Patel', role: 'Security Officer', status: 'active', currentTask: 'Main entrance monitoring', attendance: 'present' },
  { id: 'staff-3', name: 'Rajiv Kumar', role: 'Electrician', status: 'break', currentTask: 'Scheduled break', attendance: 'present' },
  { id: 'staff-4', name: 'Sunita Verma', role: 'Cleaning Supervisor', status: 'active', currentTask: 'Floor inspection', attendance: 'present' },
  { id: 'staff-5', name: 'Vikram Singh', role: 'Maintenance Technician', status: 'offline', currentTask: 'Off duty', attendance: 'absent' },
];

// Sample equipment monitoring data
const equipment = [
  { id: 'equip-1', name: 'Main HVAC System', status: 'operational', lastMaintenance: '2025-04-15', health: '95%', alerts: 0 },
  { id: 'equip-2', name: 'Backup Generator', status: 'maintenance-due', lastMaintenance: '2025-01-20', health: '78%', alerts: 2 },
  { id: 'equip-3', name: 'Elevator System', status: 'operational', lastMaintenance: '2025-03-10', health: '92%', alerts: 0 },
  { id: 'equip-4', name: 'Security Cameras', status: 'needs-attention', lastMaintenance: '2025-02-25', health: '85%', alerts: 1 },
  { id: 'equip-5', name: 'Fire Alarm System', status: 'operational', lastMaintenance: '2025-04-05', health: '98%', alerts: 0 },
];

// Sample tickets in pipeline
const tickets = [
  { id: 'ticket-1', title: 'AC not working in Room 305', priority: 'high', status: 'in-progress', createdAt: '2025-04-25', assignedTo: 'Amit Sharma' },
  { id: 'ticket-2', title: 'Flickering lights in hallway', priority: 'medium', status: 'assigned', createdAt: '2025-04-26', assignedTo: 'Rajiv Kumar' },
  { id: 'ticket-3', title: 'Water leak in bathroom', priority: 'high', status: 'open', createdAt: '2025-04-26', assignedTo: 'Unassigned' },
  { id: 'ticket-4', title: 'Door lock broken', priority: 'medium', status: 'open', createdAt: '2025-04-27', assignedTo: 'Unassigned' },
  { id: 'ticket-5', title: 'Replace light bulbs in lobby', priority: 'low', status: 'completed', createdAt: '2025-04-24', assignedTo: 'Sunita Verma' },
];

// Sample SLA compliance data
const slaCompliance = [
  { id: 'sla-1', category: 'HVAC Issues', target: '4 hours', actual: '3.5 hours', compliance: '100%', trend: 'improving' },
  { id: 'sla-2', category: 'Electrical Issues', target: '2 hours', actual: '1.8 hours', compliance: '100%', trend: 'stable' },
  { id: 'sla-3', category: 'Plumbing Issues', target: '3 hours', actual: '3.2 hours', compliance: '96%', trend: 'declining' },
  { id: 'sla-4', category: 'Security Issues', target: '1 hour', actual: '0.8 hours', compliance: '100%', trend: 'improving' },
  { id: 'sla-5', category: 'General Maintenance', target: '24 hours', actual: '18 hours', compliance: '100%', trend: 'stable' },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-600">Active</Badge>;
    case 'break':
      return <Badge variant="outline">On Break</Badge>;
    case 'offline':
      return <Badge variant="secondary">Offline</Badge>;
    case 'operational':
      return <Badge className="bg-green-600">Operational</Badge>;
    case 'needs-attention':
      return <Badge className="bg-yellow-600">Needs Attention</Badge>;
    case 'maintenance-due':
      return <Badge variant="destructive">Maintenance Due</Badge>;
    case 'present':
      return <Badge className="bg-green-600">Present</Badge>;
    case 'absent':
      return <Badge variant="secondary">Absent</Badge>;
    case 'open':
      return <Badge className="bg-blue-600">Open</Badge>;
    case 'assigned':
      return <Badge className="bg-yellow-600">Assigned</Badge>;
    case 'in-progress':
      return <Badge className="bg-purple-600">In Progress</Badge>;
    case 'completed':
      return <Badge variant="secondary">Completed</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'high':
      return <Badge variant="destructive">High</Badge>;
    case 'medium':
      return <Badge className="bg-yellow-600">Medium</Badge>;
    case 'low':
      return <Badge variant="outline">Low</Badge>;
    default:
      return null;
  }
};

const getTrendBadge = (trend: string) => {
  switch (trend) {
    case 'improving':
      return <Badge className="bg-green-600">Improving</Badge>;
    case 'stable':
      return <Badge variant="outline">Stable</Badge>;
    case 'declining':
      return <Badge variant="destructive">Declining</Badge>;
    default:
      return null;
  }
};

const AdminDashboardPage = () => {
  return (
    <div className="px-4 py-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
        <p className="text-sm text-gray-400 mt-1">Monitor building operations and performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center h-full">
              <span className="text-4xl font-bold text-white">{tickets.filter(t => t.status !== 'completed').length}</span>
              <span className="text-sm text-gray-400 mt-1">Active Tickets</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center h-full">
              <span className="text-4xl font-bold text-white">{staff.filter(s => s.attendance === 'present').length}</span>
              <span className="text-sm text-gray-400 mt-1">Staff Present</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center h-full">
              <span className="text-4xl font-bold text-white">{equipment.filter(e => e.status === 'operational').length}/{equipment.length}</span>
              <span className="text-sm text-gray-400 mt-1">Systems Operational</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center h-full">
              <span className="text-4xl font-bold text-white">96%</span>
              <span className="text-sm text-gray-400 mt-1">SLA Compliance</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white text-lg">Performance Overview</CardTitle>
          <CardDescription>Monthly request handling performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="totalRequests" stroke="#1E40AF" strokeWidth={2} />
                <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="breached" stroke="#EF4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center space-x-4 mt-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-800 rounded-full mr-2" />
              <span className="text-sm text-gray-400">Total Requests</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-600 rounded-full mr-2" />
              <span className="text-sm text-gray-400">Completed</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-600 rounded-full mr-2" />
              <span className="text-sm text-gray-400">SLA Breached</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="tickets" className="w-full">
        <TabsList className="grid grid-cols-3 mb-6 bg-card/50">
          <TabsTrigger value="tickets" className="data-[state=active]:bg-plaza-blue">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Tickets
          </TabsTrigger>
          <TabsTrigger value="staff" className="data-[state=active]:bg-plaza-blue">
            <User className="h-4 w-4 mr-2" />
            Staff
          </TabsTrigger>
          <TabsTrigger value="sla" className="data-[state=active]:bg-plaza-blue">
            <Clock className="h-4 w-4 mr-2" />
            SLA Compliance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tickets">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white text-lg">Ticket Management Pipeline</CardTitle>
              <CardDescription>Active and recent maintenance tickets</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Ticket</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id} className="border-border">
                      <TableCell>
                        <div className="font-medium text-white">{ticket.title}</div>
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(ticket.priority)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(ticket.status)}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {ticket.assignedTo}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {format(new Date(ticket.createdAt), 'PP')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white text-lg">Staff Attendance Tracking</CardTitle>
              <CardDescription>Current staff status and assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Current Task</TableHead>
                    <TableHead>Attendance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((person) => (
                    <TableRow key={person.id} className="border-border">
                      <TableCell>
                        <div className="font-medium text-white">{person.name}</div>
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {person.role}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(person.status)}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {person.currentTask}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(person.attendance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sla">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white text-lg">Monthly SLA Compliance Reports</CardTitle>
              <CardDescription>April 2025</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Category</TableHead>
                    <TableHead>Target Response</TableHead>
                    <TableHead>Actual Response</TableHead>
                    <TableHead>Compliance</TableHead>
                    <TableHead>Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slaCompliance.map((item) => (
                    <TableRow key={item.id} className="border-border">
                      <TableCell>
                        <div className="font-medium text-white">{item.category}</div>
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {item.target}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {item.actual}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {item.compliance}
                      </TableCell>
                      <TableCell>
                        {getTrendBadge(item.trend)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white text-lg">Equipment Monitoring</CardTitle>
          <CardDescription>Real-time building systems status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Equipment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>Last Maintenance</TableHead>
                <TableHead>Alerts</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipment.map((item) => (
                <TableRow key={item.id} className="border-border">
                  <TableCell>
                    <div className="flex items-center">
                      <ServerCog className="h-5 w-5 text-plaza-blue mr-3" />
                      <div className="font-medium text-white">{item.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(item.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="w-24 h-2 bg-gray-600 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            parseInt(item.health) > 90 ? 'bg-green-600' : 
                            parseInt(item.health) > 75 ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ width: item.health }}
                        />
                      </div>
                      <span className="ml-2 text-gray-400">{item.health}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-400">
                    {format(new Date(item.lastMaintenance), 'PP')}
                  </TableCell>
                  <TableCell>
                    {item.alerts > 0 ? (
                      <Badge variant="destructive">{item.alerts}</Badge>
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                    >
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardPage;
