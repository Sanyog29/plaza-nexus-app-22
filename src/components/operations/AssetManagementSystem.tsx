import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, Plus, Wrench, Calendar, Upload, CheckCircle } from 'lucide-react';
import { useAssetManagement } from '@/hooks/useAssetManagement';
import { format } from 'date-fns';

export const AssetManagementSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState('assets');
  const [newAsset, setNewAsset] = useState({
    asset_name: '',
    asset_type: '',
    location: '',
    floor: '',
    zone: '',
    brand: '',
    model_number: '',
    amc_vendor: '',
    service_frequency_months: 12,
    status: 'operational'
  });
  const [newServiceRecord, setNewServiceRecord] = useState({
    asset_id: '',
    service_type: 'routine',
    service_date: new Date().toISOString().split('T')[0],
    performed_by: '',
    service_description: '',
    cost: 0
  });

  const {
    assets,
    amcAlerts,
    serviceRecords,
    isLoading,
    createAsset,
    createServiceRecord,
    resolveAmcAlert,
    generateAmcAlerts,
    getAssetsByStatus,
    getUpcomingServices
  } = useAssetManagement();

  const handleCreateAsset = async () => {
    if (!newAsset.asset_name || !newAsset.asset_type || !newAsset.location || !newAsset.floor) {
      return;
    }

    const result = await createAsset(newAsset);
    if (result) {
      setNewAsset({
        asset_name: '',
        asset_type: '',
        location: '',
        floor: '',
        zone: '',
        brand: '',
        model_number: '',
        amc_vendor: '',
        service_frequency_months: 12,
        status: 'operational'
      });
    }
  };

  const handleCreateServiceRecord = async () => {
    if (!newServiceRecord.asset_id || !newServiceRecord.service_description || !newServiceRecord.performed_by) {
      return;
    }

    const result = await createServiceRecord(newServiceRecord);
    if (result) {
      setNewServiceRecord({
        asset_id: '',
        service_type: 'routine',
        service_date: new Date().toISOString().split('T')[0],
        performed_by: '',
        service_description: '',
        cost: 0
      });
    }
  };

  const operationalAssets = getAssetsByStatus('operational');
  const faultyAssets = getAssetsByStatus('faulty');
  const upcomingServices = getUpcomingServices(30);

  return (
    <div className="space-y-6">
      {/* Asset Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{operationalAssets.length}</div>
            <div className="text-sm text-gray-400">Operational</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{faultyAssets.length}</div>
            <div className="text-sm text-gray-400">Faulty</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{upcomingServices.length}</div>
            <div className="text-sm text-gray-400">Service Due</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{amcAlerts.length}</div>
            <div className="text-sm text-gray-400">Alerts</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 bg-card/50">
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="alerts">AMC Alerts</TabsTrigger>
          <TabsTrigger value="service">Service Records</TabsTrigger>
          <TabsTrigger value="add">Add New</TabsTrigger>
        </TabsList>

        {/* Assets Tab */}
        <TabsContent value="assets">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Assets ({assets.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="p-4 bg-background/20 rounded-lg border border-border"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{asset.asset_name}</h4>
                        <p className="text-sm text-gray-400">
                          {asset.asset_type} • {asset.location} • Floor {asset.floor}
                        </p>
                        {asset.brand && (
                          <p className="text-xs text-gray-500">
                            {asset.brand} {asset.model_number}
                          </p>
                        )}
                        {asset.next_service_due && (
                          <p className="text-xs text-yellow-400 mt-1">
                            Next Service: {format(new Date(asset.next_service_due), 'dd/MM/yyyy')}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge 
                          className={
                            asset.status === 'operational' ? 'bg-green-600' :
                            asset.status === 'faulty' ? 'bg-red-600' :
                            asset.status === 'under_maintenance' ? 'bg-yellow-600' :
                            'bg-gray-600'
                          }
                        >
                          {asset.status}
                        </Badge>
                        {asset.amc_vendor && (
                          <span className="text-xs text-gray-400">
                            AMC: {asset.amc_vendor}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AMC Alerts Tab */}
        <TabsContent value="alerts">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  AMC Alerts ({amcAlerts.length})
                </CardTitle>
                <Button
                  onClick={generateAmcAlerts}
                  size="sm"
                  className="bg-plaza-blue hover:bg-blue-700"
                >
                  Refresh Alerts
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {amcAlerts.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No active alerts</p>
                ) : (
                  amcAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-4 bg-background/20 rounded-lg border border-orange-500/20"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-white">
                            {alert.asset?.asset_name || 'Unknown Asset'}
                          </h4>
                          <p className="text-sm text-gray-400 capitalize">
                            {alert.alert_type.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-orange-400">
                            Due: {format(new Date(alert.due_date), 'dd/MM/yyyy')}
                          </p>
                        </div>
                        <Button
                          onClick={() => resolveAmcAlert(alert.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Records Tab */}
        <TabsContent value="service">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Service Records ({serviceRecords.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {serviceRecords.map((record) => (
                  <div
                    key={record.id}
                    className="p-4 bg-background/20 rounded-lg border border-border"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-white">
                          {record.asset?.asset_name}
                        </h4>
                        <p className="text-sm text-gray-400">
                          {record.service_type} • {format(new Date(record.service_date), 'dd/MM/yyyy')}
                        </p>
                        <p className="text-sm text-gray-300 mt-1">
                          {record.service_description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          By: {record.performed_by}
                        </p>
                      </div>
                      {record.cost && (
                        <div className="text-right">
                          <span className="text-lg font-medium text-white">
                            ₹{record.cost}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add New Tab */}
        <TabsContent value="add">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add Asset */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Asset
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Asset Name *</Label>
                    <Input
                      value={newAsset.asset_name}
                      onChange={(e) => setNewAsset({...newAsset, asset_name: e.target.value})}
                      className="bg-background/20"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Asset Type *</Label>
                    <Select value={newAsset.asset_type} onValueChange={(value) => setNewAsset({...newAsset, asset_type: value})}>
                      <SelectTrigger className="bg-background/20">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hvac">HVAC</SelectItem>
                        <SelectItem value="electrical">Electrical</SelectItem>
                        <SelectItem value="plumbing">Plumbing</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="fire_safety">Fire Safety</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-300">Location *</Label>
                    <Input
                      value={newAsset.location}
                      onChange={(e) => setNewAsset({...newAsset, location: e.target.value})}
                      className="bg-background/20"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Floor *</Label>
                    <Input
                      value={newAsset.floor}
                      onChange={(e) => setNewAsset({...newAsset, floor: e.target.value})}
                      className="bg-background/20"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Brand</Label>
                    <Input
                      value={newAsset.brand}
                      onChange={(e) => setNewAsset({...newAsset, brand: e.target.value})}
                      className="bg-background/20"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">AMC Vendor</Label>
                    <Input
                      value={newAsset.amc_vendor}
                      onChange={(e) => setNewAsset({...newAsset, amc_vendor: e.target.value})}
                      className="bg-background/20"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCreateAsset}
                  disabled={isLoading}
                  className="w-full bg-plaza-blue hover:bg-blue-700"
                >
                  Add Asset
                </Button>
              </CardContent>
            </Card>

            {/* Add Service Record */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Add Service Record
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-300">Asset *</Label>
                  <Select value={newServiceRecord.asset_id} onValueChange={(value) => setNewServiceRecord({...newServiceRecord, asset_id: value})}>
                    <SelectTrigger className="bg-background/20">
                      <SelectValue placeholder="Select asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {assets.map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {asset.asset_name} - {asset.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Service Type</Label>
                    <Select value={newServiceRecord.service_type} onValueChange={(value) => setNewServiceRecord({...newServiceRecord, service_type: value})}>
                      <SelectTrigger className="bg-background/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="routine">Routine</SelectItem>
                        <SelectItem value="breakdown">Breakdown</SelectItem>
                        <SelectItem value="installation">Installation</SelectItem>
                        <SelectItem value="warranty">Warranty</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-300">Service Date</Label>
                    <Input
                      type="date"
                      value={newServiceRecord.service_date}
                      onChange={(e) => setNewServiceRecord({...newServiceRecord, service_date: e.target.value})}
                      className="bg-background/20"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-gray-300">Performed By *</Label>
                  <Input
                    value={newServiceRecord.performed_by}
                    onChange={(e) => setNewServiceRecord({...newServiceRecord, performed_by: e.target.value})}
                    className="bg-background/20"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Service Description *</Label>
                  <Textarea
                    value={newServiceRecord.service_description}
                    onChange={(e) => setNewServiceRecord({...newServiceRecord, service_description: e.target.value})}
                    className="bg-background/20"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Cost (₹)</Label>
                  <Input
                    type="number"
                    value={newServiceRecord.cost}
                    onChange={(e) => setNewServiceRecord({...newServiceRecord, cost: parseFloat(e.target.value) || 0})}
                    className="bg-background/20"
                  />
                </div>
                <Button
                  onClick={handleCreateServiceRecord}
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Add Service Record
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};