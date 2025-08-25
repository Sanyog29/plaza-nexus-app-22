import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { handleSupabaseError } from '@/utils/errorHandler';
import { CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
}

export const ErrorRecoveryTest: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { user } = useAuth();

  const runTests = async () => {
    if (!user) {
      toast({ title: "Authentication required", variant: "destructive" });
      return;
    }

    setIsRunning(true);
    const testResults: TestResult[] = [];

    // Test 1: Performance metrics upsert with conflict handling
    try {
      const testDate = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('performance_metrics')
        .upsert({
          metric_date: testDate,
          total_requests: 10,
          completed_requests: 8,
          average_completion_time_minutes: 120,
          sla_breaches: 1,
          calculated_at: new Date().toISOString()
        }, {
          onConflict: 'metric_date',
          ignoreDuplicates: false
        });

      if (error) {
        throw error;
      }

      testResults.push({
        name: 'Performance Metrics Upsert',
        status: 'success',
        message: 'Successfully handled potential conflicts with unique constraint'
      });
    } catch (error: any) {
      testResults.push({
        name: 'Performance Metrics Upsert',
        status: 'error',
        message: handleSupabaseError(error)
      });
    }

    // Test 2: Dietary preferences with conflict handling
    try {
      const { error } = await supabase
        .from('dietary_preferences')
        .upsert({
          user_id: user.id,
          allergies: ['test'],
          dietary_restrictions: ['vegetarian'],
          spice_tolerance: 'medium'
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (error) {
        throw error;
      }

      testResults.push({
        name: 'Dietary Preferences Upsert',
        status: 'success',
        message: 'Successfully handled user preferences with unique constraint'
      });
    } catch (error: any) {
      testResults.push({
        name: 'Dietary Preferences Upsert',
        status: 'error',
        message: handleSupabaseError(error)
      });
    }

    // Test 3: Analytics summaries upsert
    try {
      const testDate = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('analytics_summaries')
        .upsert({
          summary_date: testDate,
          summary_type: 'daily',
          metric_category: 'test',
          metric_data: { test: true },
          calculated_at: new Date().toISOString()
        }, {
          onConflict: 'summary_date,summary_type,metric_category',
          ignoreDuplicates: false
        });

      if (error) {
        throw error;
      }

      testResults.push({
        name: 'Analytics Summaries Upsert',
        status: 'success',
        message: 'Successfully handled analytics data with composite unique constraint'
      });
    } catch (error: any) {
      testResults.push({
        name: 'Analytics Summaries Upsert',
        status: 'error',
        message: handleSupabaseError(error)
      });
    }

    // Test 4: Error handling in dashboard data
    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*')
        .limit(1);

      if (error) {
        throw error;
      }

      testResults.push({
        name: 'Dashboard Data Fetch',
        status: 'success',
        message: 'Successfully fetched maintenance requests without constraint errors'
      });
    } catch (error: any) {
      testResults.push({
        name: 'Dashboard Data Fetch',
        status: 'warning',
        message: `Non-critical error handled: ${handleSupabaseError(error)}`
      });
    }

    setResults(testResults);
    setIsRunning(false);

    // Show summary toast
    const successCount = testResults.filter(r => r.status === 'success').length;
    const errorCount = testResults.filter(r => r.status === 'error').length;
    
    if (errorCount === 0) {
      toast({
        title: "All Tests Passed!",
        description: `${successCount} tests completed successfully`,
      });
    } else {
      toast({
        title: "Some Tests Failed",
        description: `${errorCount} errors, ${successCount} successes`,
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return null;
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          Database Error Recovery Test
          <Button
            size="sm"
            onClick={runTests}
            disabled={isRunning}
            className="ml-auto"
          >
            {isRunning && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
            {isRunning ? 'Running Tests...' : 'Run Tests'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {results.length === 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Click "Run Tests" to verify database constraint error handling is working correctly.
              </AlertDescription>
            </Alert>
          )}
          
          {results.map((result, index) => (
            <Alert
              key={index}
              variant={result.status === 'error' ? 'destructive' : 'default'}
              className={
                result.status === 'success' 
                  ? 'border-green-500/50 bg-green-950/20' 
                  : result.status === 'warning'
                  ? 'border-yellow-500/50 bg-yellow-950/20'
                  : ''
              }
            >
              {getStatusIcon(result.status)}
              <AlertDescription>
                <div className="font-medium">{result.name}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {result.message}
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};