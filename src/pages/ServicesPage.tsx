
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, DollarSign, Star, Wrench, Sparkles, Laptop, Heart, Shield, Briefcase } from 'lucide-react';

// Mock data for services until database is fully set up
const serviceCategories = [
  { id: '1', name: 'Maintenance', icon: Wrench, color: '#3B82F6', count: 12 },
  { id: '2', name: 'Cleaning', icon: Sparkles, color: '#10B981', count: 8 },
  { id: '3', name: 'IT Support', icon: Laptop, color: '#6366F1', count: 15 },
  { id: '4', name: 'Health & Wellness', icon: Heart, color: '#EC4899', count: 6 },
  { id: '5', name: 'Security', icon: Shield, color: '#F59E0B', count: 5 },
  { id: '6', name: 'Consulting', icon: Briefcase, color: '#8B5CF6', count: 10 },
];

const featuredServices = [
  {
    id: '1',
    name: 'Computer Repair',
    provider: 'TechFix Solutions',
    category: 'IT Support',
    price: 75,
    duration: 120,
    rating: 4.8,
    image: '/placeholder.svg',
    urgent: true,
  },
  {
    id: '2',
    name: 'Office Deep Clean',
    provider: 'CleanPro Services',
    category: 'Cleaning',
    price: 150,
    duration: 240,
    rating: 4.9,
    image: '/placeholder.svg',
  },
  {
    id: '3',
    name: 'Security Assessment',
    provider: 'SecureGuard',
    category: 'Security',
    price: 200,
    duration: 180,
    rating: 4.7,
    image: '/placeholder.svg',
  },
];

const recentBookings = [
  {
    id: '1',
    service: 'Software Installation',
    provider: 'TechFix Solutions',
    date: '2024-07-15',
    time: '10:00',
    status: 'confirmed',
  },
  {
    id: '2',
    service: 'Carpet Cleaning',
    provider: 'CleanPro Services',
    date: '2024-07-16',
    time: '14:00',
    status: 'pending',
  },
];

const ServicesPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Services Marketplace</h1>
          <p className="text-muted-foreground">Book professional services for your facility needs</p>
        </div>
        <Button>
          <Calendar className="mr-2 h-4 w-4" />
          View My Bookings
        </Button>
      </div>

      <Tabs defaultValue="catalog" className="space-y-6">
        <TabsList>
          <TabsTrigger value="catalog">Service Catalog</TabsTrigger>
          <TabsTrigger value="bookings">My Bookings</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">56</div>
                <p className="text-sm text-muted-foreground">Available Services</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">12</div>
                <p className="text-sm text-muted-foreground">Active Providers</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">4.8</div>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">24h</div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
              </CardContent>
            </Card>
          </div>

          {/* Service Categories */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Browse by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {serviceCategories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <Card 
                    key={category.id}
                    className="cursor-pointer transition-all hover:shadow-md group"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="flex justify-center mb-2">
                        <IconComponent 
                          className="h-8 w-8 group-hover:scale-110 transition-transform" 
                          style={{ color: category.color }}
                        />
                      </div>
                      <div className="font-medium text-sm">{category.name}</div>
                      <div className="text-xs text-muted-foreground">{category.count} services</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Featured Services */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Featured Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredServices.map((service) => (
                <Card key={service.id} className="group hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">{service.name}</CardTitle>
                          {service.urgent && (
                            <Badge variant="destructive" className="text-xs">
                              Urgent
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-sm">
                          {service.provider}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">{service.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{formatPrice(service.price)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDuration(service.duration)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span>{service.rating}</span>
                      </div>
                      <Button size="sm" className="group-hover:scale-105 transition-transform">
                        Book Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">My Service Bookings</h2>
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{booking.service}</div>
                        <div className="text-sm text-muted-foreground">{booking.provider}</div>
                        <div className="text-sm text-muted-foreground">
                          {booking.date} at {booking.time}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="providers" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Service Providers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  name: 'TechFix Solutions',
                  specialization: 'IT Support & Repair',
                  rating: 4.8,
                  completedJobs: 150,
                  responseTime: '2 hours',
                },
                {
                  name: 'CleanPro Services',
                  specialization: 'Professional Cleaning',
                  rating: 4.9,
                  completedJobs: 200,
                  responseTime: '4 hours',
                },
                {
                  name: 'SecureGuard',
                  specialization: 'Security Solutions',
                  rating: 4.7,
                  completedJobs: 85,
                  responseTime: '1 hour',
                },
              ].map((provider, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{provider.name}</CardTitle>
                    <CardDescription>{provider.specialization}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Rating:</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="font-medium">{provider.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Completed Jobs:</span>
                      <span className="font-medium">{provider.completedJobs}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Response Time:</span>
                      <span className="font-medium">{provider.responseTime}</span>
                    </div>
                    <Button className="w-full" variant="outline">
                      View Profile
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServicesPage;
