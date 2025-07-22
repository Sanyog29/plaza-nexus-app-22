import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Package, TrendingDown, ShoppingCart, Bell, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface InventoryAlert {
  id: string;
  item_name: string;
  current_stock: number;
  low_stock_threshold: number;
  predicted_depletion: string;
  severity: 'critical' | 'warning' | 'info';
  auto_reorder_suggested: boolean;
  reorder_quantity: number;
}

interface SmartInventoryProps {
  vendorId: string;
}

const SmartInventory: React.FC<SmartInventoryProps> = ({ vendorId }) => {
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoReorderEnabled, setAutoReorderEnabled] = useState(false);

  useEffect(() => {
    fetchInventoryData();
  }, [vendorId]);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      
      // Fetch menu items with stock data
      const { data: itemsData, error: itemsError } = await supabase
        .from('vendor_menu_items')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('is_available', true);

      if (itemsError) throw itemsError;

      // Fetch recent order data for consumption analysis
      const { data: ordersData, error: ordersError } = await supabase
        .from('cafeteria_orders')
        .select(`
          order_items (
            item_id,
            quantity
          )
        `)
        .eq('vendor_id', vendorId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .eq('status', 'completed');

      if (ordersError) throw ordersError;

      setMenuItems(itemsData || []);
      
      // Generate smart inventory alerts
      const alerts = generateInventoryAlerts(itemsData || [], ordersData || []);
      setInventoryAlerts(alerts);
      
    } catch (error: any) {
      console.error('Error fetching inventory data:', error);
      toast({
        title: "Error fetching inventory data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateInventoryAlerts = (items: any[], orders: any[]): InventoryAlert[] => {
    const alerts: InventoryAlert[] = [];
    
    // Calculate consumption rates
    const consumptionRates = new Map();
    orders.forEach(order => {
      order.order_items?.forEach((item: any) => {
        const current = consumptionRates.get(item.item_id) || 0;
        consumptionRates.set(item.item_id, current + item.quantity);
      });
    });

    items.forEach(item => {
      const weeklyConsumption = consumptionRates.get(item.name) || 0;
      const dailyConsumption = weeklyConsumption / 7;
      const daysUntilDepletion = dailyConsumption > 0 ? Math.floor(item.stock_quantity / dailyConsumption) : 999;
      
      let severity: 'critical' | 'warning' | 'info' = 'info';
      
      if (item.stock_quantity <= 0) {
        severity = 'critical';
      } else if (item.stock_quantity <= item.low_stock_threshold) {
        severity = 'critical';
      } else if (daysUntilDepletion <= 2) {
        severity = 'critical';
      } else if (daysUntilDepletion <= 5) {
        severity = 'warning';
      }

      if (severity !== 'info') {
        const predictedDepletionDate = new Date();
        predictedDepletionDate.setDate(predictedDepletionDate.getDate() + daysUntilDepletion);
        
        alerts.push({
          id: item.id,
          item_name: item.name,
          current_stock: item.stock_quantity,
          low_stock_threshold: item.low_stock_threshold,
          predicted_depletion: predictedDepletionDate.toISOString(),
          severity,
          auto_reorder_suggested: severity === 'critical',
          reorder_quantity: Math.max(item.low_stock_threshold * 2, weeklyConsumption)
        });
      }
    });

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  };

  const handleReorder = async (alert: InventoryAlert) => {
    try {
      // Update stock quantity (simulate reorder)
      const { error } = await supabase
        .from('vendor_menu_items')
        .update({ 
          stock_quantity: alert.current_stock + alert.reorder_quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', alert.id);

      if (error) throw error;

      toast({
        title: "Reorder successful!",
        description: `Added ${alert.reorder_quantity} units to ${alert.item_name}`
      });

      // Remove alert from list
      setInventoryAlerts(prev => prev.filter(a => a.id !== alert.id));
      
    } catch (error: any) {
      console.error('Error processing reorder:', error);
      toast({
        title: "Error processing reorder",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'default';
      case 'info': return 'secondary';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return AlertTriangle;
      case 'warning': return TrendingDown;
      default: return Package;
    }
  };

  const getStockLevel = (current: number, threshold: number) => {
    if (current === 0) return 0;
    const maxStock = threshold * 3; // Assume max stock is 3x threshold
    return Math.min((current / maxStock) * 100, 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const criticalAlerts = inventoryAlerts.filter(a => a.severity === 'critical');
  const warningAlerts = inventoryAlerts.filter(a => a.severity === 'warning');

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{criticalAlerts.length}</p>
                <p className="text-sm text-muted-foreground">Critical Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{warningAlerts.length}</p>
                <p className="text-sm text-muted-foreground">Low Stock Warnings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{menuItems.length}</p>
                <p className="text-sm text-muted-foreground">Active Items</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {menuItems.filter(item => item.stock_quantity > item.low_stock_threshold).length}
                </p>
                <p className="text-sm text-muted-foreground">Well Stocked</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Critical Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {criticalAlerts.map(alert => {
              const IconComponent = getSeverityIcon(alert.severity);
              const daysUntilDepletion = Math.ceil(
                (new Date(alert.predicted_depletion).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg bg-red-50">
                  <div className="flex items-start space-x-3">
                    <IconComponent className="h-5 w-5 text-red-500 mt-0.5" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{alert.item_name}</h4>
                        <Badge variant={getSeverityColor(alert.severity) as any}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {alert.current_stock} units remaining
                        {daysUntilDepletion > 0 && ` • Depletes in ${daysUntilDepletion} days`}
                      </p>
                      <div className="w-48">
                        <Progress 
                          value={getStockLevel(alert.current_stock, alert.low_stock_threshold)} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {alert.auto_reorder_suggested && (
                      <Button
                        size="sm"
                        onClick={() => handleReorder(alert)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Auto Reorder ({alert.reorder_quantity})
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <Bell className="h-4 w-4 mr-1" />
                      Notify Supplier
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Warning Alerts */}
      {warningAlerts.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <TrendingDown className="h-5 w-5" />
              Low Stock Warnings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {warningAlerts.map(alert => {
              const IconComponent = getSeverityIcon(alert.severity);
              const daysUntilDepletion = Math.ceil(
                (new Date(alert.predicted_depletion).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-start space-x-3">
                    <IconComponent className="h-5 w-5 text-orange-500 mt-0.5" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{alert.item_name}</h4>
                        <Badge variant={getSeverityColor(alert.severity) as any}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {alert.current_stock} units remaining • Depletes in {daysUntilDepletion} days
                      </p>
                      <div className="w-48">
                        <Progress 
                          value={getStockLevel(alert.current_stock, alert.low_stock_threshold)} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReorder(alert)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Reorder ({alert.reorder_quantity})
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Auto-Reorder Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Smart Inventory Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Auto-Reorder</h4>
              <p className="text-sm text-muted-foreground">
                Automatically reorder items when they reach critical levels
              </p>
            </div>
            <Button
              variant={autoReorderEnabled ? "default" : "outline"}
              onClick={() => setAutoReorderEnabled(!autoReorderEnabled)}
            >
              {autoReorderEnabled ? "Enabled" : "Disabled"}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start">
              <Package className="h-4 w-4 mr-2" />
              Manage Suppliers
            </Button>
            <Button variant="outline" className="justify-start">
              <Bell className="h-4 w-4 mr-2" />
              Alert Preferences
            </Button>
            <Button variant="outline" className="justify-start">
              <TrendingDown className="h-4 w-4 mr-2" />
              Stock Thresholds
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartInventory;