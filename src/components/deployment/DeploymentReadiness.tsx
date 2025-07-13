import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Rocket, 
  CheckCircle, 
  AlertCircle, 
  Settings, 
  Globe,
  Shield,
  Zap,
  Database,
  Cloud
} from 'lucide-react';

interface DeploymentCheck {
  name: string;
  status: 'passed' | 'warning' | 'failed';
  description: string;
  action?: string;
}

const deploymentChecks: DeploymentCheck[] = [
  {
    name: 'Environment Variables',
    status: 'passed',
    description: 'All required environment variables are configured',
  },
  {
    name: 'Build Process',
    status: 'passed',
    description: 'TypeScript compilation and build process completed successfully',
  },
  {
    name: 'Bundle Size',
    status: 'warning',
    description: 'Bundle size is acceptable but could be optimized further',
    action: 'Optimize bundle'
  },
  {
    name: 'Security Headers',
    status: 'warning',
    description: 'Security headers should be configured for production',
    action: 'Configure headers'
  },
  {
    name: 'Error Tracking',
    status: 'failed',
    description: 'Error tracking service not configured',
    action: 'Setup monitoring'
  },
  {
    name: 'Performance Monitoring',
    status: 'warning',
    description: 'Performance monitoring partially configured',
    action: 'Complete setup'
  }
];

const deploymentSteps = [
  { name: 'Build Application', status: 'completed', time: '2m 34s' },
  { name: 'Run Tests', status: 'completed', time: '1m 12s' },
  { name: 'Security Scan', status: 'completed', time: '45s' },
  { name: 'Deploy to Staging', status: 'in-progress', time: '...' },
  { name: 'Run E2E Tests', status: 'pending', time: '...' },
  { name: 'Deploy to Production', status: 'pending', time: '...' }
];

const environmentConfigs = [
  {
    name: 'Development',
    url: 'http://localhost:5173',
    status: 'active',
    lastDeployed: '2024-01-15 14:30',
    version: 'latest'
  },
  {
    name: 'Staging',
    url: 'https://staging.buildingmanagement.app',
    status: 'deploying',
    lastDeployed: '2024-01-15 13:45',
    version: 'v1.2.3'
  },
  {
    name: 'Production',
    url: 'https://buildingmanagement.app',
    status: 'stable',
    lastDeployed: '2024-01-14 09:15',
    version: 'v1.2.2'
  }
];

export const DeploymentReadiness: React.FC = () => {
  const [isDeploying, setIsDeploying] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-100 text-emerald-800">Active</Badge>;
      case 'deploying':
        return <Badge className="bg-blue-100 text-blue-800">Deploying</Badge>;
      case 'stable':
        return <Badge className="bg-green-100 text-green-800">Stable</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const passedChecks = deploymentChecks.filter(check => check.status === 'passed').length;
  const readinessScore = Math.round((passedChecks / deploymentChecks.length) * 100);

  const handleDeploy = () => {
    setIsDeploying(true);
    // Simulate deployment
    setTimeout(() => {
      setIsDeploying(false);
    }, 5000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Deployment Readiness</h2>
          <p className="text-muted-foreground">
            Ensure your application is ready for production deployment
          </p>
        </div>
        <Button 
          onClick={handleDeploy} 
          disabled={isDeploying || readinessScore < 70}
          className="gap-2"
        >
          <Rocket className="h-4 w-4" />
          {isDeploying ? 'Deploying...' : 'Deploy to Production'}
        </Button>
      </div>

      <Tabs defaultValue="readiness" className="space-y-4">
        <TabsList>
          <TabsTrigger value="readiness">Readiness Check</TabsTrigger>
          <TabsTrigger value="environments">Environments</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="readiness" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Deployment Readiness Score
              </CardTitle>
              <CardDescription>
                Overall readiness based on critical deployment checks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{readinessScore}%</span>
                  <Badge 
                    variant={readinessScore >= 85 ? "default" : readinessScore >= 70 ? "secondary" : "destructive"}
                    className="px-3 py-1"
                  >
                    {readinessScore >= 85 ? "Ready" : readinessScore >= 70 ? "Needs Attention" : "Not Ready"}
                  </Badge>
                </div>
                <Progress value={readinessScore} className="h-3" />
                <p className="text-sm text-muted-foreground">
                  {passedChecks} of {deploymentChecks.length} checks passed
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {deploymentChecks.map((check) => (
              <Card key={check.name}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(check.status)}
                      <div>
                        <div className="font-medium">{check.name}</div>
                        <div className="text-sm text-muted-foreground">{check.description}</div>
                      </div>
                    </div>
                    {check.action && (
                      <Button variant="outline" size="sm">
                        {check.action}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="environments" className="space-y-6">
          <div className="grid gap-4">
            {environmentConfigs.map((env) => (
              <Card key={env.name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{env.name}</CardTitle>
                    {getStatusBadge(env.status)}
                  </div>
                  <CardDescription>{env.url}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Last Deployed:</span>
                      <div className="font-medium">{env.lastDeployed}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Version:</span>
                      <div className="font-medium">{env.version}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm">
                      <Globe className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="mr-2 h-4 w-4" />
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Pipeline</CardTitle>
              <CardDescription>
                Current deployment status and pipeline steps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deploymentSteps.map((step, index) => (
                  <div key={step.name} className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted text-sm font-medium">
                        {index + 1}
                      </div>
                      {getStatusIcon(step.status)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{step.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {step.status === 'in-progress' ? 'In progress...' : 
                         step.status === 'completed' ? `Completed in ${step.time}` : 
                         'Pending'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">98.5%</div>
                  <div className="text-sm text-muted-foreground">Uptime this month</div>
                  <Progress value={98.5} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-500" />
                  Database
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">45ms</div>
                  <div className="text-sm text-muted-foreground">Avg query time</div>
                  <Progress value={85} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Cloud className="h-4 w-4 text-green-500" />
                  Storage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">2.3GB</div>
                  <div className="text-sm text-muted-foreground">Used of 10GB</div>
                  <Progress value={23} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};