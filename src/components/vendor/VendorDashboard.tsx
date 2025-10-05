import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AnimatedBackground } from '@/components/common/AnimatedBackground';
import { useStaggerAnimation } from '@/hooks/useScrollAnimation';
import { 
  Package,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  BarChart3,
  Calendar,
  MessageSquare,
  FileText,
  Settings,
  Truck,
  Star,
  MapPin
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

interface Order {
  id: string;
  orderNumber: string;
  customer: string;
  items: string[];
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered';
  total: number;
  orderDate: string;
  deliveryDate?: string;
  priority: 'standard' | 'urgent';
}

interface PaymentData {
  pendingAmount: number;
  thisMonthEarnings: number;
  lastPaymentDate: string;
  nextPaymentDate: string;
}

export function VendorDashboard() {
  const { user } = useAuth();
  const visibleStats = useStaggerAnimation(4, 120);
  const visibleOrders = useStaggerAnimation(2, 150);
  
  // Mock data
  const [orders] = useState<Order[]>([
    {
      id: '1',
      orderNumber: 'ORD-2024-001',
      customer: 'Building Management',
      items: ['Office Supplies', 'Cleaning Materials'],
      status: 'pending',
      total: 1250.00,
      orderDate: new Date().toISOString(),
      priority: 'urgent'
    },
    {
      id: '2',
      orderNumber: 'ORD-2024-002',
      customer: 'Tenant Services',
      items: ['Maintenance Parts'],
      status: 'preparing',
      total: 850.00,
      orderDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      priority: 'standard'
    }
  ]);

  const [paymentData] = useState<PaymentData>({
    pendingAmount: 2100.00,
    thisMonthEarnings: 15750.00,
    lastPaymentDate: '2024-01-15',
    nextPaymentDate: '2024-02-15'
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      case 'confirmed':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      case 'preparing':
        return 'bg-orange-500/20 text-orange-700 border-orange-500/30';
      case 'ready':
        return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'delivered':
        return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
    }
  };

  const quickStats = [
    {
      title: 'Pending Orders',
      value: orders.filter(o => o.status === 'pending').length.toString(),
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-500/10'
    },
    {
      title: 'This Month Revenue',
      value: `$${paymentData.thisMonthEarnings.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Customer Rating',
      value: '4.8',
      icon: Star,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Active Contracts',
      value: '3',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10'
    }
  ];

  return (
    <div className="relative space-y-6 p-4">
      <AnimatedBackground variant="vendor" />
      
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20 dashboard-card-animated backdrop-blur-sm shimmer-effect">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Vendor Portal</h1>
              <p className="text-muted-foreground">
                Welcome back, {user?.user_metadata?.first_name || 'Vendor'}
              </p>
            </div>
            <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
              <Package className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => (
          <Card 
            key={index}
            className={`hover-scale-lift stat-card-animated backdrop-blur-sm ${visibleStats.has(index) ? 'animate-stagger' : 'opacity-0'}`}
            style={{ animationDelay: `${index * 0.12}s` }}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="finances">Finances</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card className="dashboard-card-animated backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {orders.map((order, index) => (
                <div 
                  key={order.id} 
                  className={`border rounded-lg p-4 space-y-3 hover-scale-lift transition-all duration-300 ${visibleOrders.has(index) ? 'animate-slide-in-left' : 'opacity-0'}`}
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{order.orderNumber}</h3>
                      <p className="text-sm text-muted-foreground">{order.customer}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${order.total.toFixed(2)}</p>
                      {order.priority === 'urgent' && (
                        <Badge variant="destructive" className="text-xs">Urgent</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Items: </span>
                      {order.items.join(', ')}
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                    <Button size="sm">
                      <Truck className="h-4 w-4 mr-2" />
                      Update Status
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finances" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="dashboard-card-animated backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Pending Payment</span>
                    <span className="font-semibold">${paymentData.pendingAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">This Month</span>
                    <span className="font-semibold text-green-600">
                      ${paymentData.thisMonthEarnings.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Next Payment</span>
                    <span className="text-sm">{paymentData.nextPaymentDate}</span>
                  </div>
                </div>
                
                <Progress value={65} className="h-2" />
                <p className="text-xs text-muted-foreground">65% to next payment threshold</p>
              </CardContent>
            </Card>

            <Card className="dashboard-card-animated backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Order Completion</span>
                    <span className="font-semibold">94%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">On-Time Delivery</span>
                    <span className="font-semibold">96%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Customer Rating</span>
                    <span className="font-semibold">4.8/5</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Business Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Top Performing Category</h3>
                  <p className="text-2xl font-bold text-green-600">Office Supplies</p>
                  <p className="text-sm text-muted-foreground">45% of total revenue</p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Best Customer</h3>
                  <p className="text-2xl font-bold text-blue-600">Building Management</p>
                  <p className="text-sm text-muted-foreground">$8,500 this month</p>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Growth Opportunity
                </h3>
                <p className="text-sm text-muted-foreground">
                  Consider expanding your cleaning supplies inventory. Demand has increased 30% this quarter.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Support & Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Button variant="outline" className="h-16 flex-col">
                  <MessageSquare className="h-6 w-6 mb-2" />
                  Contact Support
                </Button>
                
                <Button variant="outline" className="h-16 flex-col">
                  <FileText className="h-6 w-6 mb-2" />
                  Documentation
                </Button>
                
                <Button variant="outline" className="h-16 flex-col">
                  <Calendar className="h-6 w-6 mb-2" />
                  Schedule Meeting
                </Button>
                
                <Button variant="outline" className="h-16 flex-col">
                  <Settings className="h-6 w-6 mb-2" />
                  Account Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}