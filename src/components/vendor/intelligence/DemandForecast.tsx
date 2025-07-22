import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Brain, Calendar, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DemandForecastProps {
  vendorId: string;
}

const DemandForecast: React.FC<DemandForecastProps> = ({ vendorId }) => {
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateForecast();
  }, [vendorId, timeframe]);

  const generateForecast = async () => {
    try {
      setLoading(true);
      
      // Fetch historical data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30); // Last 30 days of data

      const { data: ordersData, error } = await supabase
        .from('cafeteria_orders')
        .select(`
          id,
          total_amount,
          created_at,
          order_items (
            quantity,
            item_id
          )
        `)
        .eq('vendor_id', vendorId)
        .gte('created_at', startDate.toISOString())
        .eq('status', 'completed');

      if (error) throw error;

      // Generate forecast based on historical trends
      const forecast = generateDemandForecast(ordersData || []);
      const businessInsights = generateInsights(ordersData || []);
      
      setForecastData(forecast);
      setInsights(businessInsights);
    } catch (error: any) {
      console.error('Error generating forecast:', error);
      toast({
        title: "Error generating forecast",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateDemandForecast = (orders: any[]) => {
    // Simple moving average with trend analysis
    const dailyData = groupOrdersByDay(orders);
    const forecast = [];
    
    // Generate next 7 days forecast
    for (let i = 1; i <= 7; i++) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i);
      
      // Calculate trend based on last 7 days vs previous 7 days
      const recent = dailyData.slice(-7);
      const previous = dailyData.slice(-14, -7);
      
      const recentAvg = recent.reduce((sum, day) => sum + day.orders, 0) / recent.length;
      const previousAvg = previous.reduce((sum, day) => sum + day.orders, 0) / previous.length;
      const growthRate = previous.length > 0 ? (recentAvg - previousAvg) / previousAvg : 0;
      
      // Apply seasonality (weekend boost)
      const dayOfWeek = futureDate.getDay();
      const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.2 : 1.0;
      
      const predictedOrders = Math.max(0, Math.round(recentAvg * (1 + growthRate) * weekendMultiplier));
      const predictedRevenue = predictedOrders * 25; // Average order value
      
      forecast.push({
        date: futureDate.toISOString().split('T')[0],
        predicted_orders: predictedOrders,
        predicted_revenue: predictedRevenue,
        confidence: Math.max(0.6, 0.9 - (i * 0.05)), // Decreasing confidence over time
        type: 'forecast'
      });
    }
    
    // Add historical data for comparison
    const historical = dailyData.slice(-7).map(day => ({
      ...day,
      type: 'historical'
    }));
    
    return [...historical, ...forecast];
  };

  const groupOrdersByDay = (orders: any[]) => {
    const dailyMap = new Map();
    
    orders.forEach(order => {
      const date = order.created_at.split('T')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { date, orders: 0, revenue: 0 });
      }
      const day = dailyMap.get(date);
      day.orders += 1;
      day.revenue += order.total_amount;
    });
    
    return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  };

  const generateInsights = (orders: any[]) => {
    const insights = [];
    
    // Peak hour analysis
    const hourlyOrders = new Map();
    orders.forEach(order => {
      const hour = new Date(order.created_at).getHours();
      hourlyOrders.set(hour, (hourlyOrders.get(hour) || 0) + 1);
    });
    
    const peakHour = Array.from(hourlyOrders.entries())
      .sort((a, b) => b[1] - a[1])[0];
    
    if (peakHour) {
      insights.push({
        type: 'peak_hours',
        title: 'Peak Order Time',
        message: `Your busiest hour is ${peakHour[0]}:00 with ${peakHour[1]} orders`,
        recommendation: 'Consider staff scheduling and inventory preparation',
        priority: 'medium',
        icon: TrendingUp
      });
    }
    
    // Growth trend
    const recentWeek = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return orderDate >= weekAgo;
    });
    
    const previousWeek = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return orderDate >= twoWeeksAgo && orderDate < weekAgo;
    });
    
    const growth = ((recentWeek.length - previousWeek.length) / (previousWeek.length || 1)) * 100;
    
    insights.push({
      type: 'growth',
      title: 'Weekly Growth',
      message: `${growth > 0 ? '+' : ''}${growth.toFixed(1)}% order growth vs last week`,
      recommendation: growth > 10 ? 'Consider expanding capacity' : growth < -10 ? 'Review pricing and promotions' : 'Maintain current strategy',
      priority: Math.abs(growth) > 15 ? 'high' : 'low',
      icon: growth > 0 ? TrendingUp : TrendingDown
    });
    
    // Popular items analysis
    const itemCounts = new Map();
    orders.forEach(order => {
      order.order_items?.forEach((item: any) => {
        itemCounts.set(item.item_id, (itemCounts.get(item.item_id) || 0) + item.quantity);
      });
    });
    
    const topItem = Array.from(itemCounts.entries())
      .sort((a, b) => b[1] - a[1])[0];
    
    if (topItem) {
      insights.push({
        type: 'popular_items',
        title: 'Best Seller',
        message: `${topItem[0]} is your top seller with ${topItem[1]} orders`,
        recommendation: 'Ensure adequate stock and consider promoting similar items',
        priority: 'medium',
        icon: Target
      });
    }
    
    return insights;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
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
                  <div className="h-32 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">AI-Powered Demand Forecast</h3>
        </div>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 Days</SelectItem>
            <SelectItem value="14d">14 Days</SelectItem>
            <SelectItem value="30d">30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Order Volume Prediction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  formatter={(value, name) => [
                    value,
                    name === 'predicted_orders' ? 'Predicted Orders' : 'Orders'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                  connectNulls={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="predicted_orders" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: 'hsl(var(--primary))', strokeDasharray: 'none' }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Business Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Business Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.map((insight, index) => {
            const IconComponent = insight.icon;
            return (
              <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg">
                <div className="flex-shrink-0">
                  <IconComponent className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{insight.title}</h4>
                    <Badge variant={getPriorityColor(insight.priority) as any}>
                      {insight.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{insight.message}</p>
                  <p className="text-sm font-medium text-primary">{insight.recommendation}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Review Inventory
            </Button>
            <Button variant="outline" className="justify-start">
              <TrendingUp className="h-4 w-4 mr-2" />
              Optimize Pricing
            </Button>
            <Button variant="outline" className="justify-start">
              <Target className="h-4 w-4 mr-2" />
              Plan Promotions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DemandForecast;