
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Users, TrendingUp, Leaf, Bot, MessageSquare, Wrench, BarChart3 } from 'lucide-react';
import { SmartRequestRouting } from '@/components/automation/SmartRequestRouting';
import { PredictiveEscalation } from '@/components/automation/PredictiveEscalation';
import TenantSatisfactionScoring from '@/components/client/TenantSatisfactionScoring';
import { SelfServicePortal } from '@/components/client/SelfServicePortal';
import { CarbonFootprintTracking } from '@/components/insights/CarbonFootprintTracking';
import { useAuth } from '@/components/AuthProvider';

const AdvancedFeaturesPage: React.FC = () => {
  const { isAdmin, userRole } = useAuth();

  if (!isAdmin && userRole !== 'ops_supervisor') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="text-center py-12">
            <Zap className="h-16 w-16 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">Advanced features require supervisor access.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Zap className="h-8 w-8 text-primary" />
            Advanced Features & Optimization
          </h1>
          <p className="text-muted-foreground">
            Next-generation facility management with AI automation, client experience enhancement, and advanced insights
          </p>
        </div>

        {/* Feature Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <Bot className="h-5 w-5 text-blue-500" />
                Intelligent Automation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Smart Request Routing</li>
                <li>• Predictive Escalation</li>
                <li>• Automated Status Updates</li>
                <li>• Dynamic SLA Adjustment</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-green-500" />
                Client Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Satisfaction Scoring</li>
                <li>• Self-Service Portal</li>
                <li>• Communication Automation</li>
                <li>• Multi-Language Support</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                Advanced Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Carbon Footprint Tracking</li>
                <li>• Space Utilization Analytics</li>
                <li>• Compliance Reports</li>
                <li>• Cost-Benefit Analysis</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="automation" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-card/50">
            <TabsTrigger value="automation" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">Intelligent Automation</span>
              <span className="sm:hidden">Automation</span>
            </TabsTrigger>
            <TabsTrigger value="client" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Client Experience</span>
              <span className="sm:hidden">Client</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Advanced Insights</span>
              <span className="sm:hidden">Insights</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="automation">
            <Tabs defaultValue="routing" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 bg-card/30">
                <TabsTrigger value="routing">Smart Routing</TabsTrigger>
                <TabsTrigger value="escalation">Predictive Escalation</TabsTrigger>
              </TabsList>

              <TabsContent value="routing">
                <SmartRequestRouting />
              </TabsContent>

              <TabsContent value="escalation">
                <PredictiveEscalation />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="client">
            <Tabs defaultValue="satisfaction" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 bg-card/30">
                <TabsTrigger value="satisfaction" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Satisfaction Scoring
                </TabsTrigger>
                <TabsTrigger value="selfservice" className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Self-Service Portal
                </TabsTrigger>
              </TabsList>

              <TabsContent value="satisfaction">
                <TenantSatisfactionScoring />
              </TabsContent>

              <TabsContent value="selfservice">
                <SelfServicePortal />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="insights">
            <Tabs defaultValue="carbon" className="space-y-6">
              <TabsList className="grid w-full grid-cols-1 bg-card/30">
                <TabsTrigger value="carbon" className="flex items-center gap-2">
                  <Leaf className="h-4 w-4" />
                  Carbon Footprint & Sustainability
                </TabsTrigger>
              </TabsList>

              <TabsContent value="carbon">
                <CarbonFootprintTracking />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdvancedFeaturesPage;
