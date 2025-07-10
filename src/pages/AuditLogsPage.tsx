import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/components/AuthProvider';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
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
  Activity,
  TrendingUp,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface AuditLogDisplay {
  id: string;
  created_at: string;
  user_id?: string;
  user_profile?: {
    first_name: string;
    last_name: string;
  };
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
}

const AuditLogsPage = () => {
  const { isAdmin } = useAuth();
  const { 
    auditLogs, 
    isLoading, 
    totalCount, 
    fetchAuditLogs, 
    getActionSummary, 
    getResourceSummary, 
    getUserActivity 
  } = useAuditLogs();
  
  const [filteredLogs, setFilteredLogs] = useState<AuditLogDisplay[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterResource, setFilterResource] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('7');
  const [selectedLog, setSelectedLog] = useState<AuditLogDisplay | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('logs');

  // Real-time updates
  useRealtimeUpdates({
    table: 'audit_logs',
    queryKeysToInvalidate: [['audit-logs']]
  });

  // Analytics data
  const actionSummary = getActionSummary();
  const resourceSummary = getResourceSummary();
  const userActivity = getUserActivity();

  useEffect(() => {
    if (isAdmin) {
      loadLogs();
    }
  }, [isAdmin, currentPage, filterDateRange]);

  useEffect(() => {
    filterLogs();
  }, [auditLogs, searchTerm, filterAction, filterResource]);

  const loadLogs = async () => {
    const filters: any = {};
    
    if (filterDateRange !== 'all') {
      const days = parseInt(filterDateRange);
      const startDate = startOfDay(subDays(new Date(), days));
      const endDate = endOfDay(new Date());
      filters.date_range = {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      };
    }

    await fetchAuditLogs(currentPage, 50, filters);
  };

  const filterLogs = () => {
    let filtered = auditLogs.filter(log => {
      const userName = log.user_profile 
        ? `${log.user_profile.first_name} ${log.user_profile.last_name}`.trim()
        : 'Unknown User';
      
      const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.resource_type.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesAction = filterAction === 'all' || log.action === filterAction;
      const matchesResource = filterResource === 'all' || log.resource_type === filterResource;

      return matchesSearch && matchesAction && matchesResource;
    });

    setFilteredLogs(filtered as AuditLogDisplay[]);
  };

  const exportLogs = () => {
    const csv = generateCSV(filteredLogs);
    downloadFile(csv, `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    toast({
      title: "Export completed",
      description: `${filteredLogs.length} audit log entries exported.`
    });
  };

  const generateCSV = (data: AuditLogDisplay[]) => {
    const headers = 'Timestamp,User,Action,Resource,IP Address,Resource ID,Old Values,New Values';
    const rows = data.map(log => {
      const userName = log.user_profile 
        ? `${log.user_profile.first_name} ${log.user_profile.last_name}`.trim()
        : 'Unknown User';
      
      return `${log.created_at},${userName},${log.action},${log.resource_type},${log.ip_address || 'N/A'},${log.resource_id || 'N/A'},"${JSON.stringify(log.old_values || {})}","${JSON.stringify(log.new_values || {})}"`;
    });
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

  const getActionSeverity = (action: string) => {
    if (action.includes('DELETE') || action.includes('failed') || action.includes('breach')) {
      return 'destructive';
    }
    if (action.includes('UPDATE') || action.includes('ASSIGN') || action.includes('warning')) {
      return 'default';
    }
    return 'secondary';
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
        <div className="flex items-center gap-3">
          <Button onClick={loadLogs} variant="outline" size="sm">
            Refresh
          </Button>
          <Button onClick={exportLogs} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Logs
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security Events
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-6">

        {/* Filters */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
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
                  {actionSummary.map(([action]) => (
                    <SelectItem key={action} value={action}>
                      {action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterResource} onValueChange={setFilterResource}>
                <SelectTrigger>
                  <SelectValue placeholder="Resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  {resourceSummary.map(([resource]) => (
                    <SelectItem key={resource} value={resource}>
                      {resource.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterDateRange} onValueChange={setFilterDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 24 hours</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" />
                {filteredLogs.length} of {totalCount} entries
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
                const userName = log.user_profile 
                  ? `${log.user_profile.first_name} ${log.user_profile.last_name}`.trim()
                  : 'Unknown User';
                
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
                          <Badge variant={getActionSeverity(log.action)}>
                            {log.action.includes('DELETE') || log.action.includes('failed') ? 'Critical' : 
                             log.action.includes('UPDATE') ? 'Warning' : 'Info'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{userName}</span>
                          <span>•</span>
                          <span>{log.resource_type.replace(/_/g, ' ')}</span>
                          {log.resource_id && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-xs">ID: {log.resource_id.slice(0, 8)}...</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}

              {filteredLogs.length === 0 && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  No audit logs found matching your filters.
                </div>
              )}
              
              {isLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Top Actions */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {actionSummary.slice(0, 5).map(([action, count]) => (
                    <div key={action} className="flex items-center justify-between">
                      <span className="text-sm">{action.replace(/_/g, ' ')}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Resources */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Top Resources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {resourceSummary.slice(0, 5).map(([resource, count]) => (
                    <div key={resource} className="flex items-center justify-between">
                      <span className="text-sm">{resource.replace(/_/g, ' ')}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* User Activity */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Most Active Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userActivity.slice(0, 5).map(([user, count]) => (
                    <div key={user} className="flex items-center justify-between">
                      <span className="text-sm">{user || 'Unknown User'}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Events Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Security Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredLogs
                  .filter(log => 
                    log.action.includes('LOGIN') || 
                    log.action.includes('LOGOUT') || 
                    log.action.includes('failed') ||
                    log.action.includes('DELETE') ||
                    log.resource_type === 'auth'
                  )
                  .map((log) => {
                    const ActionIcon = getActionIcon(log.action);
                    const userName = log.user_profile 
                      ? `${log.user_profile.first_name} ${log.user_profile.last_name}`.trim()
                      : 'Unknown User';
                    
                    return (
                      <div 
                        key={log.id} 
                        className="flex items-center justify-between p-4 bg-card/30 rounded-lg hover:bg-card/50 transition-colors cursor-pointer border-l-4 border-red-500"
                        onClick={() => setSelectedLog(log)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 bg-red-500/10 rounded-full">
                            <ActionIcon className="h-5 w-5 text-red-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">
                                {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                              <Badge variant="destructive">Security</Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{userName}</span>
                              <span>•</span>
                              <span>{log.ip_address || 'Unknown IP'}</span>
                              <span>•</span>
                              <span>{format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Log Detail Modal */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Audit Log Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Timestamp</Label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedLog.created_at), 'PPpp')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">User</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedLog.user_profile 
                      ? `${selectedLog.user_profile.first_name} ${selectedLog.user_profile.last_name}`.trim()
                      : 'Unknown User'
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Action</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedLog.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Resource Type</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedLog.resource_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                </div>
                {selectedLog.resource_id && (
                  <div>
                    <Label className="text-sm font-medium">Resource ID</Label>
                    <p className="text-sm text-muted-foreground font-mono">{selectedLog.resource_id}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">IP Address</Label>
                  <p className="text-sm text-muted-foreground">{selectedLog.ip_address || 'N/A'}</p>
                </div>
              </div>
              
              {/* Old Values */}
              {selectedLog.old_values && Object.keys(selectedLog.old_values).length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Previous Values</Label>
                  <pre className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded text-sm overflow-auto">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}
              
              {/* New Values */}
              {selectedLog.new_values && Object.keys(selectedLog.new_values).length > 0 && (
                <div>
                  <Label className="text-sm font-medium">New Values</Label>
                  <pre className="mt-2 p-3 bg-green-500/10 border border-green-500/20 rounded text-sm overflow-auto">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}
              
              {/* User Agent */}
              {selectedLog.user_agent && (
                <div>
                  <Label className="text-sm font-medium">User Agent</Label>
                  <p className="text-sm text-muted-foreground break-all bg-muted/20 p-2 rounded">
                    {selectedLog.user_agent}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Label = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`font-medium text-foreground ${className}`}>{children}</div>
);

export default AuditLogsPage;