
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, User, Users, Car, QrCode, UserCheck } from 'lucide-react';
import VisitorForm from '@/components/security/VisitorForm';
import VisitorQrModal from '@/components/security/VisitorQrModal';
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

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'upcoming':
      return <Badge className="bg-blue-600">Upcoming</Badge>;
    case 'active':
      return <Badge className="bg-green-600">Active</Badge>;
    case 'completed':
      return <Badge variant="secondary">Completed</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const SecurityPage = () => {
  const [showVisitorForm, setShowVisitorForm] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<any>(null);
  const [showQrModal, setShowQrModal] = useState(false);

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

  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Security Access</h2>
          <p className="text-sm text-gray-400 mt-1">Manage visitor access and security</p>
        </div>
        <Button className="bg-plaza-blue hover:bg-blue-700" onClick={handleAddVisitor}>
          Add Visitor
        </Button>
      </div>

      <Tabs defaultValue="visitors" className="w-full">
        <TabsList className="grid grid-cols-2 mb-6 bg-card/50">
          <TabsTrigger value="visitors" className="data-[state=active]:bg-plaza-blue">
            <Users className="h-4 w-4 mr-2" />
            Visitors
          </TabsTrigger>
          <TabsTrigger value="access" className="data-[state=active]:bg-plaza-blue">
            <UserCheck className="h-4 w-4 mr-2" />
            Access Log
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

        <TabsContent value="access">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white text-lg">Access History</CardTitle>
              <CardDescription>Recent entry and exit records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* This would be populated with real access log data */}
                <p className="text-sm text-gray-400">Loading access logs...</p>
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
    </div>
  );
};

export default SecurityPage;
