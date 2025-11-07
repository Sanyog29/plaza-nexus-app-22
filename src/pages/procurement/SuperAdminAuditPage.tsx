import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { SEOHead } from '@/components/seo/SEOHead';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PropertySelector } from '@/components/procurement/PropertySelector';
import { Shield, Calendar, User, FileText, Download, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';

export default function SuperAdminAuditPage() {
  const { isSuperAdmin, isLoading: authLoading } = useAuth();
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: auditLogs, isLoading, refetch } = useQuery({
    queryKey: ['super-admin-audit', selectedProperty, dateFrom, dateTo],
    queryFn: async () => {
      let query = supabase
        .from('super_admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (selectedProperty !== 'all') {
        query = query.eq('accessed_property_id', selectedProperty);
      }

      if (dateFrom) {
        query = query.gte('created_at', new Date(dateFrom).toISOString());
      }

      if (dateTo) {
        query = query.lte('created_at', new Date(dateTo).toISOString());
      }

      const { data: logs, error } = await query;

      if (error) throw error;
      
      if (!logs) return [];

      // Fetch related data separately
      const propertyIds = [...new Set(logs.map(l => l.accessed_property_id).filter((id): id is string => id !== null))];

      const { data: users } = await supabase.auth.admin.listUsers();
      const { data: properties } = propertyIds.length > 0 
        ? await supabase
            .from('properties')
            .select('id, name, code')
            .in('id', propertyIds)
        : { data: [] };

      // Enrich logs with user and property data
      return logs.map(log => ({
        ...log,
        admin: users?.users.find((u: any) => u.id === log.admin_user_id) || null,
        property: properties?.find((p: any) => p.id === log.accessed_property_id) || null,
      }));
    },
    enabled: isSuperAdmin,
  });

  const exportToCSV = () => {
    if (!auditLogs || auditLogs.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Date', 'Admin', 'Action', 'Resource', 'Property', 'Resource ID'];
    const rows = auditLogs.map(log => [
      format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
      log.admin?.email || 'Unknown',
      log.action,
      log.resource_type,
      log.property?.name || 'N/A',
      log.resource_id || 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `super-admin-audit-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Audit log exported successfully');
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('delete')) return 'destructive';
    if (action.includes('update')) return 'default';
    if (action.includes('insert')) return 'secondary';
    return 'outline';
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to="/procurement" replace />;
  }

  const filteredLogs = auditLogs?.filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(query) ||
      log.resource_type.toLowerCase().includes(query) ||
      log.admin?.email?.toLowerCase().includes(query) ||
      log.property?.name?.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <SEOHead
        title="Super Admin Audit Log | SS Plaza Procurement"
        description="Monitor and review all super admin actions across all locations for compliance and security."
      />

      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Super Admin Audit Log
            </h1>
            <p className="text-muted-foreground mt-2">
              Monitor cross-location access and actions by super administrators
            </p>
          </div>
          
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <CardDescription>
              Filter audit logs by location, date range, and keywords
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <PropertySelector
                  value={selectedProperty}
                  onValueChange={setSelectedProperty}
                  showAllOption
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <Input
                  placeholder="Action, resource, admin..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">From Date</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">To Date</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-muted-foreground">
                {filteredLogs?.length || 0} audit log{filteredLogs?.length !== 1 ? 's' : ''} found
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedProperty('all');
                  setSearchQuery('');
                  setDateFrom('');
                  setDateTo('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit Entries</CardTitle>
            <CardDescription>
              All super admin actions are logged for security and compliance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading audit logs...
              </div>
            ) : filteredLogs && filteredLogs.length > 0 ? (
              <div className="space-y-4">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex-shrink-0 pt-1">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={getActionBadgeVariant(log.action)}>
                              {log.action}
                            </Badge>
                            <span className="text-sm font-medium">{log.resource_type}</span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {log.admin?.email || 'Unknown Admin'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                            </div>
                            {log.property && (
                              <div className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {log.property.name} ({log.property.code})
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {log.resource_id && (
                        <div className="text-xs text-muted-foreground font-mono">
                          Resource ID: {log.resource_id}
                        </div>
                      )}

                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            View metadata
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No audit logs found matching your criteria</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
