import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeliveryManagementForm } from "@/components/delivery/DeliveryManagementForm";
import { DeliveryTracker } from "@/components/delivery/DeliveryTracker";
import { VisitorApprovalNotifications } from "@/components/delivery/VisitorApprovalNotifications";
import { Package, Bell, Plus } from "lucide-react";

export default function DeliveryPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Package className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Delivery & Visitor Management</h1>
      </div>

      <Tabs defaultValue="tracker" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tracker" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Delivery Tracker
          </TabsTrigger>
          <TabsTrigger value="log" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Log Delivery
          </TabsTrigger>
          <TabsTrigger value="approvals" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Visitor Approvals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tracker" className="mt-6">
          <DeliveryTracker />
        </TabsContent>

        <TabsContent value="log" className="mt-6">
          <DeliveryManagementForm />
        </TabsContent>

        <TabsContent value="approvals" className="mt-6">
          <VisitorApprovalNotifications />
        </TabsContent>
      </Tabs>
    </div>
  );
}