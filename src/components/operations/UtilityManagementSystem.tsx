import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUtilityManagement } from '@/hooks/useUtilityManagement';
import { Plus, Zap, Droplets, Flame, Wifi, Wind, Trash2, Camera, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const utilityIcons = {
  electricity: Zap,
  water: Droplets,
  gas: Flame,
  internet: Wifi,
  hvac: Wind,
  waste_management: Trash2
};

export const UtilityManagementSystem: React.FC = () => {
  const {
    meters,
    readings,
    costCenters,
    isLoading,
    createMeter,
    createReading,
    updateMeter,
    getConsumptionByType,
    getCostByType,
    getMetersByType,
    getUpcomingContracts
  } = useUtilityManagement();

  const [showMeterDialog, setShowMeterDialog] = useState(false);
  const [showReadingDialog, setShowReadingDialog] = useState(false);
  const [newMeter, setNewMeter] = useState({
    meter_number: '',
    utility_type: '',
    location: '',
    floor: '',
    zone: '',
    unit_of_measurement: '',
    supplier_name: '',
    monthly_budget: ''
  });
  const [newReading, setNewReading] = useState({
    meter_id: '',
    reading_date: new Date().toISOString().split('T')[0],
    reading_value: '',
    cost_per_unit: '',
    reading_method: 'manual',
    notes: ''
  });

  const handleCreateMeter = async () => {
    if (!newMeter.meter_number || !newMeter.utility_type || !newMeter.location || !newMeter.floor || !newMeter.unit_of_measurement) {
      toast.error('Please fill in all required fields');
      return;
    }

    const meterData = {
      ...newMeter,
      meter_status: 'active',
      monthly_budget: newMeter.monthly_budget ? parseFloat(newMeter.monthly_budget) : undefined
    };

    const success = await createMeter(meterData);
    if (success) {
      setShowMeterDialog(false);
      setNewMeter({
        meter_number: '',
        utility_type: '',
        location: '',
        floor: '',
        zone: '',
        unit_of_measurement: '',
        supplier_name: '',
        monthly_budget: ''
      });
    }
  };

  const handleCreateReading = async () => {
    if (!newReading.meter_id || !newReading.reading_date || !newReading.reading_value) {
      toast.error('Please fill in all required fields');
      return;
    }

    const readingData = {
      ...newReading,
      reading_value: parseFloat(newReading.reading_value),
      cost_per_unit: newReading.cost_per_unit ? parseFloat(newReading.cost_per_unit) : undefined
    };

    const success = await createReading(readingData);
    if (success) {
      setShowReadingDialog(false);
      setNewReading({
        meter_id: '',
        reading_date: new Date().toISOString().split('T')[0],
        reading_value: '',
        cost_per_unit: '',
        reading_method: 'manual',
        notes: ''
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-500';
      case 'inactive': return 'bg-gray-500/10 text-gray-500';
      case 'maintenance': return 'bg-yellow-500/10 text-yellow-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const upcomingContracts = getUpcomingContracts(30);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Meters</p>
                <p className="text-2xl font-bold text-foreground">{meters.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Cost</p>
                <p className="text-2xl font-bold text-foreground">
                  ₹{getCostByType('electricity', 30).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Readings</p>
                <p className="text-2xl font-bold text-foreground">{readings.length}</p>
              </div>
              <Camera className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contract Renewals</p>
                <p className="text-2xl font-bold text-foreground">{upcomingContracts.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="meters" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-card/50">
            <TabsTrigger value="meters">Utility Meters</TabsTrigger>
            <TabsTrigger value="readings">Readings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Dialog open={showMeterDialog} onOpenChange={setShowMeterDialog}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Meter
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Add New Utility Meter</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="meter_number" className="text-foreground">Meter Number</Label>
                      <Input
                        id="meter_number"
                        value={newMeter.meter_number}
                        onChange={(e) => setNewMeter({...newMeter, meter_number: e.target.value})}
                        className="bg-background border-border text-foreground"
                      />
                    </div>
                    <div>
                      <Label htmlFor="utility_type" className="text-foreground">Utility Type</Label>
                      <Select value={newMeter.utility_type} onValueChange={(value) => setNewMeter({...newMeter, utility_type: value})}>
                        <SelectTrigger className="bg-background border-border text-foreground">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="electricity">Electricity</SelectItem>
                          <SelectItem value="water">Water</SelectItem>
                          <SelectItem value="gas">Gas</SelectItem>
                          <SelectItem value="internet">Internet</SelectItem>
                          <SelectItem value="hvac">HVAC</SelectItem>
                          <SelectItem value="waste_management">Waste Management</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location" className="text-foreground">Location</Label>
                      <Input
                        id="location"
                        value={newMeter.location}
                        onChange={(e) => setNewMeter({...newMeter, location: e.target.value})}
                        className="bg-background border-border text-foreground"
                      />
                    </div>
                    <div>
                      <Label htmlFor="floor" className="text-foreground">Floor</Label>
                      <Input
                        id="floor"
                        value={newMeter.floor}
                        onChange={(e) => setNewMeter({...newMeter, floor: e.target.value})}
                        className="bg-background border-border text-foreground"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="unit_of_measurement" className="text-foreground">Unit of Measurement</Label>
                      <Input
                        id="unit_of_measurement"
                        value={newMeter.unit_of_measurement}
                        onChange={(e) => setNewMeter({...newMeter, unit_of_measurement: e.target.value})}
                        placeholder="e.g., kWh, liters"
                        className="bg-background border-border text-foreground"
                      />
                    </div>
                    <div>
                      <Label htmlFor="supplier_name" className="text-foreground">Supplier</Label>
                      <Input
                        id="supplier_name"
                        value={newMeter.supplier_name}
                        onChange={(e) => setNewMeter({...newMeter, supplier_name: e.target.value})}
                        className="bg-background border-border text-foreground"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="monthly_budget" className="text-foreground">Monthly Budget (₹)</Label>
                    <Input
                      id="monthly_budget"
                      type="number"
                      value={newMeter.monthly_budget}
                      onChange={(e) => setNewMeter({...newMeter, monthly_budget: e.target.value})}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowMeterDialog(false)}>Cancel</Button>
                  <Button onClick={handleCreateMeter} disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Meter'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showReadingDialog} onOpenChange={setShowReadingDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-border text-foreground hover:bg-accent">
                  <Camera className="h-4 w-4 mr-2" />
                  Record Reading
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Record Utility Reading</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="meter_select" className="text-foreground">Select Meter</Label>
                    <Select value={newReading.meter_id} onValueChange={(value) => setNewReading({...newReading, meter_id: value})}>
                      <SelectTrigger className="bg-background border-border text-foreground">
                        <SelectValue placeholder="Select meter" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {meters.map((meter) => {
                          const Icon = utilityIcons[meter.utility_type as keyof typeof utilityIcons];
                          return (
                            <SelectItem key={meter.id} value={meter.id}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {meter.meter_number} - {meter.location}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="reading_date" className="text-foreground">Reading Date</Label>
                      <Input
                        id="reading_date"
                        type="date"
                        value={newReading.reading_date}
                        onChange={(e) => setNewReading({...newReading, reading_date: e.target.value})}
                        className="bg-background border-border text-foreground"
                      />
                    </div>
                    <div>
                      <Label htmlFor="reading_value" className="text-foreground">Reading Value</Label>
                      <Input
                        id="reading_value"
                        type="number"
                        step="0.01"
                        value={newReading.reading_value}
                        onChange={(e) => setNewReading({...newReading, reading_value: e.target.value})}
                        className="bg-background border-border text-foreground"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="cost_per_unit" className="text-foreground">Cost per Unit (₹)</Label>
                    <Input
                      id="cost_per_unit"
                      type="number"
                      step="0.0001"
                      value={newReading.cost_per_unit}
                      onChange={(e) => setNewReading({...newReading, cost_per_unit: e.target.value})}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowReadingDialog(false)}>Cancel</Button>
                  <Button onClick={handleCreateReading} disabled={isLoading}>
                    {isLoading ? 'Recording...' : 'Record Reading'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value="meters">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-foreground">Utility Meters</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-foreground">Meter</TableHead>
                    <TableHead className="text-foreground">Type</TableHead>
                    <TableHead className="text-foreground">Location</TableHead>
                    <TableHead className="text-foreground">Status</TableHead>
                    <TableHead className="text-foreground">Last Reading</TableHead>
                    <TableHead className="text-foreground">Supplier</TableHead>
                    <TableHead className="text-foreground">Budget</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meters.map((meter) => {
                    const Icon = utilityIcons[meter.utility_type as keyof typeof utilityIcons];
                    return (
                      <TableRow key={meter.id} className="border-border">
                        <TableCell className="text-foreground">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {meter.meter_number}
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground capitalize">{meter.utility_type}</TableCell>
                        <TableCell className="text-foreground">{meter.location} - {meter.floor}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(meter.meter_status)}>
                            {meter.meter_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-foreground">
                          {meter.last_reading_date ? (
                            <div>
                              <div>{meter.last_reading_value} {meter.unit_of_measurement}</div>
                              <div className="text-xs text-muted-foreground">{meter.last_reading_date}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No readings</span>
                          )}
                        </TableCell>
                        <TableCell className="text-foreground">{meter.supplier_name || '-'}</TableCell>
                        <TableCell className="text-foreground">
                          {meter.monthly_budget ? `₹${meter.monthly_budget.toLocaleString()}` : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="readings">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-foreground">Recent Readings</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-foreground">Meter</TableHead>
                    <TableHead className="text-foreground">Date</TableHead>
                    <TableHead className="text-foreground">Reading</TableHead>
                    <TableHead className="text-foreground">Consumption</TableHead>
                    <TableHead className="text-foreground">Cost</TableHead>
                    <TableHead className="text-foreground">Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readings.map((reading) => {
                    const Icon = utilityIcons[reading.meter?.utility_type as keyof typeof utilityIcons];
                    return (
                      <TableRow key={reading.id} className="border-border">
                        <TableCell className="text-foreground">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <div>
                              <div>{reading.meter?.meter_number}</div>
                              <div className="text-xs text-muted-foreground">{reading.meter?.location}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-foreground">{reading.reading_date}</TableCell>
                        <TableCell className="text-foreground">
                          {reading.reading_value} {reading.meter?.unit_of_measurement}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {reading.consumption !== null ? `${reading.consumption} ${reading.meter?.unit_of_measurement}` : '-'}
                        </TableCell>
                        <TableCell className="text-foreground">
                          {reading.total_cost ? `₹${reading.total_cost.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-border text-foreground">
                            {reading.reading_method}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-foreground">Consumption by Type (30 days)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.keys(utilityIcons).map((type) => {
                  const Icon = utilityIcons[type as keyof typeof utilityIcons];
                  const consumption = getConsumptionByType(type, 30);
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="text-foreground capitalize">{type.replace('_', ' ')}</span>
                      </div>
                      <span className="text-foreground font-semibold">{consumption.toFixed(2)}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-foreground">Cost by Type (30 days)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.keys(utilityIcons).map((type) => {
                  const Icon = utilityIcons[type as keyof typeof utilityIcons];
                  const cost = getCostByType(type, 30);
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="text-foreground capitalize">{type.replace('_', ' ')}</span>
                      </div>
                      <span className="text-foreground font-semibold">₹{cost.toFixed(2)}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};