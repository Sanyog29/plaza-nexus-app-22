import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { usePropertyContext } from "@/contexts/PropertyContext";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';
import { 
  CalendarIcon, 
  Download, 
  DollarSign,
  Users,
  Wrench,
  CheckCircle,
  TrendingUp
} from "lucide-react";

// Mock data for analytics
const costAnalysisData = [
  { month: 'Jan', maintenance: 85000, utilities: 125000, staff: 180000, total: 390000 },
  { month: 'Feb', maintenance: 92000, utilities: 118000, staff: 175000, total: 385000 },
  { month: 'Mar', maintenance: 78000, utilities: 134000, staff: 182000, total: 394000 },
  { month: 'Apr', maintenance: 105000, utilities: 128000, staff: 178000, total: 411000 },
  { month: 'May', maintenance: 88000, utilities: 142000, staff: 185000, total: 415000 },
  { month: 'Jun', maintenance: 96000, utilities: 156000, staff: 180000, total: 432000 }
];

const performanceMetrics = [
  { department: 'HVAC', efficiency: 94, avgResolution: 4.2, costPerRequest: 2800, satisfaction: 4.6 },
  { department: 'Electrical', efficiency: 87, avgResolution: 6.1, costPerRequest: 1900, satisfaction: 4.3 },
  { department: 'Plumbing', efficiency: 91, avgResolution: 3.8, costPerRequest: 1200, satisfaction: 4.5 },
  { department: 'Cleaning', efficiency: 96, avgResolution: 2.1, costPerRequest: 600, satisfaction: 4.7 },
  { department: 'Security', efficiency: 89, avgResolution: 5.2, costPerRequest: 1500, satisfaction: 4.4 }
];

export const AdvancedAnalytics = () => {
  const { currentProperty } = usePropertyContext();
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(2024, 0, 1),
    to: new Date()
  });

  // Reload data when property changes
  useEffect(() => {
    // In a real implementation, this would fetch filtered data from Supabase
    console.log('[AdvancedAnalytics] Property changed:', currentProperty?.id);
  }, [currentProperty?.id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Analytics & Reporting</h2>
          <p className="text-muted-foreground">
            Comprehensive facility management insights and predictive analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="cost" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cost">Cost Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="predictive">Predictive</TabsTrigger>
        </TabsList>

        <TabsContent value="cost" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Operating Cost</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹2.43M</div>
                <p className="text-xs text-muted-foreground">+5.2% from last period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Maintenance Cost</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹544K</div>
                <p className="text-xs text-muted-foreground">-2.1% from last period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utility Cost</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹803K</div>
                <p className="text-xs text-muted-foreground">+8.4% from last period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Staff Cost</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹1.08M</div>
                <p className="text-xs text-muted-foreground">+2.8% from last period</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown Trends</CardTitle>
              <CardDescription>Monthly cost analysis by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={costAnalysisData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, '']} />
                  <Legend />
                  <Area type="monotone" dataKey="maintenance" stackId="1" stroke="#8884d8" fill="#8884d8" name="Maintenance" />
                  <Area type="monotone" dataKey="utilities" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Utilities" />
                  <Area type="monotone" dataKey="staff" stackId="1" stroke="#ffc658" fill="#ffc658" name="Staff" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Department Performance Matrix</CardTitle>
              <CardDescription>Key performance indicators across all departments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Department</th>
                      <th className="text-left p-2">Efficiency</th>
                      <th className="text-left p-2">Avg Resolution</th>
                      <th className="text-left p-2">Cost/Request</th>
                      <th className="text-left p-2">Satisfaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceMetrics.map((dept, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{dept.department}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <span>{dept.efficiency}%</span>
                            <Badge variant={dept.efficiency >= 90 ? "default" : "outline"} className="text-xs">
                              {dept.efficiency >= 90 ? "Excellent" : dept.efficiency >= 80 ? "Good" : "Needs Improvement"}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-2">{dept.avgResolution}h</td>
                        <td className="p-2">₹{dept.costPerRequest.toLocaleString()}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <span>{dept.satisfaction}/5.0</span>
                            {dept.satisfaction >= 4.5 && <CheckCircle className="h-4 w-4 text-green-500" />}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response Time Trends</CardTitle>
              <CardDescription>Average response time by department</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={performanceMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} hours`, 'Avg Resolution']} />
                  <Bar dataKey="avgResolution" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Predictive Maintenance Analytics</CardTitle>
              <CardDescription>AI-powered failure prediction and maintenance scheduling</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">HVAC-A1</h4>
                      <p className="text-sm text-muted-foreground">Next predicted failure: 15 days</p>
                    </div>
                    <Badge className="text-red-500 bg-red-50">Risk: 85%</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Maintenance Cost</span>
                      <p className="font-medium">₹15,000</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Expected Downtime</span>
                      <p className="font-medium">4 hours</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Recommended Action</span>
                      <p className="font-medium text-blue-600">Schedule Maintenance</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">Elevator-B3</h4>
                      <p className="text-sm text-muted-foreground">Next predicted failure: 28 days</p>
                    </div>
                    <Badge className="text-yellow-500 bg-yellow-50">Risk: 72%</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Maintenance Cost</span>
                      <p className="font-medium">₹8,500</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Expected Downtime</span>
                      <p className="font-medium">2 hours</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Recommended Action</span>
                      <p className="font-medium text-blue-600">Monitor Closely</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};