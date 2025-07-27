import { SettingsManagement } from "@/components/settings/SettingsManagement";
import { DepartmentFeatureMatrix } from "@/components/admin/DepartmentFeatureMatrix";
import { ConditionalAccessManager } from "@/components/admin/ConditionalAccessManager";
import { WorkflowApprovalManager } from "@/components/admin/WorkflowApprovalManager";
import { AIFeatureRecommendations } from "@/components/admin/AIFeatureRecommendations";
import { EnterpriseIntegrationManager } from "@/components/admin/EnterpriseIntegrationManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Building2, Clock, Shield, GitBranch, Brain, Cloud } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">System Settings</h1>
            <p className="text-muted-foreground">Configure system preferences, access controls, and advanced features.</p>
          </div>
          
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="departments" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Departments
              </TabsTrigger>
              <TabsTrigger value="conditional" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Conditional Access
              </TabsTrigger>
              <TabsTrigger value="workflows" className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Workflows
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Features
              </TabsTrigger>
              <TabsTrigger value="enterprise" className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                Enterprise
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <SettingsManagement />
            </TabsContent>

            <TabsContent value="departments">
              <DepartmentFeatureMatrix />
            </TabsContent>

            <TabsContent value="conditional">
              <ConditionalAccessManager />
            </TabsContent>

            <TabsContent value="workflows">
              <WorkflowApprovalManager />
            </TabsContent>

            <TabsContent value="ai">
              <AIFeatureRecommendations />
            </TabsContent>

            <TabsContent value="enterprise">
              <EnterpriseIntegrationManager />
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Advanced Security Controls
                  </CardTitle>
                  <CardDescription>
                    Enhanced security settings and monitoring (Coming Soon)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Advanced security controls will be available in the next update.</p>
                    <p className="text-sm mt-2">This will include threat detection, security analytics, and compliance monitoring.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}