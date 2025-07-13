import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Zap, Droplets, Flame, TrendingUp, Plus, Calendar, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Meter {
  id: string;
  meter_id: string;
  meter_type: string;
  location: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Reading {
  id: string;
  meter_id: string;
  reading_date: string;
  reading_value: number;
  consumption?: number;
  cost_per_unit?: number;
  total_cost?: number;
  reading_method: string;
  notes?: string;
  photo_url?: string;
  recorded_by?: string;
  created_at: string;
  updated_at: string;
  meter: {
    meter_id: string;
    meter_type: string;
    location: string;
  };
}

export const UtilityManagement = () => {
  const [meters, setMeters] = useState<any[]>([]);
  const [readings, setReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddReadingOpen, setIsAddReadingOpen] = useState(false);
  const [selectedMeter, setSelectedMeter] = useState<string>("");
  const [newReading, setNewReading] = useState({
    reading_value: "",
    cost_per_unit: "",
    notes: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchMeters();
    fetchReadings();
  }, []);

  const fetchMeters = async () => {
    try {
      const { data, error } = await supabase
        .from('utility_meters')
        .select('*')
        .eq('is_active', true)
        .order('meter_type', { ascending: true });

      if (error) throw error;
      setMeters(data as any || []);
    } catch (error) {
      console.error('Error fetching meters:', error);
      toast({
        title: "Error",
        description: "Failed to fetch utility meters",
        variant: "destructive",
      });
    }
  };

  const fetchReadings = async () => {
    try {
      const { data, error } = await supabase
        .from('utility_readings')
        .select(`
          *,
          meter:utility_meters!inner(meter_id, meter_type, location)
        `)
        .order('reading_date', { ascending: false })
        .limit(100);

      if (error) throw error;
      setReadings((data as any) || []);
    } catch (error) {
      console.error('Error fetching readings:', error);
    } finally {
      setLoading(false);
    }
  };

  const addReading = async () => {
    try {
      const { error } = await supabase
        .from('utility_readings')
        .insert({
          meter_id: selectedMeter,
          reading_date: new Date().toISOString().split('T')[0],
          reading_value: parseFloat(newReading.reading_value),
          cost_per_unit: newReading.cost_per_unit ? parseFloat(newReading.cost_per_unit) : null,
          notes: newReading.notes || null,
          reading_method: 'manual'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Reading added successfully",
      });

      setIsAddReadingOpen(false);
      setNewReading({ reading_value: "", cost_per_unit: "", notes: "" });
      setSelectedMeter("");
      fetchReadings();
    } catch (error) {
      console.error('Error adding reading:', error);
      toast({
        title: "Error",
        description: "Failed to add reading",
        variant: "destructive",
      });
    }
  };

  const getUtilityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'electricity':
        return <Zap className="h-4 w-4" />;
      case 'water':
        return <Droplets className="h-4 w-4" />;
      case 'gas':
        return <Flame className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getUtilityColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'electricity':
        return 'bg-yellow-500';
      case 'water':
        return 'bg-blue-500';
      case 'gas':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Calculate consumption trends for charts
  const getConsumptionData = (meterType: string) => {
    return readings
      .filter(r => r.meter.meter_type === meterType)
      .slice(0, 12)
      .reverse()
      .map(r => ({
        date: format(new Date(r.reading_date), 'MMM dd'),
        consumption: r.consumption || 0,
        cost: r.total_cost || 0
      }));
  };

  const electricityData = getConsumptionData('electricity');
  const waterData = getConsumptionData('water');
  const gasData = getConsumptionData('gas');

  // Calculate totals
  const totalElectricityCost = readings
    .filter(r => r.meter.meter_type === 'electricity')
    .reduce((sum, r) => sum + (r.total_cost || 0), 0);

  const totalWaterCost = readings
    .filter(r => r.meter.meter_type === 'water')
    .reduce((sum, r) => sum + (r.total_cost || 0), 0);

  const totalGasCost = readings
    .filter(r => r.meter.meter_type === 'gas')
    .reduce((sum, r) => sum + (r.total_cost || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading utility data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Utility Management</h2>
          <p className="text-muted-foreground">Monitor utility consumption and manage meter readings</p>
        </div>
        <Dialog open={isAddReadingOpen} onOpenChange={setIsAddReadingOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Reading
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Meter Reading</DialogTitle>
              <DialogDescription>
                Enter the latest meter reading for accurate consumption tracking
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="meter">Select Meter</Label>
                <select
                  id="meter"
                  value={selectedMeter}
                  onChange={(e) => setSelectedMeter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Choose a meter</option>
                  {meters.map(meter => (
                    <option key={meter.id} value={meter.id}>
                      {meter.meter_id} - {meter.meter_type} ({meter.location})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="reading_value">Reading Value</Label>
                <Input
                  id="reading_value"
                  type="number"
                  step="0.01"
                  placeholder="Enter meter reading"
                  value={newReading.reading_value}
                  onChange={(e) => setNewReading(prev => ({ ...prev, reading_value: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="cost_per_unit">Cost per Unit (optional)</Label>
                <Input
                  id="cost_per_unit"
                  type="number"
                  step="0.0001"
                  placeholder="Enter cost per unit"
                  value={newReading.cost_per_unit}
                  onChange={(e) => setNewReading(prev => ({ ...prev, cost_per_unit: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  placeholder="Any additional notes"
                  value={newReading.notes}
                  onChange={(e) => setNewReading(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              <Button onClick={addReading} className="w-full" disabled={!selectedMeter || !newReading.reading_value}>
                Add Reading
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Utility Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Electricity</CardTitle>
            <div className={`p-2 rounded-full ${getUtilityColor('electricity')}`}>
              <Zap className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalElectricityCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {meters.filter(m => m.meter_type === 'electricity').length} meters
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Water</CardTitle>
            <div className={`p-2 rounded-full ${getUtilityColor('water')}`}>
              <Droplets className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalWaterCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {meters.filter(m => m.meter_type === 'water').length} meters
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gas</CardTitle>
            <div className={`p-2 rounded-full ${getUtilityColor('gas')}`}>
              <Flame className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalGasCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {meters.filter(m => m.meter_type === 'gas').length} meters
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="meters">Meters</TabsTrigger>
          <TabsTrigger value="readings">Recent Readings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Consumption Charts */}
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Electricity Consumption
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={electricityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="consumption" stroke="#eab308" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-blue-500" />
                  Water Consumption
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={waterData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="consumption" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Cost Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Cost Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { utility: 'Electricity', cost: totalElectricityCost },
                  { utility: 'Water', cost: totalWaterCost },
                  { utility: 'Gas', cost: totalGasCost }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="utility" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${value}`, 'Cost']} />
                  <Bar dataKey="cost" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meters" className="space-y-4">
          <div className="grid gap-4">
            {meters.map((meter) => (
              <Card key={meter.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${getUtilityColor(meter.meter_type)}`}>
                        {getUtilityIcon(meter.meter_type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{meter.meter_id}</CardTitle>
                        <CardDescription>{meter.location}</CardDescription>
                      </div>
                    </div>
                     <div className="text-right">
                       <p className="text-sm font-medium capitalize">{meter.meter_type}</p>
                       <p className="text-xs text-muted-foreground">Active meter</p>
                     </div>
                   </div>
                 </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="readings" className="space-y-4">
          <div className="grid gap-4">
            {readings.slice(0, 20).map((reading) => (
              <Card key={reading.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${getUtilityColor(reading.meter.meter_type)}`}>
                        {getUtilityIcon(reading.meter.meter_type)}
                      </div>
                      <div>
                        <p className="font-medium">{reading.meter.meter_id}</p>
                        <p className="text-sm text-muted-foreground">{reading.meter.location}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{reading.reading_value.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(reading.reading_date), 'MMM dd, yyyy')}
                      </p>
                      {reading.consumption && (
                        <p className="text-xs text-green-600">
                          Consumption: {reading.consumption.toLocaleString()}
                        </p>
                      )}
                      {reading.total_cost && (
                        <p className="text-xs font-medium">₹{reading.total_cost.toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {readings.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No readings recorded yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};