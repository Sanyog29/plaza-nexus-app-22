import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Settings, 
  Play, 
  Pause,
  Plus,
  Trash2,
  Calendar,
  Mail,
  Bell,
  Users,
  Wrench,
  Zap
} from "lucide-react";

interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  trigger: string;
  condition: string;
  action: string;
  isActive: boolean;
  lastTriggered?: string;
  triggerCount: number;
}

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  operator: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  notifications: string[];
}

// Mock data
const mockWorkflows: WorkflowRule[] = [
  {
    id: '1',
    name: 'Auto-assign HVAC requests',
    description: 'Automatically assign HVAC maintenance requests to available technicians',
    trigger: 'maintenance_request_created',
    condition: 'category = "HVAC" AND priority = "high"',
    action: 'assign_to_available_tech',
    isActive: true,
    lastTriggered: '2024-01-15T10:30:00Z',
    triggerCount: 24
  },
  {
    id: '2',
    name: 'SLA breach notification',
    description: 'Send escalation alerts when requests approach SLA deadline',
    trigger: 'sla_warning',
    condition: 'time_remaining < 2 hours',
    action: 'send_escalation_email',
    isActive: true,
    lastTriggered: '2024-01-15T09:15:00Z',
    triggerCount: 8
  },
  {
    id: '3',
    name: 'Utility spike detection',
    description: 'Alert when utility consumption exceeds normal patterns',
    trigger: 'utility_reading_received',
    condition: 'consumption > average * 1.25',
    action: 'create_investigation_task',
    isActive: true,
    lastTriggered: '2024-01-14T16:45:00Z',
    triggerCount: 3
  }
];

const mockAlerts: AlertRule[] = [
  {
    id: '1',
    name: 'High electricity consumption',
    metric: 'electricity_usage',
    operator: '>',
    threshold: 2000,
    severity: 'high',
    isActive: true,
    notifications: ['email', 'slack']
  },
  {
    id: '2',
    name: 'Multiple SLA breaches',
    metric: 'sla_breaches_per_hour',
    operator: '>=',
    threshold: 3,
    severity: 'critical',
    isActive: true,
    notifications: ['email', 'sms', 'slack']
  },
  {
    id: '3',
    name: 'Staff utilization low',
    metric: 'staff_utilization',
    operator: '<',
    threshold: 70,
    severity: 'medium',
    isActive: true,
    notifications: ['email']
  }
];

export const AutomatedWorkflows = () => {
  const [workflows, setWorkflows] = useState<WorkflowRule[]>(mockWorkflows);
  const [alerts, setAlerts] = useState<AlertRule[]>(mockAlerts);
  const [showNewWorkflow, setShowNewWorkflow] = useState(false);
  const [showNewAlert, setShowNewAlert] = useState(false);
  const { toast } = useToast();

  const toggleWorkflow = async (id: string) => {
    setWorkflows(prev => prev.map(workflow => 
      workflow.id === id ? { ...workflow, isActive: !workflow.isActive } : workflow
    ));
    
    toast({
      title: "Workflow Updated",
      description: "Workflow status has been changed successfully",
    });
  };

  const toggleAlert = async (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, isActive: !alert.isActive } : alert
    ));
    
    toast({
      title: "Alert Updated", 
      description: "Alert rule status has been changed successfully",
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'send_escalation_email': return <Mail className="h-4 w-4" />;
      case 'assign_to_available_tech': return <Users className="h-4 w-4" />;
      case 'create_investigation_task': return <Wrench className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Automated Workflows & Alerts</h2>
          <p className="text-muted-foreground">
            Configure intelligent automation and real-time monitoring rules
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Global Settings
          </Button>
        </div>
      </div>

      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="alerts">Alert Rules</TabsTrigger>
          <TabsTrigger value="history">Execution History</TabsTrigger>
          <TabsTrigger value="metrics">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Active Workflows</h3>
            <Button onClick={() => setShowNewWorkflow(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Workflow
            </Button>
          </div>

          <div className="grid gap-4">
            {workflows.map((workflow) => (
              <Card key={workflow.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${workflow.isActive ? 'bg-green-500' : 'bg-gray-500'}`}>
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{workflow.name}</CardTitle>
                        <CardDescription>{workflow.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={workflow.isActive}
                        onCheckedChange={() => toggleWorkflow(workflow.id)}
                      />
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Trigger</span>
                      <p className="font-medium flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {workflow.trigger}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Action</span>
                      <p className="font-medium flex items-center gap-1">
                        {getActionIcon(workflow.action)}
                        {workflow.action}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Triggered</span>
                      <p className="font-medium">{workflow.triggerCount} times</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Last Run</span>
                      <p className="font-medium">
                        {workflow.lastTriggered ? 
                          new Date(workflow.lastTriggered).toLocaleDateString() : 
                          'Never'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-muted rounded text-xs">
                    <strong>Condition:</strong> {workflow.condition}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Alert Rules</h3>
            <Button onClick={() => setShowNewAlert(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Alert
            </Button>
          </div>

          <div className="grid gap-4">
            {alerts.map((alert) => (
              <Card key={alert.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${alert.isActive ? 'bg-orange-500' : 'bg-gray-500'}`}>
                        <AlertTriangle className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{alert.name}</CardTitle>
                        <CardDescription>
                          Alert when {alert.metric} {alert.operator} {alert.threshold}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <Switch
                        checked={alert.isActive}
                        onCheckedChange={() => toggleAlert(alert.id)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Bell className="h-3 w-3" />
                      <span>Notifications: {alert.notifications.join(', ')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Workflow Executions</CardTitle>
              <CardDescription>Last 24 hours of automated actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="font-medium">HVAC request auto-assigned</p>
                      <p className="text-sm text-muted-foreground">Triggered by: maintenance_request_created</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">10:30 AM</p>
                    <Badge variant="outline">Success</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="font-medium">SLA breach notification sent</p>
                      <p className="text-sm text-muted-foreground">Triggered by: sla_warning</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">09:15 AM</p>
                    <Badge variant="outline">Success</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="font-medium">Utility investigation task created</p>
                      <p className="text-sm text-muted-foreground">Triggered by: utility_reading_received</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">Yesterday</p>
                    <Badge variant="outline">Success</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
                <Bot className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,247</div>
                <p className="text-xs text-muted-foreground">+12% from last week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98.7%</div>
                <p className="text-xs text-muted-foreground">+0.3% from last week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">18.5h</div>
                <p className="text-xs text-muted-foreground">This week</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Automation Impact</CardTitle>
              <CardDescription>Benefits of automated workflows</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Response Time Reduction</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">67%</span>
                    <div className="w-24 h-2 bg-muted rounded">
                      <div className="w-16 h-2 bg-green-500 rounded"></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Manual Task Reduction</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">43%</span>
                    <div className="w-24 h-2 bg-muted rounded">
                      <div className="w-10 h-2 bg-blue-500 rounded"></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Error Rate Reduction</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">81%</span>
                    <div className="w-24 h-2 bg-muted rounded">
                      <div className="w-20 h-2 bg-purple-500 rounded"></div>
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