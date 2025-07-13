import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Users,
  Wrench,
  Zap,
  Droplets,
  Building
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const mockData = {
  maintenanceRequests: {
    total: 156,
    pending: 23,
    inProgress: 41,
    completed: 92,
    overdue: 8
  },
  assets: {
    total: 1250,
    operational: 1180,
    maintenance: 45,
    outOfService: 25
  },
  utilities: {
    electricity: { consumption: 18500, cost: 145000, trend: 5.2 },
    water: { consumption: 8900, cost: 45000, trend: -2.1 },
    gas: { consumption: 2400, cost: 28000, trend: 1.8 }
  },
  staff: {
    onDuty: 45,
    total: 68,
    avgPerformance: 87.5,
    activeShifts: 12
  }
};

const performanceData = [
  { name: 'Mon', requests: 24, resolved: 20, efficiency: 83 },
  { name: 'Tue', requests: 31, resolved: 28, efficiency: 90 },
  { name: 'Wed', requests: 18, resolved: 17, efficiency: 94 },
  { name: 'Thu', requests: 27, resolved: 25, efficiency: 93 },
  { name: 'Fri', requests: 35, resolved: 32, efficiency: 91 },
  { name: 'Sat', requests: 19, resolved: 18, efficiency: 95 },
  { name: 'Sun', requests: 12, resolved: 11, efficiency: 92 }
];

const assetStatusData = [
  { name: 'Operational', value: mockData.assets.operational, color: '#22c55e' },
  { name: 'Maintenance', value: mockData.assets.maintenance, color: '#f59e0b' },
  { name: 'Out of Service', value: mockData.assets.outOfService, color: '#ef4444' }
];

const utilityTrendData = [
  { time: '00:00', electricity: 1200, water: 450, gas: 180 },
  { time: '04:00', electricity: 890, water: 320, gas: 120 },
  { time: '08:00', electricity: 1850, water: 780, gas: 240 },
  { time: '12:00', electricity: 2100, water: 920, gas: 290 },
  { time: '16:00', electricity: 1950, water: 850, gas: 260 },
  { time: '20:00', electricity: 1650, water: 680, gas: 220 }
];

export const RealTimeDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'outOfService': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTrendIcon = (trend: number) => {
    return trend > 0 ? 
      <TrendingUp className="h-4 w-4 text-red-500" /> : 
      <TrendingDown className="h-4 w-4 text-green-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Real-Time Operations Dashboard</h2>
          <p className="text-muted-foreground">
            Live monitoring and analytics • Last updated: {currentTime.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground">Live</span>
          </div>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Requests</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.maintenanceRequests.total}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="destructive" className="text-xs">
                {mockData.maintenanceRequests.overdue} Overdue
              </Badge>
              <Badge variant="outline" className="text-xs">
                {mockData.maintenanceRequests.pending} Pending
              </Badge>
            </div>
            <Progress 
              value={(mockData.maintenanceRequests.completed / mockData.maintenanceRequests.total) * 100} 
              className="mt-2 h-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asset Status</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.assets.total}</div>
            <div className="flex items-center gap-1 mt-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs">{mockData.assets.operational}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-xs">{mockData.assets.maintenance}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-xs">{mockData.assets.outOfService}</span>
              </div>
            </div>
            <Progress 
              value={(mockData.assets.operational / mockData.assets.total) * 100} 
              className="mt-2 h-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff on Duty</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockData.staff.onDuty}/{mockData.staff.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {mockData.staff.activeShifts} active shifts
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm">Performance:</span>
              <Badge variant="outline" className="text-xs">
                {mockData.staff.avgPerformance}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Utility Cost</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{(mockData.utilities.electricity.cost + mockData.utilities.water.cost + mockData.utilities.gas.cost).toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-yellow-500" />
                <span className="text-xs">₹{mockData.utilities.electricity.cost.toLocaleString()}</span>
                {getTrendIcon(mockData.utilities.electricity.trend)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="assets">Asset Overview</TabsTrigger>
          <TabsTrigger value="utilities">Utility Trends</TabsTrigger>
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Performance Trends</CardTitle>
                <CardDescription>Requests vs Resolution Efficiency</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="requests" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="resolved" stackId="1" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resolution Efficiency</CardTitle>
                <CardDescription>Daily efficiency percentage</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[80, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Efficiency']} />
                    <Line type="monotone" dataKey="efficiency" stroke="#8884d8" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Asset Status Distribution</CardTitle>
                <CardDescription>Current status of all assets</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={assetStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {assetStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Critical Assets</CardTitle>
                <CardDescription>Assets requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">HVAC System A-1</p>
                        <p className="text-sm text-muted-foreground">Building A, Floor 3</p>
                      </div>
                    </div>
                    <Badge variant="destructive">Critical</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Elevator #3</p>
                        <p className="text-sm text-muted-foreground">Building B, Central</p>
                      </div>
                    </div>
                    <Badge variant="outline">Maintenance Due</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Fire Safety System</p>
                        <p className="text-sm text-muted-foreground">Building C, All Floors</p>
                      </div>
                    </div>
                    <Badge variant="outline">Inspection Due</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="utilities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>24-Hour Utility Consumption</CardTitle>
              <CardDescription>Real-time consumption patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={utilityTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="electricity" stroke="#eab308" strokeWidth={2} name="Electricity (kWh)" />
                  <Line type="monotone" dataKey="water" stroke="#3b82f6" strokeWidth={2} name="Water (L)" />
                  <Line type="monotone" dataKey="gas" stroke="#f97316" strokeWidth={2} name="Gas (m³)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Critical Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="font-medium">SLA Breach: Request #REQ-2024-001</p>
                        <p className="text-sm text-muted-foreground">Overdue by 2 hours • Building A HVAC</p>
                      </div>
                    </div>
                    <Badge variant="destructive">Critical</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <div>
                        <p className="font-medium">Maintenance Due: Elevator #3</p>
                        <p className="text-sm text-muted-foreground">Due in 2 days • Building B</p>
                      </div>
                    </div>
                    <Badge variant="outline">Warning</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Activity className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="font-medium">High Utility Consumption</p>
                        <p className="text-sm text-muted-foreground">Electricity usage 25% above normal</p>
                      </div>
                    </div>
                    <Badge variant="outline">Info</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};