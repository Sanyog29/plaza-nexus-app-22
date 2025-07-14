import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/components/AuthProvider";
import { UnifiedDashboard } from "@/components/dashboard/UnifiedDashboard";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import UserManagement from "@/components/admin/UserManagement";
import SecuritySettings from "@/components/admin/SecuritySettings";
import { AssetManagement } from "@/components/admin/AssetManagement";

export default function AdminDashboard() {
  const isMobile = useIsMobile();
  const { userRole } = useAuth();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="px-4 py-6">
          <UnifiedDashboard userRole="admin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <UnifiedDashboard userRole="admin" />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="assets" className="space-y-6">
            <AssetManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}