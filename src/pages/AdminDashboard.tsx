import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import DashboardHeader from "@/components/admin/DashboardHeader";
import { AssetManagement } from "@/components/admin/AssetManagement";
import { UtilityManagement } from "@/components/admin/UtilityManagement";
import { StaffPerformanceAnalytics } from "@/components/admin/StaffPerformanceAnalytics";
import { RealTimeDashboard } from "@/components/admin/RealTimeDashboard";
import { AdvancedAnalytics } from "@/components/admin/AdvancedAnalytics";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { PerformanceOptimization } from "@/components/optimization/PerformanceOptimization";
import { DeploymentReadiness } from "@/components/deployment/DeploymentReadiness";
import { TestingDashboard } from "@/components/testing/TestingDashboard";
import { AutomatedWorkflows } from "@/components/admin/AutomatedWorkflows";
import UserManagement from "@/components/admin/UserManagement";
import SecuritySettings from "@/components/admin/SecuritySettings";
import { MobileAdminTabs } from "@/components/admin/MobileAdminTabs";

export default function AdminDashboard() {
  const isMobile = useIsMobile();

  const tabComponents = {
    dashboard: <RealTimeDashboard />,
    assets: <AssetManagement />,
    utilities: <UtilityManagement />,
    analytics: <AnalyticsDashboard />,
    performance: <PerformanceOptimization />,
    workflows: <AutomatedWorkflows />,
    testing: <TestingDashboard />,
    deployment: <DeploymentReadiness />,
    users: <UserManagement />,
    security: <SecuritySettings />
  };

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 pb-20">
        <div className="px-4 py-6">
          <DashboardHeader />
          <MobileAdminTabs tabComponents={tabComponents} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <DashboardHeader />
        
        <Tabs defaultValue="dashboard" className="mt-6">
          <TabsList className="grid w-full grid-cols-10">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="utilities">Utilities</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="workflows">Automation</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
            <TabsTrigger value="deployment">Deploy</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <RealTimeDashboard />
          </TabsContent>

          <TabsContent value="assets" className="mt-6">
            <AssetManagement />
          </TabsContent>

          <TabsContent value="utilities" className="mt-6">
            <UtilityManagement />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="performance" className="mt-6">
            <PerformanceOptimization />
          </TabsContent>

          <TabsContent value="workflows" className="mt-6">
            <AutomatedWorkflows />
          </TabsContent>

          <TabsContent value="testing" className="mt-6">
            <TestingDashboard />
          </TabsContent>

          <TabsContent value="deployment" className="mt-6">
            <DeploymentReadiness />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <SecuritySettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}