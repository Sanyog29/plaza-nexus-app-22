import { SettingsManagement } from "@/components/settings/SettingsManagement";
import { DepartmentFeatureMatrix } from "@/components/admin/DepartmentFeatureMatrix";
import { ConditionalAccessManager } from "@/components/admin/ConditionalAccessManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Building2, Clock, Shield } from "lucide-react";

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
            <TabsList className="grid w-full grid-cols-4">
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

            <TabsContent value="security">
              <div className="text-center p-8">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Advanced Security Controls</h3>
                <p className="text-muted-foreground">Coming in Phase 5.6 - Enterprise Integration & Scalability</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}