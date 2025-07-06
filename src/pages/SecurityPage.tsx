import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, User, Users, Car, QrCode, UserCheck, Building } from 'lucide-react';
import VisitorForm from '@/components/security/VisitorForm';
import VisitorQrModal from '@/components/security/VisitorQrModal';
import ParkingRequestForm from '@/components/security/ParkingRequestForm';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'scheduled':
      return <Badge className="bg-blue-600">Scheduled</Badge>;
    case 'checked_in':
      return <Badge className="bg-green-600">Checked In</Badge>;
    case 'checked_out':
      return <Badge variant="secondary">Completed</Badge>;
    case 'pending':
      return <Badge className="bg-yellow-600">Pending</Badge>;
    case 'approved':
      return <Badge className="bg-green-600">Approved</Badge>;
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
  const [visitors, setVisitors] = useState<any[]>([]);
  const [parkingRequests, setParkingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [visitorsResult, parkingResult] = await Promise.all([
          supabase
            .from('visitors')
            .select(`
              *,
              visitor_categories (name, icon, color)
            `)
            .order('created_at', { ascending: false }),
          supabase
            .from('parking_requests')
            .select(`
              *,
              visitors (name)
            `)
            .order('created_at', { ascending: false })
        ]);

        if (visitorsResult.data) setVisitors(visitorsResult.data);
        if (parkingResult.data) setParkingRequests(parkingResult.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddVisitor = () => {
    setShowVisitorForm(true);
  };

  const handleVisitorAdded = () => {
    setShowVisitorForm(false);
    // Refresh visitor data
    const fetchVisitors = async () => {
      const { data } = await supabase
        .from('visitors')
        .select(`
          *,
          visitor_categories (name, icon, color)
        `)
        .order('created_at', { ascending: false });
      
      if (data) setVisitors(data);
    };
    fetchVisitors();
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
          <h2 className="text-2xl font-bold text-white">Security & Visitors</h2>
          <p className="text-sm text-gray-400 mt-1">Manage office visitors and parking access</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'visitors' && (
            <Button className="bg-plaza-blue hover:bg-blue-700" onClick={handleAddVisitor}>
              Register Visitor
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
          {loading ? (
            <div className="text-center text-gray-400">Loading visitors...</div>
          ) : visitors.length === 0 ? (
            <Card className="bg-card/50 backdrop-blur">
              <CardContent className="p-8 text-center">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No visitors registered yet</p>
                <p className="text-sm text-gray-500 mt-1">Click "Register Visitor" to add the first visitor</p>
              </CardContent>
            </Card>
          ) : (
            visitors.map((visitor) => (
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
                          {getStatusBadge(visitor.approval_status || visitor.status)}
                        </div>
                        {visitor.company && (
                          <p className="text-sm text-plaza-blue">{visitor.company}</p>
                        )}
                        <p className="text-sm text-gray-400">{visitor.visit_purpose}</p>
                        {visitor.visitor_categories && (
                          <div className="flex items-center gap-1">
                            {visitor.visitor_categories.icon && (
                              <span className="text-xs">{visitor.visitor_categories.icon}</span>
                            )}
                            <span className="text-xs text-gray-500">{visitor.visitor_categories.name}</span>
                          </div>
                        )}
                        <div className="flex flex-col gap-1 text-xs text-gray-500">
                          <div className="flex items-center">
                            <CalendarDays size={12} className="mr-1" />
                            <span>{format(new Date(visitor.visit_date), 'PPP')}</span>
                          </div>
                          {visitor.entry_time && (
                            <div className="flex items-center">
                              <Clock size={12} className="mr-1" />
                              <span>{visitor.entry_time}</span>
                            </div>
                          )}
                          {visitor.contact_number && (
                            <div className="flex items-center">
                              <span>📞 {visitor.contact_number}</span>
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
                      disabled={visitor.approval_status === 'rejected'}
                    >
                      <QrCode size={14} className="mr-1" />
                      QR Code
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="access-logs">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white text-lg">Access History</CardTitle>
              <CardDescription>Recent entry and exit records - Coming Soon</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-400">
                <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Access logging system will be implemented soon</p>
                <p className="text-sm mt-1">This will show real-time visitor check-ins and check-outs</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parking">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white text-lg">Parking Requests</CardTitle>
              <CardDescription>Visitor parking space requests</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center text-gray-400">Loading parking requests...</div>
              ) : parkingRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No parking requests yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {parkingRequests.map(request => (
                    <div key={request.id} className="p-3 border border-border rounded-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-white">
                            {request.visitors?.name || 'Unknown Visitor'}
                          </p>
                          <div className="flex items-center text-xs text-gray-400 mt-1">
                            <Car size={12} className="mr-1" />
                            <span>{request.vehicle_number}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {format(new Date(request.visit_date), 'PPP')} - {request.duration}
                          </p>
                        </div>
                        <div>{getStatusBadge(request.approved ? 'approved' : 'pending')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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