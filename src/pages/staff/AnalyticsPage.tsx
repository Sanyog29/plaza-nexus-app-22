import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StaffPerformanceDashboard } from "@/components/staff/StaffPerformanceDashboard";
import { TaskAnalyticsDashboard } from "@/components/staff/TaskAnalyticsDashboard";
import { SLAMonitoringDashboard } from "@/components/staff/SLAMonitoringDashboard";

export default function StaffAnalyticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">My Performance Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive analytics for your work performance and productivity
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Performance Overview</TabsTrigger>
            <TabsTrigger value="tasks">Task Analytics</TabsTrigger>
            <TabsTrigger value="sla">SLA Monitoring</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <StaffPerformanceDashboard />
          </TabsContent>

          <TabsContent value="tasks">
            <TaskAnalyticsDashboard />
          </TabsContent>

          <TabsContent value="sla">
            <SLAMonitoringDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}