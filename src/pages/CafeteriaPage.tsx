import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DietaryPreferencesManager } from "@/components/cafeteria/DietaryPreferencesManager";
import { EnhancedMenuSystem } from "@/components/cafeteria/EnhancedMenuSystem";
import { KitchenIntegration } from "@/components/cafeteria/KitchenIntegration";
import { VendorManagement } from "@/components/cafeteria/VendorManagement";
import OrderHistory from "@/components/cafeteria/OrderHistory";
import { useAuth } from "@/components/AuthProvider";
import { UtensilsCrossed, Settings, Heart, ChefHat, Store, History } from "lucide-react";

// Customer-facing components
import { CustomerOrderingPage } from "@/components/customer/CustomerOrderingPage";
import { VendorMenuPage } from "@/components/customer/VendorMenuPage";
import { CustomerCart } from "@/components/customer/CustomerCart";
import { CartProvider } from "@/contexts/CartContext";

export default function CafeteriaPage() {
  const { userRole, isAdmin, isStaff } = useAuth();

  // For tenant users, show customer ordering interface
  if (!isAdmin && !isStaff && userRole === 'tenant') {
    return (
      <CartProvider>
        <div className="p-6">
          <Routes>
            <Route path="/" element={<CustomerOrderingPage />} />
            <Route path="/vendor/:vendorId" element={<VendorMenuPage />} />
            <Route path="/cart" element={<CustomerCart />} />
          </Routes>
        </div>
      </CartProvider>
    );
  }

  // For admin/staff, show management interface
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Cafeteria & Food Services Management</h1>
        </div>

        <Tabs defaultValue="menu" className="w-full">
          <TabsList className={`grid w-full ${userRole === 'admin' ? 'grid-cols-5' : userRole === 'vendor' ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="menu" className="flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              Menu Management
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Order History
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Dietary Preferences
            </TabsTrigger>
            {(userRole === 'admin' || userRole === 'vendor') && (
              <TabsTrigger value="kitchen" className="flex items-center gap-2">
                <ChefHat className="h-4 w-4" />
                Kitchen
              </TabsTrigger>
            )}
            {userRole === 'admin' && (
              <TabsTrigger value="vendors" className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                Vendors
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="menu" className="mt-6">
            <EnhancedMenuSystem />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <OrderHistory />
          </TabsContent>

          <TabsContent value="preferences" className="mt-6">
            <DietaryPreferencesManager />
          </TabsContent>

          {(userRole === 'admin' || userRole === 'vendor') && (
            <TabsContent value="kitchen" className="mt-6">
              <KitchenIntegration />
            </TabsContent>
          )}

          {userRole === 'admin' && (
            <TabsContent value="vendors" className="mt-6">
              <VendorManagement />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}