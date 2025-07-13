import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DietaryPreferencesManager } from "@/components/cafeteria/DietaryPreferencesManager";
import { useAuth } from "@/components/AuthProvider";
import { UtensilsCrossed, Settings, Heart } from "lucide-react";

export default function CafeteriaPage() {
  const { userRole } = useAuth();

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Cafeteria & Food Services</h1>
        </div>

        <Tabs defaultValue="menu" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="menu" className="flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              Menu & Orders
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Dietary Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="menu" className="mt-6">
            <div className="p-8 text-center">
              <UtensilsCrossed className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Menu & Orders</h3>
              <p className="text-muted-foreground">Enhanced menu system with dietary filtering coming soon!</p>
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="mt-6">
            <DietaryPreferencesManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}