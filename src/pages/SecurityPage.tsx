
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, User, Users, Car, QrCode, UserCheck, HardDrive } from 'lucide-react';
import VisitorForm from '@/components/security/VisitorForm';
import VisitorQrModal from '@/components/security/VisitorQrModal';
import ParkingRequestForm from '@/components/security/ParkingRequestForm';
import { format } from 'date-fns';

// Sample visitor data
const visitors = [
  {
    id: 'visit-001',
    name: 'Amit Kumar',
    purpose: 'Meeting',
    date: '2025-04-28T14:00:00',
    duration: '2 hours',
    status: 'upcoming',
    vehicle: 'KA-01-AB-1234',
  },
  {
    id: 'visit-002',
    name: 'Priya Sharma',
    purpose: 'Delivery',
    date: '2025-04-27T11:30:00',
    duration: '30 mins',
    status: 'active',
    vehicle: '',
  },
  {
    id: 'visit-003',
    name: 'Rajan Patel',
    purpose: 'Maintenance',
    date: '2025-04-26T09:00:00',
    duration: '4 hours',
    status: 'completed',
    vehicle: 'MH-02-CD-5678',
  },
];

// Sample access log data
const accessLogs = [
  { id: 'log-001', name: 'Amit Kumar', type: 'entry', timestamp: '2025-04-27T14:05:23', location: 'Main Entrance' },
  { id: 'log-002', name: 'Priya Sharma', type: 'entry', timestamp: '2025-04-27T11:32:45', location: 'Service Entrance' },
  { id: 'log-003', name: 'Staff Member', type: 'exit', timestamp: '2025-04-27T17:15:10', location: 'Parking Exit' },
];

// Sample parking requests
const parkingRequests = [
  { id: 'park-001', visitorName: 'Kavita Gupta', vehicle: 'DL-05-AB-4567', date: '2025-04-30T10:00:00', status: 'approved' },
  { id: 'park-002', visitorName: 'Rahul Verma', vehicle: 'MH-01-XY-9876', date: '2025-04-29T14:30:00', status: 'pending' },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'upcoming':
      return <Badge className="bg-blue-600">Upcoming</Badge>;
    case 'active':
      return <Badge className="bg-green-600">Active</Badge>;
    case 'completed':
      return <Badge variant="secondary">Completed</Badge>;
    case 'approved':
      return <Badge className="bg-green-600">Approved</Badge>;
    case 'pending':
      return <Badge className="bg-yellow-600">Pending</Badge>;
    case 'rejected':
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const SecurityPage = () => {
  const [showVisitorForm, setShowVisitorForm] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<any>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showParkingForm, setShowParkingForm] = useState(false);
  const [activeTab, setActiveTab] = useState('visitors');

  const handleAddVisitor = () => {
    setShowVisitorForm(true);
  };

  const handleVisitorAdded = () => {
    setShowVisitorForm(false);
    // In a real app, we'd refresh the visitor list here
  };

  const handleViewQr = (visitor: any) => {
    setSelectedVisitor(visitor);
    setShowQrModal(true);
  };

  const handleAddParking = () => {
    setShowParkingForm(true);
  };

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Security Access</h2>
          <p className="text-sm text-gray-400 mt-1">Manage visitor access and security</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'visitors' && (
            <Button className="bg-plaza-blue hover:bg-blue-700" onClick={handleAddVisitor}>
              Add Visitor
            </Button>
          )}
          {activeTab === 'parking' && (
            <Button className="bg-plaza-blue hover:bg-blue-700" onClick={handleAddParking}>
              Request Parking
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="visitors" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-6 bg-card/50">
          <TabsTrigger value="visitors" className="data-[state=active]:bg-plaza-blue">
            <Users className="h-4 w-4 mr-2" />
            Visitors
          </TabsTrigger>
          <TabsTrigger value="access-logs" className="data-[state=active]:bg-plaza-blue">
            <UserCheck className="h-4 w-4 mr-2" />
            Access Log
          </TabsTrigger>
          <TabsTrigger value="parking" className="data-[state=active]:bg-plaza-blue">
            <Car className="h-4 w-4 mr-2" />
            Parking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visitors" className="space-y-4">
          {visitors.map((visitor) => (
            <Card key={visitor.id} className="bg-card/50 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <div className="bg-card/60 p-2 rounded-full mr-3">
                      <User size={18} className="text-plaza-blue" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-white">{visitor.name}</h4>
                        {getStatusBadge(visitor.status)}
                      </div>
                      <p className="text-sm text-gray-400">{visitor.purpose}</p>
                      <div className="flex flex-col gap-1 text-xs text-gray-500">
                        <div className="flex items-center">
                          <CalendarDays size={12} className="mr-1" />
                          <span>{format(new Date(visitor.date), 'PPP')}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock size={12} className="mr-1" />
                          <span>{format(new Date(visitor.date), 'p')} ({visitor.duration})</span>
                        </div>
                        {visitor.vehicle && (
                          <div className="flex items-center">
                            <Car size={12} className="mr-1" />
                            <span>{visitor.vehicle}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="flex items-center" 
                    onClick={() => handleViewQr(visitor)}
                    disabled={visitor.status === 'completed'}
                  >
                    <QrCode size={14} className="mr-1" />
                    QR Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="access-logs">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white text-lg">Access History</CardTitle>
              <CardDescription>Recent entry and exit records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accessLogs.map(log => (
                  <div key={log.id} className="flex items-center justify-between p-3 border-b border-border">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${log.type === 'entry' ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
                        <UserCheck size={16} className={log.type === 'entry' ? 'text-green-500' : 'text-red-500'} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{log.name}</p>
                        <p className="text-xs text-gray-400">{log.location}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{format(new Date(log.timestamp), 'PPP')}</p>
                      <p className="text-xs font-medium text-white">{format(new Date(log.timestamp), 'p')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parking">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white text-lg">Parking Requests</CardTitle>
              <CardDescription>Request visitor parking spaces</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {parkingRequests.map(request => (
                  <div key={request.id} className="p-3 border border-border rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-white">{request.visitorName}</p>
                        <div className="flex items-center text-xs text-gray-400 mt-1">
                          <Car size={12} className="mr-1" />
                          <span>{request.vehicle}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {format(new Date(request.date), 'PPP')} at {format(new Date(request.date), 'p')}
                        </p>
                      </div>
                      <div>{getStatusBadge(request.status)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showVisitorForm && (
        <VisitorForm onClose={() => setShowVisitorForm(false)} onVisitorAdded={handleVisitorAdded} />
      )}

      <VisitorQrModal 
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        visitor={selectedVisitor}
      />

      {showParkingForm && (
        <ParkingRequestForm 
          onClose={() => setShowParkingForm(false)} 
          onRequestSubmitted={() => setShowParkingForm(false)} 
        />
      )}
    </div>
  );
};

export default SecurityPage;
