import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardHeader from "@/components/admin/DashboardHeader";
import { AssetManagement } from "@/components/admin/AssetManagement";
import { UtilityManagement } from "@/components/admin/UtilityManagement";
import { StaffPerformanceAnalytics } from "@/components/admin/StaffPerformanceAnalytics";
import { RealTimeDashboard } from "@/components/admin/RealTimeDashboard";
import { AdvancedAnalytics } from "@/components/admin/AdvancedAnalytics";
import { AutomatedWorkflows } from "@/components/admin/AutomatedWorkflows";
import UserManagement from "@/components/admin/UserManagement";
import SecuritySettings from "@/components/admin/SecuritySettings";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <DashboardHeader />
        
        <Tabs defaultValue="dashboard" className="mt-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="utilities">Utilities</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="workflows">Automation</TabsTrigger>
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
            <AdvancedAnalytics />
          </TabsContent>

          <TabsContent value="performance" className="mt-6">
            <StaffPerformanceAnalytics />
          </TabsContent>

          <TabsContent value="workflows" className="mt-6">
            <AutomatedWorkflows />
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