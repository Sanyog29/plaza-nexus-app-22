import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Search, User, LogIn, LogOut, Clock, Building } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

interface VisitorCheckInProps {
  onCheckIn: () => void;
}

export const VisitorCheckIn: React.FC<VisitorCheckInProps> = ({ onCheckIn }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVisitor, setSelectedVisitor] = useState<any>(null);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [badgeNumber, setBadgeNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodayVisitors();
  }, []);

  const fetchTodayVisitors = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data } = await supabase
        .from('visitors')
        .select(`
          *,
          visitor_categories (name, icon, color),
          profiles!inner (first_name, last_name, office_number)
        `)
        .eq('visit_date', today)
        .order('entry_time', { ascending: true });

      if (data) setVisitors(data);
    } catch (error) {
      console.error('Error fetching visitors:', error);
      toast.error('Failed to load visitors');
    } finally {
      setLoading(false);
    }
  };

  const filteredVisitors = visitors.filter(visitor =>
    visitor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visitor.contact_number?.includes(searchTerm)
  );

  const handleVisitorAction = async (visitor: any, action: 'check_in' | 'check_out') => {
    setProcessing(true);
    try {
      const updates: any = {
        status: action === 'check_in' ? 'checked_in' : 'checked_out',
        updated_at: new Date().toISOString()
      };

      if (action === 'check_in') {
        updates.check_in_time = new Date().toISOString();
        if (badgeNumber) {
          updates.visitor_badge_number = badgeNumber;
        }
      } else {
        updates.check_out_time = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('visitors')
        .update(updates)
        .eq('id', visitor.id);

      if (updateError) {
        toast.error(`Failed to ${action.replace('_', ' ')} visitor`);
        return;
      }

      // Log the action
      const { error: logError } = await supabase
        .from('visitor_check_logs')
        .insert({
          visitor_id: visitor.id,
          action_type: action,
          performed_by: (await supabase.auth.getUser()).data.user?.id,
          location: 'Main Reception',
          notes: notes || `${action === 'check_in' ? 'Checked in' : 'Checked out'} manually${badgeNumber ? ` - Badge: ${badgeNumber}` : ''}`,
          metadata: {
            badge_number: badgeNumber || null,
            manual_entry: true
          }
        });

      if (logError) {
        console.error('Failed to log action:', logError);
      }

      toast.success(`${visitor.name} ${action === 'check_in' ? 'checked in' : 'checked out'} successfully`);
      
      // Reset form
      setSelectedVisitor(null);
      setBadgeNumber('');
      setNotes('');
      
      // Refresh data
      fetchTodayVisitors();
      onCheckIn();

    } catch (error) {
      console.error('Error processing visitor:', error);
      toast.error('Failed to process visitor');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (visitor: any) => {
    switch (visitor.status) {
      case 'checked_in':
        return <Badge className="bg-green-600">Checked In</Badge>;
      case 'checked_out':
        return <Badge variant="secondary">Completed</Badge>;
      case 'scheduled':
        return visitor.approval_status === 'approved' 
          ? <Badge className="bg-blue-600">Expected</Badge>
          : <Badge className="bg-yellow-600">Pending Approval</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-6 text-center">
          <div className="w-8 h-8 border-2 border-plaza-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-400">Loading visitors...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <LogIn className="h-5 w-5" />
            Manual Check-In/Out
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, company, or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-input border-border"
            />
          </div>

          {/* Visitor List */}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filteredVisitors.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No visitors found</p>
              </div>
            ) : (
              filteredVisitors.map((visitor) => (
                <Card 
                  key={visitor.id} 
                  className={`cursor-pointer transition-colors ${
                    selectedVisitor?.id === visitor.id 
                      ? 'bg-plaza-blue/20 border-plaza-blue' 
                      : 'bg-card/30 hover:bg-card/50'
                  }`}
                  onClick={() => setSelectedVisitor(visitor)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-card/60 p-2 rounded-full">
                          <User size={16} className="text-plaza-blue" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{visitor.name}</p>
                          <div className="flex items-center space-x-2 text-sm text-gray-400">
                            <span>{visitor.company || 'No Company'}</span>
                            {visitor.entry_time && (
                              <>
                                <span>•</span>
                                <Clock size={12} />
                                <span>{visitor.entry_time}</span>
                              </>
                            )}
                          </div>
                          {visitor.profiles && (
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Building size={10} />
                              <span>Host: {visitor.profiles.first_name} {visitor.profiles.last_name}</span>
                              {visitor.profiles.office_number && (
                                <span>- {visitor.profiles.office_number}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(visitor)}
                        {visitor.visitor_badge_number && (
                          <p className="text-xs text-gray-400 mt-1">
                            Badge: {visitor.visitor_badge_number}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Visitor Actions */}
      {selectedVisitor && (
        <Card className="bg-card/50 backdrop-blur border border-plaza-blue">
          <CardHeader>
            <CardTitle className="text-white text-lg">
              Actions for {selectedVisitor.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="badge" className="text-white">Badge Number (Optional)</Label>
                <Input
                  id="badge"
                  placeholder="Enter badge number..."
                  value={badgeNumber}
                  onChange={(e) => setBadgeNumber(e.target.value)}
                  className="bg-input border-border"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-white">Current Status</Label>
                <div className="flex items-center h-10">
                  {getStatusBadge(selectedVisitor)}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-white">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this visitor..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-input border-border resize-none"
                rows={3}
              />
            </div>

            <div className="flex justify-center space-x-4">
              {selectedVisitor.status !== 'checked_in' && (
                <Button
                  onClick={() => handleVisitorAction(selectedVisitor, 'check_in')}
                  disabled={processing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  {processing ? 'Processing...' : 'Check In'}
                </Button>
              )}

              {selectedVisitor.status === 'checked_in' && (
                <Button
                  onClick={() => handleVisitorAction(selectedVisitor, 'check_out')}
                  disabled={processing}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {processing ? 'Processing...' : 'Check Out'}
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => {
                  setSelectedVisitor(null);
                  setBadgeNumber('');
                  setNotes('');
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};