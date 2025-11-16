import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Wrench, AlertTriangle, CheckCircle } from "lucide-react";
import { AssetManagement } from "@/components/assets/AssetManagement";
import { useAuth } from '@/components/AuthProvider';
import { usePropertyContext } from '@/contexts/PropertyContext';
import { getRoleLevel } from '@/constants/roles';
import { PropertySelector } from '@/components/analytics/PropertySelector';
import { useState } from 'react';

export default function AssetsPage() {
  const { user } = useAuth();
  const { currentProperty } = usePropertyContext();
  const userRole = user?.user_metadata?.role;
  const roleLevel = getRoleLevel(userRole);

  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(() => {
    if (roleLevel === 'L4+') return null;
    return currentProperty?.id || null;
  });

  const effectivePropertyId = (roleLevel === 'L2' || roleLevel === 'L1')
    ? currentProperty?.id || null
    : selectedPropertyId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Asset Management</h1>
            <p className="text-muted-foreground mt-2">
              Monitor and manage all facility assets and equipment
            </p>
          </div>

          {/* Property Selector for L3 and L4+ */}
          {(roleLevel === 'L3' || roleLevel === 'L4+') && (
            <PropertySelector
              value={selectedPropertyId}
              onChange={setSelectedPropertyId}
              variant="header"
            />
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,247</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Operational</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">1,198</div>
              <p className="text-xs text-muted-foreground">96.1% operational</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Under Maintenance</CardTitle>
              <Wrench className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">32</div>
              <p className="text-xs text-muted-foreground">2.6% in maintenance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">17</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>
        </div>

        <AssetManagement propertyId={effectivePropertyId} />
      </div>
    </div>
  );
}