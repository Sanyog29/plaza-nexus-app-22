import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  UserCheck, 
  Clock, 
  MapPin, 
  Phone, 
  Building, 
  Search,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface Visitor {
  id: string;
  name: string;
  company: string;
  purpose: string;
  host: string;
  checkIn: string;
  checkOut: string | null;
  status: 'checked_in' | 'checked_out' | 'overdue' | 'pending';
  phone: string;
  location: string;
}

export const VisitorDashboard: React.FC = () => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredVisitors, setFilteredVisitors] = useState<Visitor[]>([]);

  useEffect(() => {
    // Mock data - in real app, fetch from backend
    const mockVisitors: Visitor[] = [
      {
        id: '1',
        name: 'John Doe',
        company: 'Tech Corp',
        purpose: 'Business Meeting',
        host: 'Sarah Johnson',
        checkIn: '09:30 AM',
        checkOut: null,
        status: 'checked_in',
        phone: '+1-555-0123',
        location: 'Conference Room A'
      },
      {
        id: '2',
        name: 'Jane Smith',
        company: 'Design Co',
        purpose: 'Interview',
        host: 'Mike Chen',
        checkIn: '10:15 AM',
        checkOut: '11:45 AM',
        status: 'checked_out',
        phone: '+1-555-0124',
        location: 'HR Office'
      },
      {
        id: '3',
        name: 'Bob Wilson',
        company: 'Delivery Service',
        purpose: 'Delivery',
        host: 'Security Desk',
        checkIn: '08:45 AM',
        checkOut: null,
        status: 'overdue',
        phone: '+1-555-0125',
        location: 'Loading Bay'
      },
      {
        id: '4',
        name: 'Alice Brown',
        company: 'Maintenance Pro',
        purpose: 'Maintenance',
        host: 'Emily Davis',
        checkIn: '',
        checkOut: null,
        status: 'pending',
        phone: '+1-555-0126',
        location: 'Pending'
      }
    ];
    
    setVisitors(mockVisitors);
    setFilteredVisitors(mockVisitors);
  }, []);

  useEffect(() => {
    const filtered = visitors.filter(visitor =>
      visitor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      visitor.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      visitor.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      visitor.host.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredVisitors(filtered);
  }, [searchQuery, visitors]);

  const getStatusBadge = (status: Visitor['status']) => {
    switch (status) {
      case 'checked_in':
        return <Badge className="bg-green-100 text-green-800">Checked In</Badge>;
      case 'checked_out':
        return <Badge className="bg-gray-100 text-gray-800">Checked Out</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: Visitor['status']) => {
    switch (status) {
      case 'checked_in':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'checked_out':
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleCheckOut = (visitorId: string) => {
    setVisitors(prev => prev.map(visitor => 
      visitor.id === visitorId 
        ? { ...visitor, status: 'checked_out' as const, checkOut: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        : visitor
    ));
  };

  const handleApprove = (visitorId: string) => {
    setVisitors(prev => prev.map(visitor => 
      visitor.id === visitorId 
        ? { ...visitor, status: 'checked_in' as const, checkIn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        : visitor
    ));
  };

  const currentlyInBuilding = visitors.filter(v => v.status === 'checked_in').length;
  const pendingApprovals = visitors.filter(v => v.status === 'pending').length;
  const overdueVisitors = visitors.filter(v => v.status === 'overdue').length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Currently in Building</p>
                <p className="text-2xl font-bold text-green-600">{currentlyInBuilding}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Approvals</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingApprovals}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue Visitors</p>
                <p className="text-2xl font-bold text-red-600">{overdueVisitors}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visitor Table */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Today's Visitors</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search visitors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Visitor</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Host</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVisitors.map((visitor) => (
                <TableRow key={visitor.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(visitor.status)}
                      <div>
                        <p className="font-medium">{visitor.name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {visitor.phone}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      {visitor.company}
                    </div>
                  </TableCell>
                  <TableCell>{visitor.purpose}</TableCell>
                  <TableCell>{visitor.host}</TableCell>
                  <TableCell>{visitor.checkIn || 'Not checked in'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {visitor.location}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(visitor.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {visitor.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleApprove(visitor.id)}
                          className="h-8"
                        >
                          Approve
                        </Button>
                      )}
                      {visitor.status === 'checked_in' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCheckOut(visitor.id)}
                          className="h-8"
                        >
                          Check Out
                        </Button>
                      )}
                      {visitor.status === 'overdue' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCheckOut(visitor.id)}
                          className="h-8"
                        >
                          Force Check Out
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};