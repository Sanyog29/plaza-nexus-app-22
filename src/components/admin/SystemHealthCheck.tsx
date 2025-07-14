import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  details?: any;
}

const SystemHealthCheck = () => {
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { user, isAdmin } = useAuth();

  const runHealthChecks = async () => {
    if (!isAdmin) return;
    
    setIsRunning(true);
    const healthChecks: HealthCheck[] = [];

    try {
      // Check database connection
      const { error: dbError } = await supabase.from('profiles').select('count').limit(1);
      healthChecks.push({
        name: 'Database Connection',
        status: dbError ? 'error' : 'healthy',
        message: dbError ? `Database error: ${dbError.message}` : 'Database connection is working',
        details: dbError
      });

      // Check RLS policies
      const { data: policies, error: policyError } = await supabase
        .rpc('get_user_management_data', { caller_id: user?.id });
      
      healthChecks.push({
        name: 'RLS Policies',
        status: policyError ? 'error' : 'healthy',
        message: policyError ? `RLS error: ${policyError.message}` : 'Row Level Security policies are working',
        details: policyError
      });

      // Check auth system
      const { data: authData, error: authError } = await supabase.auth.getUser();
      healthChecks.push({
        name: 'Authentication System',
        status: authError ? 'error' : 'healthy',
        message: authError ? `Auth error: ${authError.message}` : 'Authentication system is working',
        details: authError
      });

      // Check user approval system
      const { data: userMgmtData, error: userMgmtError } = await supabase
        .rpc('get_user_management_data', { caller_id: user?.id });
      
      let orphanedCount = 0;
      if (userMgmtData) {
        orphanedCount = userMgmtData.filter((u: any) => !u.has_profile).length;
      }
      
      healthChecks.push({
        name: 'User Approval System',
        status: userMgmtError ? 'error' : orphanedCount > 0 ? 'warning' : 'healthy',
        message: userMgmtError 
          ? `Approval system error: ${userMgmtError.message}` 
          : orphanedCount > 0 
            ? `Found ${orphanedCount} users without profiles` 
            : 'User approval system is working',
        details: { orphanedCount, error: userMgmtError }
      });

      // Check RPC functions (our actual backend services)
      try {
        const { data: testData, error: rpcError } = await supabase
          .rpc('get_user_management_stats');
        
        healthChecks.push({
          name: 'RPC Functions',
          status: rpcError ? 'error' : 'healthy',
          message: rpcError 
            ? `RPC functions error: ${rpcError.message}` 
            : 'RPC functions are working correctly',
          details: rpcError || testData
        });
      } catch (error) {
        healthChecks.push({
          name: 'RPC Functions',
          status: 'error',
          message: `RPC test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error
        });
      }

      // Check enum types
      const { data: enumData, error: enumError } = await supabase
        .rpc('get_user_management_data', { caller_id: user?.id });
      
      healthChecks.push({
        name: 'Database Schema',
        status: enumError ? 'error' : 'healthy',
        message: enumError ? `Schema error: ${enumError.message}` : 'Database schema is consistent',
        details: enumError
      });

    } catch (error) {
      healthChecks.push({
        name: 'System Check',
        status: 'error',
        message: `System check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: error
      });
    }

    setChecks(healthChecks);
    setIsRunning(false);

    // Show overall status
    const hasErrors = healthChecks.some(check => check.status === 'error');
    const hasWarnings = healthChecks.some(check => check.status === 'warning');
    
    if (hasErrors) {
      toast({
        title: "System Health Issues",
        description: "Some system components have errors. Please review the details.",
        variant: "destructive",
      });
    } else if (hasWarnings) {
      toast({
        title: "System Warnings",
        description: "System is working but some components have warnings.",
        variant: "default",
      });
    } else {
      toast({
        title: "System Healthy",
        description: "All system components are working correctly.",
        variant: "default",
      });
    }
  };

  useEffect(() => {
    if (isAdmin) {
      runHealthChecks();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return null;
  }

  const getStatusIcon = (status: HealthCheck['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusColor = (status: HealthCheck['status']) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>System Health Check</CardTitle>
          </div>
          <Button 
            onClick={runHealthChecks} 
            disabled={isRunning}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            Run Check
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {checks.map((check, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(check.status)}
                <div>
                  <h4 className="font-medium">{check.name}</h4>
                  <p className="text-sm text-muted-foreground">{check.message}</p>
                </div>
              </div>
              <Badge className={getStatusColor(check.status)}>
                {check.status.charAt(0).toUpperCase() + check.status.slice(1)}
              </Badge>
            </div>
          ))}
          
          {checks.length === 0 && !isRunning && (
            <div className="text-center py-6 text-muted-foreground">
              Click "Run Check" to test system health
            </div>
          )}
          
          {isRunning && (
            <div className="text-center py-6">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Running health checks...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemHealthCheck;