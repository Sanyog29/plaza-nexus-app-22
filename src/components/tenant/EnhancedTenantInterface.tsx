import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Home,
  Calendar,
  Wrench,
  CreditCard,
  Bell,
  MessageSquare,
  MapPin,
  Clock,
  Star,
  CheckCircle,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  User,
  Camera,
  FileText,
  Zap,
  Thermometer,
  Droplets,
  Wifi
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  category: 'maintenance' | 'cleaning' | 'security' | 'amenities';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'submitted' | 'assigned' | 'in_progress' | 'completed';
  submittedAt: string;
  completedAt?: string;
  assignedTo?: string;
  location: string;
  attachments?: string[];
}

interface Booking {
  id: string;
  facility: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  attendees: number;
  purpose: string;
}

export const EnhancedTenantInterface = () => {
  const { user } = useAuth();
  
  const [serviceRequests] = useState<ServiceRequest[]>([
    {
      id: '1',
      title: 'AC Not Working',
      description: 'Air conditioning unit in bedroom stopped working yesterday',
      category: 'maintenance',
      priority: 'high',
      status: 'assigned',
      submittedAt: '2024-01-20T10:30:00Z',
      assignedTo: 'Tech Team',
      location: 'Unit 4B - Bedroom'
    },
    {
      id: '2',
      title: 'Deep Cleaning Request',
      description: 'Need deep cleaning service for move-out preparation',
      category: 'cleaning',
      priority: 'medium',
      status: 'completed',
      submittedAt: '2024-01-18T14:15:00Z',
      completedAt: '2024-01-19T16:30:00Z',
      location: 'Unit 4B - All Rooms'
    }
  ]);

  const [bookings] = useState<Booking[]>([
    {
      id: '1',
      facility: 'Conference Room A',
      date: '2024-01-25',
      startTime: '14:00',
      endTime: '16:00',
      status: 'confirmed',
      attendees: 8,
      purpose: 'Team Meeting'
    },
    {
      id: '2',
      facility: 'Gym',
      date: '2024-01-26',
      startTime: '07:00',
      endTime: '08:00',
      status: 'pending',
      attendees: 1,
      purpose: 'Personal Workout'
    }
  ]);

  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    location: ''
  });

  const [newBooking, setNewBooking] = useState({
    facility: '',
    date: '',
    startTime: '',
    endTime: '',
    attendees: 1,
    purpose: ''
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'maintenance':
        return Wrench;
      case 'cleaning':
        return Star;
      case 'security':
        return MapPin;
      case 'amenities':
        return Home;
      default:
        return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      case 'assigned':
        return 'bg-orange-500/20 text-orange-700 border-orange-500/30';
      case 'submitted':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      case 'confirmed':
        return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
      case 'cancelled':
        return 'bg-red-500/20 text-red-700 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/20 text-red-700 border-red-500/30';
      case 'high':
        return 'bg-orange-500/20 text-orange-700 border-orange-500/30';
      case 'medium':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      case 'low':
        return 'bg-green-500/20 text-green-700 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
    }
  };

  const smartAmenities = [
    { name: 'Climate Control', icon: Thermometer, status: 'online', value: '22°C' },
    { name: 'Smart Lighting', icon: Zap, status: 'online', value: '75%' },
    { name: 'Water System', icon: Droplets, status: 'online', value: 'Normal' },
    { name: 'WiFi Network', icon: Wifi, status: 'online', value: '100 Mbps' }
  ];

  const submitServiceRequest = () => {
    // Implementation for submitting service request
    console.log('Submitting service request:', newRequest);
    setNewRequest({ title: '', description: '', category: '', priority: 'medium', location: '' });
  };

  const submitBooking = () => {
    // Implementation for submitting booking
    console.log('Submitting booking:', newBooking);
    setNewBooking({ facility: '', date: '', startTime: '', endTime: '', attendees: 1, purpose: '' });
  };

  return (
    <div className="space-y-6">
      {/* Smart Home Control Panel */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Smart Home Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {smartAmenities.map((amenity, index) => (
              <div key={index} className="p-3 border rounded-lg text-center">
                <amenity.icon className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <h4 className="font-medium text-sm">{amenity.name}</h4>
                <p className="text-lg font-bold text-blue-600">{amenity.value}</p>
                <Badge variant="outline" className="text-xs">
                  {amenity.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Interface Tabs */}
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="booking">Booking</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="communication">Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Service request completed</span>
                  <span className="text-muted-foreground ml-auto">2 hours ago</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span>Booking confirmed: Conference Room A</span>
                  <span className="text-muted-foreground ml-auto">1 day ago</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                  <span>Rent payment processed</span>
                  <span className="text-muted-foreground ml-auto">3 days ago</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-orange-500" />
                  Important Notices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <h4 className="font-medium text-sm">Building Maintenance</h4>
                  <p className="text-xs text-muted-foreground">
                    Elevator maintenance scheduled for tomorrow 9-11 AM
                  </p>
                </div>
                <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
                  <h4 className="font-medium text-sm">New Amenity Available</h4>
                  <p className="text-xs text-muted-foreground">
                    Rooftop garden now open for tenant use
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          {/* Submit New Request */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Submit New Request
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  placeholder="Request title"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                />
                <Select
                  value={newRequest.category}
                  onValueChange={(value) => setNewRequest(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="amenities">Amenities</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Textarea
                placeholder="Describe your request in detail..."
                value={newRequest.description}
                onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
              />
              
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  placeholder="Location (e.g., Unit 4B - Kitchen)"
                  value={newRequest.location}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, location: e.target.value }))}
                />
                <Select
                  value={newRequest.priority}
                  onValueChange={(value) => setNewRequest(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline">
                  <Camera className="h-4 w-4 mr-2" />
                  Add Photo
                </Button>
                <Button onClick={submitServiceRequest}>
                  <FileText className="h-4 w-4 mr-2" />
                  Submit Request
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Existing Requests */}
          <Card>
            <CardHeader>
              <CardTitle>Your Service Requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {serviceRequests.map((request) => {
                const CategoryIcon = getCategoryIcon(request.category);
                return (
                  <div key={request.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <CategoryIcon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h3 className="font-medium">{request.title}</h3>
                          <p className="text-sm text-muted-foreground">{request.description}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getPriorityColor(request.priority)}>
                          {request.priority}
                        </Badge>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {request.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(request.submittedAt).toLocaleDateString()}
                      </div>
                      {request.assignedTo && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {request.assignedTo}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="booking" className="space-y-6">
          {/* New Booking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Book Facility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Select
                  value={newBooking.facility}
                  onValueChange={(value) => setNewBooking(prev => ({ ...prev, facility: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select facility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conference-a">Conference Room A</SelectItem>
                    <SelectItem value="conference-b">Conference Room B</SelectItem>
                    <SelectItem value="gym">Gym</SelectItem>
                    <SelectItem value="pool">Swimming Pool</SelectItem>
                    <SelectItem value="rooftop">Rooftop Garden</SelectItem>
                  </SelectContent>
                </Select>
                
                <Input
                  type="date"
                  value={newBooking.date}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              
              <div className="grid gap-4 md:grid-cols-3">
                <Input
                  type="time"
                  placeholder="Start time"
                  value={newBooking.startTime}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, startTime: e.target.value }))}
                />
                <Input
                  type="time"
                  placeholder="End time"
                  value={newBooking.endTime}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, endTime: e.target.value }))}
                />
                <Input
                  type="number"
                  placeholder="Attendees"
                  value={newBooking.attendees}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, attendees: parseInt(e.target.value) }))}
                />
              </div>
              
              <Input
                placeholder="Purpose of booking"
                value={newBooking.purpose}
                onChange={(e) => setNewBooking(prev => ({ ...prev, purpose: e.target.value }))}
              />
              
              <Button onClick={submitBooking}>
                <Calendar className="h-4 w-4 mr-2" />
                Submit Booking Request
              </Button>
            </CardContent>
          </Card>

          {/* Existing Bookings */}
          <Card>
            <CardHeader>
              <CardTitle>Your Bookings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{booking.facility}</h3>
                      <p className="text-sm text-muted-foreground">{booking.purpose}</p>
                    </div>
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {booking.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {booking.startTime} - {booking.endTime}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {booking.attendees} attendee{booking.attendees > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Billing & Payments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg text-center">
                  <h3 className="font-semibold text-green-600">Current Balance</h3>
                  <p className="text-2xl font-bold">$0.00</p>
                  <p className="text-sm text-muted-foreground">All paid up!</p>
                </div>
                
                <div className="p-4 border rounded-lg text-center">
                  <h3 className="font-semibold">Next Payment</h3>
                  <p className="text-2xl font-bold">$2,500</p>
                  <p className="text-sm text-muted-foreground">Due Feb 1, 2024</p>
                </div>
                
                <div className="p-4 border rounded-lg text-center">
                  <h3 className="font-semibold">Payment Method</h3>
                  <p className="text-lg font-medium">Auto-Pay</p>
                  <p className="text-sm text-muted-foreground">**** 1234</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Recent Transactions</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 border rounded">
                    <span>Monthly Rent - January 2024</span>
                    <span className="font-medium text-green-600">-$2,500</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <span>Utilities - December 2023</span>
                    <span className="font-medium text-green-600">-$150</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Communication Center
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Button variant="outline" className="h-16 flex-col">
                  <MessageSquare className="h-6 w-6 mb-2" />
                  Live Chat Support
                </Button>
                
                <Button variant="outline" className="h-16 flex-col">
                  <Phone className="h-6 w-6 mb-2" />
                  Emergency Contact
                </Button>
                
                <Button variant="outline" className="h-16 flex-col">
                  <Mail className="h-6 w-6 mb-2" />
                  Email Management
                </Button>
                
                <Button variant="outline" className="h-16 flex-col">
                  <Bell className="h-6 w-6 mb-2" />
                  Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
