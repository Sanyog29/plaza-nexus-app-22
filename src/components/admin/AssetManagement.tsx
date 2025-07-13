import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Package, Calendar, AlertTriangle, Wrench, Plus, Search, Filter } from "lucide-react";
import { format } from "date-fns";

interface Asset {
  id: string;
  asset_name: string;
  asset_type: string;
  location: string;
  floor: string;
  status: string;
  brand?: string;
  model_number?: string;
  serial_number?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  last_service_date?: string;
  next_service_due?: string;
  amc_vendor?: string;
  amc_start_date?: string;
  amc_end_date?: string;
  amc_cost?: number;
  notes?: string;
}

interface AMCAlert {
  id: string;
  alert_type: string;
  alert_date: string;
  due_date: string;
  asset: {
    asset_name: string;
    location: string;
  };
  is_resolved: boolean;
}

export const AssetManagement = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [amcAlerts, setAmcAlerts] = useState<AMCAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchAssets();
    fetchAMCAlerts();
  }, []);

  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
      toast({
        title: "Error",
        description: "Failed to fetch assets",
        variant: "destructive",
      });
    }
  };

  const fetchAMCAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('amc_alerts')
        .select(`
          *,
          asset:assets(asset_name, location)
        `)
        .eq('is_resolved', false)
        .order('alert_date', { ascending: true });

      if (error) throw error;
      setAmcAlerts(data || []);
    } catch (error) {
      console.error('Error fetching AMC alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'operational':
        return 'bg-green-500';
      case 'maintenance':
        return 'bg-yellow-500';
      case 'out_of_service':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getAlertTypeColor = (alertType: string) => {
    switch (alertType) {
      case 'service_due':
        return 'bg-yellow-500';
      case 'amc_renewal':
        return 'bg-orange-500';
      default:
        return 'bg-blue-500';
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.asset_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const upcomingMaintenanceAssets = assets.filter(asset => 
    asset.next_service_due && new Date(asset.next_service_due) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  );

  const expiredWarrantyAssets = assets.filter(asset => 
    asset.warranty_expiry && new Date(asset.warranty_expiry) < new Date()
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Asset Management</h2>
          <p className="text-muted-foreground">Manage building assets, maintenance schedules, and AMC contracts</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Asset
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assets.length}</div>
            <p className="text-xs text-muted-foreground">
              {assets.filter(a => a.status === 'operational').length} operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Due</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingMaintenanceAssets.length}</div>
            <p className="text-xs text-muted-foreground">Next 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AMC Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{amcAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Pending actions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired Warranties</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiredWarrantyAssets.length}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="assets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="alerts">AMC Alerts</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Status</option>
              <option value="operational">Operational</option>
              <option value="maintenance">Maintenance</option>
              <option value="out_of_service">Out of Service</option>
            </select>
          </div>

          {/* Assets List */}
          <div className="grid gap-4">
            {filteredAssets.map((asset) => (
              <Card key={asset.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{asset.asset_name}</CardTitle>
                      <CardDescription>
                        {asset.asset_type} • {asset.location} • Floor {asset.floor}
                      </CardDescription>
                    </div>
                    <Badge className={`${getStatusColor(asset.status)} text-white`}>
                      {asset.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Asset Details</h4>
                      <div className="space-y-1 text-sm">
                        {asset.brand && <p><span className="font-medium">Brand:</span> {asset.brand}</p>}
                        {asset.model_number && <p><span className="font-medium">Model:</span> {asset.model_number}</p>}
                        {asset.serial_number && <p><span className="font-medium">Serial:</span> {asset.serial_number}</p>}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Maintenance</h4>
                      <div className="space-y-1 text-sm">
                        {asset.last_service_date && (
                          <p><span className="font-medium">Last Service:</span> {format(new Date(asset.last_service_date), 'MMM dd, yyyy')}</p>
                        )}
                        {asset.next_service_due && (
                          <p><span className="font-medium">Next Service:</span> {format(new Date(asset.next_service_due), 'MMM dd, yyyy')}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">AMC Contract</h4>
                      <div className="space-y-1 text-sm">
                        {asset.amc_vendor && <p><span className="font-medium">Vendor:</span> {asset.amc_vendor}</p>}
                        {asset.amc_end_date && (
                          <p><span className="font-medium">Contract Ends:</span> {format(new Date(asset.amc_end_date), 'MMM dd, yyyy')}</p>
                        )}
                        {asset.amc_cost && (
                          <p><span className="font-medium">Annual Cost:</span> ₹{asset.amc_cost.toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="grid gap-4">
            {amcAlerts.map((alert) => (
              <Card key={alert.id} className="border-l-4 border-l-orange-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{alert.asset.asset_name}</CardTitle>
                      <CardDescription>{alert.asset.location}</CardDescription>
                    </div>
                    <Badge className={`${getAlertTypeColor(alert.alert_type)} text-white`}>
                      {alert.alert_type.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Alert Date: {format(new Date(alert.alert_date), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Due Date: {format(new Date(alert.due_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Resolve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {amcAlerts.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending AMC alerts</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <div className="grid gap-4">
            {upcomingMaintenanceAssets.map((asset) => (
              <Card key={asset.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{asset.asset_name}</CardTitle>
                      <CardDescription>{asset.location} • Floor {asset.floor}</CardDescription>
                    </div>
                    <Badge variant="secondary">
                      Due: {asset.next_service_due && format(new Date(asset.next_service_due), 'MMM dd, yyyy')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Last serviced: {asset.last_service_date && format(new Date(asset.last_service_date), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Vendor: {asset.amc_vendor || 'Not assigned'}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Schedule Maintenance
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {upcomingMaintenanceAssets.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No upcoming maintenance scheduled</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};