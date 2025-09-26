
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HardDrive, Server, ServerCog, Calendar, Clock, Wrench } from 'lucide-react';
import { format, addDays, isBefore } from 'date-fns';
import MaintenanceRequestModal from '@/components/maintenance/MaintenanceRequestModal';

// Sample asset data
const assets = [
  { id: 'asset-001', name: 'Main UPS System', type: 'UPS', status: 'operational', lastMaintenance: '2025-03-15', nextMaintenance: '2025-06-15', location: 'Basement, Room B1' },
  { id: 'asset-002', name: 'HVAC Unit - Floor 3', type: 'HVAC', status: 'needs-attention', lastMaintenance: '2025-02-10', nextMaintenance: '2025-04-30', location: '3rd Floor, East Wing' },
  { id: 'asset-003', name: 'Fire Panel - Main', type: 'Fire System', status: 'operational', lastMaintenance: '2025-04-01', nextMaintenance: '2025-07-01', location: 'Ground Floor, Security Room' },
  { id: 'asset-004', name: 'Backup Generator', type: 'Power', status: 'maintenance-due', lastMaintenance: '2025-01-05', nextMaintenance: '2025-04-05', location: 'Basement, Room B3' },
  { id: 'asset-005', name: 'Elevator System - Tower A', type: 'Elevator', status: 'operational', lastMaintenance: '2025-03-25', nextMaintenance: '2025-06-25', location: 'Throughout Building' },
];

// Sample scheduled maintenance
const scheduledMaintenance = [
  { id: 'maint-001', assetName: 'HVAC Unit - Floor 3', type: 'Preventive', scheduledDate: '2025-04-30', assignedTo: 'Tech Team 1', status: 'scheduled' },
  { id: 'maint-002', assetName: 'Backup Generator', type: 'Preventive', scheduledDate: '2025-04-29', assignedTo: 'External Vendor', status: 'scheduled' },
  { id: 'maint-003', assetName: 'Security Cameras', type: 'Inspection', scheduledDate: '2025-05-10', assignedTo: 'Security Team', status: 'scheduled' },
];

// Sample work orders
const workOrders = [
  { id: 'wo-001', assetName: 'Fire Panel - Main', description: 'Monthly inspection and testing', requestedBy: 'System', requestDate: '2025-04-25', status: 'pending-approval', priority: 'high' },
  { id: 'wo-002', assetName: 'HVAC Unit - Floor 3', description: 'Filter replacement and system cleaning', requestedBy: 'Maintenance Staff', requestDate: '2025-04-20', status: 'approved', priority: 'medium' },
  { id: 'wo-003', assetName: 'Main UPS System', description: 'Battery test and replacement if needed', requestedBy: 'IT Department', requestDate: '2025-04-15', status: 'in-progress', priority: 'high' },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'operational':
      return <Badge className="bg-green-600">Operational</Badge>;
    case 'needs-attention':
      return <Badge variant="outline" className="bg-yellow-600">Needs Attention</Badge>;
    case 'maintenance-due':
      return <Badge variant="destructive">Maintenance Due</Badge>;
    case 'offline':
      return <Badge variant="destructive">Offline</Badge>;
    case 'scheduled':
      return <Badge className="bg-blue-600">Scheduled</Badge>;
    case 'completed':
      return <Badge variant="secondary">Completed</Badge>;
    case 'pending-approval':
      return <Badge variant="outline">Pending Approval</Badge>;
    case 'approved':
      return <Badge className="bg-green-600">Approved</Badge>;
    case 'in-progress':
      return <Badge className="bg-blue-600">In Progress</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'high':
      return <Badge variant="destructive">High</Badge>;
    case 'medium':
      return <Badge className="bg-yellow-600">Medium</Badge>;
    case 'low':
      return <Badge variant="outline">Low</Badge>;
    default:
      return null;
  }
};

const getAssetIcon = (type: string) => {
  switch (type) {
    case 'UPS':
      return <HardDrive className="h-5 w-5 text-plaza-blue" />;
    case 'HVAC':
      return <ServerCog className="h-5 w-5 text-plaza-blue" />;
    case 'Fire System':
      return <Server className="h-5 w-5 text-red-500" />;
    case 'Power':
      return <HardDrive className="h-5 w-5 text-yellow-500" />;
    default:
      return <Wrench className="h-5 w-5 text-plaza-blue" />;
  }
};

const isMaintenanceSoon = (nextDate: string) => {
  const now = new Date();
  const next = new Date(nextDate);
  const thresholdDate = addDays(now, 14); // Two weeks threshold
  return isBefore(next, thresholdDate);
};

const MaintenancePage = () => {
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  const handleRequestMaintenance = (asset: any) => {
    setSelectedAsset(asset);
    setShowMaintenanceModal(true);
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Maintenance Management</h2>
          <p className="text-sm text-gray-400 mt-1">Track and manage building assets and maintenance</p>
        </div>
      </div>

      <Tabs defaultValue="assets" className="w-full">
        <TabsList className="grid grid-cols-3 mb-6 bg-card/50">
          <TabsTrigger value="assets" className="data-[state=active]:bg-plaza-blue">
            <HardDrive className="h-4 w-4 mr-2" />
            Assets
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="data-[state=active]:bg-plaza-blue">
            <Calendar className="h-4 w-4 mr-2" />
            Scheduled
          </TabsTrigger>
          <TabsTrigger value="work-orders" className="data-[state=active]:bg-plaza-blue">
            <Wrench className="h-4 w-4 mr-2" />
            Work Orders
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assets">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white text-lg">Asset Inventory</CardTitle>
              <CardDescription>Track and manage building equipment and systems</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Asset</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Location</TableHead>
                    <TableHead className="hidden md:table-cell">Last Maintained</TableHead>
                    <TableHead>Next Maintenance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((asset) => (
                    <TableRow key={asset.id} className="border-border">
                      <TableCell>
                        <div className="flex items-center">
                          <div className="mr-2">
                            {getAssetIcon(asset.type)}
                          </div>
                          <div>
                            <p className="font-medium text-white">{asset.name}</p>
                            <p className="text-xs text-gray-400">{asset.type}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(asset.status)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-gray-400">
                        {asset.location}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-gray-400">
                        {format(new Date(asset.lastMaintenance), 'PPP')}
                      </TableCell>
                      <TableCell>
                        <div className={`text-sm ${isMaintenanceSoon(asset.nextMaintenance) ? 'text-red-400' : 'text-gray-400'}`}>
                          {format(new Date(asset.nextMaintenance), 'PPP')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRequestMaintenance(asset)}
                        >
                          Request
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white text-lg">Scheduled Maintenance</CardTitle>
              <CardDescription>Upcoming preventive maintenance tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduledMaintenance.map((item) => (
                  <div key={item.id} className="flex justify-between items-start p-4 border border-border rounded-md">
                    <div>
                      <h4 className="font-medium text-white">{item.assetName}</h4>
                      <p className="text-sm text-gray-400">{item.type} Maintenance</p>
                      <div className="flex items-center text-xs text-gray-400 mt-1">
                        <Calendar size={12} className="mr-1" />
                        <span>{format(new Date(item.scheduledDate), 'PPP')}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Assigned to: {item.assignedTo}</p>
                    </div>
                    <div>
                      {getStatusBadge(item.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="work-orders">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white text-lg">Work Orders</CardTitle>
              <CardDescription>Manage maintenance requests and approvals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workOrders.map((order) => (
                  <div key={order.id} className="p-4 border border-border rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-white">{order.assetName}</h4>
                          {getPriorityBadge(order.priority)}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{order.description}</p>
                        <div className="flex items-center text-xs text-gray-400 mt-2">
                          <Calendar size={12} className="mr-1" />
                          <span>Requested: {format(new Date(order.requestDate), 'PPP')}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">By: {order.requestedBy}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        {getStatusBadge(order.status)}
                        {order.status === 'pending-approval' && (
                          <div className="mt-2 flex gap-2">
                            <Button size="sm" variant="outline" className="h-8 px-2">Deny</Button>
                            <Button size="sm" className="h-8 px-2 bg-green-600 hover:bg-green-700">Approve</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showMaintenanceModal && selectedAsset && (
        <MaintenanceRequestModal 
          isOpen={showMaintenanceModal}
          onClose={() => setShowMaintenanceModal(false)}
          asset={selectedAsset}
        />
      )}
    </div>
  );
};

export default MaintenancePage;
