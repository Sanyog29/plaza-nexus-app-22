import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';
import { 
  FileText, 
  Search, 
  Filter, 
  Download,
  Eye,
  User,
  Settings,
  Database,
  Shield,
  Calendar,
  Clock,
  Activity
} from 'lucide-react';
import { format, subDays } from 'date-fns';

interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string;
  user_email: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: any;
  ip_address: string;
  user_agent: string;
  severity: 'info' | 'warning' | 'critical';
}

const AuditLogsPage = () => {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterResource, setFilterResource] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Mock audit log data
  const mockLogs: AuditLog[] = [
    {
      id: '1',
      timestamp: new Date().toISOString(),
      user_id: 'admin-1',
      user_email: 'admin@ssplaza.com',
      action: 'user_role_changed',
      resource_type: 'user',
      resource_id: 'user-123',
      details: { old_role: 'tenant_manager', new_role: 'field_staff' },
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      severity: 'info'
    },
    {
      id: '2',
      timestamp: subDays(new Date(), 1).toISOString(),
      user_id: 'admin-1',
      user_email: 'admin@ssplaza.com',
      action: 'system_config_updated',
      resource_type: 'system',
      resource_id: 'config-maintenance',
      details: { setting: 'auto_assignment', old_value: false, new_value: true },
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      severity: 'warning'
    },
    {
      id: '3',
      timestamp: subDays(new Date(), 2).toISOString(),
      user_id: 'admin-1',
      user_email: 'admin@ssplaza.com',
      action: 'bulk_request_closed',
      resource_type: 'maintenance_request',
      resource_id: 'bulk-operation-001',
      details: { count: 15, request_ids: ['req-1', 'req-2', 'req-3'] },
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      severity: 'info'
    },
    {
      id: '4',
      timestamp: subDays(new Date(), 3).toISOString(),
      user_id: 'admin-1',
      user_email: 'admin@ssplaza.com',
      action: 'failed_login_attempt',
      resource_type: 'auth',
      resource_id: 'login-attempt-failed',
      details: { attempts: 3, blocked: true },
      ip_address: '192.168.1.150',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      severity: 'critical'
    },
    {
      id: '5',
      timestamp: subDays(new Date(), 4).toISOString(),
      user_id: 'admin-1',
      user_email: 'admin@ssplaza.com',
      action: 'database_backup_completed',
      resource_type: 'system',
      resource_id: 'backup-daily-001',
      details: { size: '2.4GB', duration: '45 minutes', status: 'success' },
      ip_address: 'system',
      user_agent: 'System Process',
      severity: 'info'
    }
  ];

  useEffect(() => {
    if (isAdmin) {
      loadAuditLogs();
    }
  }, [isAdmin]);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, filterAction, filterSeverity, filterResource]);

  const loadAuditLogs = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would fetch from the database
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLogs(mockLogs);
    } catch (error) {
      toast({
        title: "Error loading audit logs",
        description: "Failed to fetch audit log data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = logs.filter(log => {
      const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.resource_type.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesAction = filterAction === 'all' || log.action === filterAction;
      const matchesSeverity = filterSeverity === 'all' || log.severity === filterSeverity;
      const matchesResource = filterResource === 'all' || log.resource_type === filterResource;

      return matchesSearch && matchesAction && matchesSeverity && matchesResource;
    });

    setFilteredLogs(filtered);
  };

  const exportLogs = () => {
    const csv = generateCSV(filteredLogs);
    downloadFile(csv, `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    toast({
      title: "Export completed",
      description: `${filteredLogs.length} audit log entries exported.`
    });
  };

  const generateCSV = (data: AuditLog[]) => {
    const headers = 'Timestamp,User,Action,Resource,Severity,IP Address,Details';
    const rows = data.map(log => 
      `${log.timestamp},${log.user_email},${log.action},${log.resource_type},${log.severity},${log.ip_address},"${JSON.stringify(log.details)}"`
    );
    return [headers, ...rows].join('\n');
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'default';
      case 'info': return 'secondary';
      default: return 'secondary';
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('user')) return User;
    if (action.includes('config') || action.includes('system')) return Settings;
    if (action.includes('database') || action.includes('backup')) return Database;
    if (action.includes('login') || action.includes('auth')) return Shield;
    return Activity;
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="text-center py-12">
            <Shield className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Access Denied</h3>
            <p className="text-muted-foreground">Audit logs require administrator access.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            Audit Logs
          </h1>
          <p className="text-muted-foreground">
            Track and monitor all administrative actions and system events
          </p>
        </div>
        <Button onClick={exportLogs} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Logs
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger>
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="user_role_changed">Role Changed</SelectItem>
                <SelectItem value="system_config_updated">Config Updated</SelectItem>
                <SelectItem value="bulk_request_closed">Bulk Operations</SelectItem>
                <SelectItem value="failed_login_attempt">Login Attempts</SelectItem>
                <SelectItem value="database_backup_completed">Backups</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterResource} onValueChange={setFilterResource}>
              <SelectTrigger>
                <SelectValue placeholder="Resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="maintenance_request">Requests</SelectItem>
                <SelectItem value="auth">Authentication</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              {filteredLogs.length} entries
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs List */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredLogs.map((log) => {
              const ActionIcon = getActionIcon(log.action);
              return (
                <div 
                  key={log.id} 
                  className="flex items-center justify-between p-4 bg-card/30 rounded-lg hover:bg-card/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                      <ActionIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">
                          {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <Badge variant={getSeverityColor(log.severity)}>
                          {log.severity}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{log.user_email}</span>
                        <span>•</span>
                        <span>{log.resource_type}</span>
                        <span>•</span>
                        <span>{format(new Date(log.timestamp), 'MMM d, yyyy HH:mm')}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}

            {filteredLogs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No audit logs found matching your filters.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Log Detail Modal */}
      {selectedLog && (
        <Card className="bg-card/50 backdrop-blur fixed inset-4 z-50 overflow-auto">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Audit Log Details</CardTitle>
            <Button variant="ghost" onClick={() => setSelectedLog(null)}>
              ×
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Timestamp</Label>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedLog.timestamp), 'PPpp')}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">User</Label>
                <p className="text-sm text-muted-foreground">{selectedLog.user_email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Action</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedLog.action.replace(/_/g, ' ')}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Resource</Label>
                <p className="text-sm text-muted-foreground">{selectedLog.resource_type}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">IP Address</Label>
                <p className="text-sm text-muted-foreground">{selectedLog.ip_address}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Severity</Label>
                <Badge variant={getSeverityColor(selectedLog.severity)}>
                  {selectedLog.severity}
                </Badge>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Details</Label>
              <pre className="mt-2 p-3 bg-muted/20 rounded text-sm overflow-auto">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>
            
            <div>
              <Label className="text-sm font-medium">User Agent</Label>
              <p className="text-sm text-muted-foreground break-all">{selectedLog.user_agent}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const Label = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`font-medium text-foreground ${className}`}>{children}</div>
);

export default AuditLogsPage;