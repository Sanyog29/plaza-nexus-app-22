import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TestTube2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Play, 
  FileText,
  Shield,
  Zap,
  Bug
} from 'lucide-react';

interface TestSuite {
  name: string;
  passed: number;
  failed: number;
  total: number;
  duration: string;
  status: 'passed' | 'failed' | 'running' | 'pending';
}

const testSuites: TestSuite[] = [
  {
    name: 'Unit Tests',
    passed: 47,
    failed: 2,
    total: 49,
    duration: '12.3s',
    status: 'failed'
  },
  {
    name: 'Integration Tests',
    passed: 23,
    failed: 0,
    total: 23,
    duration: '8.7s',
    status: 'passed'
  },
  {
    name: 'E2E Tests',
    passed: 15,
    failed: 1,
    total: 16,
    duration: '45.2s',
    status: 'failed'
  },
  {
    name: 'Component Tests',
    passed: 34,
    failed: 0,
    total: 34,
    duration: '6.1s',
    status: 'passed'
  }
];

const codeQualityMetrics = [
  { name: 'Test Coverage', value: 87, target: 90, status: 'warning' },
  { name: 'Code Quality', value: 92, target: 85, status: 'good' },
  { name: 'Security Score', value: 94, target: 90, status: 'good' },
  { name: 'Performance Score', value: 78, target: 80, status: 'warning' }
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'passed':
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'running':
      return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'passed':
      return <Badge className="bg-emerald-100 text-emerald-800">Passed</Badge>;
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>;
    case 'running':
      return <Badge className="bg-blue-100 text-blue-800">Running</Badge>;
    default:
      return <Badge variant="outline">Pending</Badge>;
  }
};

export const TestingDashboard: React.FC = () => {
  const totalTests = testSuites.reduce((sum, suite) => sum + suite.total, 0);
  const totalPassed = testSuites.reduce((sum, suite) => sum + suite.passed, 0);
  const totalFailed = testSuites.reduce((sum, suite) => sum + suite.failed, 0);
  const overallPassRate = Math.round((totalPassed / totalTests) * 100);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Testing & Quality Assurance</h2>
          <p className="text-muted-foreground">
            Monitor test results, code quality, and system reliability
          </p>
        </div>
        <Button className="gap-2">
          <Play className="h-4 w-4" />
          Run All Tests
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="unit">Unit Tests</TabsTrigger>
          <TabsTrigger value="e2e">E2E Tests</TabsTrigger>
          <TabsTrigger value="quality">Code Quality</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
                <TestTube2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTests}</div>
                <p className="text-xs text-muted-foreground">
                  Across all test suites
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overallPassRate}%</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span>{totalPassed} passed</span>
                  <span>•</span>
                  <span>{totalFailed} failed</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Coverage</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87%</div>
                <Progress value={87} className="mt-2 h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  3% below target
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78</div>
                <Progress value={78} className="mt-2 h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Lighthouse score
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Test Suite Results</CardTitle>
              <CardDescription>
                Status and results for all test suites
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testSuites.map((suite) => (
                  <div key={suite.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(suite.status)}
                      <div>
                        <div className="font-medium">{suite.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {suite.passed}/{suite.total} tests passed • {suite.duration}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress 
                        value={(suite.passed / suite.total) * 100} 
                        className="w-24 h-2"
                      />
                      {getStatusBadge(suite.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Unit Test Results</CardTitle>
              <CardDescription>
                Component and utility function tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-emerald-600">47</div>
                    <div className="text-sm text-muted-foreground">Passed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">2</div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">12.3s</div>
                    <div className="text-sm text-muted-foreground">Duration</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>AdminDashboard.test.tsx</span>
                    <span className="text-emerald-600">✓ 5/5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>MetricsOverview.test.tsx</span>
                    <span className="text-emerald-600">✓ 4/4</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>ErrorBoundary.test.tsx</span>
                    <span className="text-red-600">✗ 2/4</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>useDashboardMetrics.test.tsx</span>
                    <span className="text-emerald-600">✓ 3/3</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="e2e" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>End-to-End Test Results</CardTitle>
              <CardDescription>
                Full application workflow tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-emerald-600">15</div>
                    <div className="text-sm text-muted-foreground">Passed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">1</div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">45.2s</div>
                    <div className="text-sm text-muted-foreground">Duration</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Dashboard Navigation</span>
                    <span className="text-emerald-600">✓ Passed</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Analytics Tab Switching</span>
                    <span className="text-emerald-600">✓ Passed</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Performance Metrics</span>
                    <span className="text-emerald-600">✓ Passed</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Mobile Responsiveness</span>
                    <span className="text-red-600">✗ Failed</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {codeQualityMetrics.map((metric) => (
              <Card key={metric.name}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{metric.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-2xl font-bold">{metric.value}%</span>
                      <Badge 
                        variant={metric.status === 'good' ? 'default' : 'secondary'}
                        className={metric.status === 'good' ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}
                      >
                        {metric.status === 'good' ? 'Good' : 'Needs Improvement'}
                      </Badge>
                    </div>
                    <Progress value={metric.value} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Target: {metric.target}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Code Quality Issues
              </CardTitle>
              <CardDescription>
                Identified issues and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Unused imports detected</div>
                    <div className="text-sm text-muted-foreground">3 files affected</div>
                  </div>
                  <Badge variant="outline">Low</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Missing error boundaries</div>
                    <div className="text-sm text-muted-foreground">2 components need protection</div>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Performance optimization opportunity</div>
                    <div className="text-sm text-muted-foreground">Lazy loading not implemented</div>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};