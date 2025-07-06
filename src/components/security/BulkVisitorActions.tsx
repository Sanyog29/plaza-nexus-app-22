import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, CheckCircle, XCircle, Clock, Download, FileText } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Visitor {
  id: string;
  name: string;
  company: string | null;
  status: string | null;
  entry_time: string | null;
  visit_purpose: string;
  check_in_time: string | null;
  check_out_time: string | null;
}

export const BulkVisitorActions: React.FC = () => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [selectedVisitors, setSelectedVisitors] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodayVisitors();
  }, []);

  const fetchTodayVisitors = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data } = await supabase
        .from('visitors')
        .select('id, name, company, status, entry_time, visit_purpose, check_in_time, check_out_time')
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVisitors(visitors.map(v => v.id));
    } else {
      setSelectedVisitors([]);
    }
  };

  const handleSelectVisitor = (visitorId: string, checked: boolean) => {
    if (checked) {
      setSelectedVisitors([...selectedVisitors, visitorId]);
    } else {
      setSelectedVisitors(selectedVisitors.filter(id => id !== visitorId));
    }
  };

  const processBulkAction = async () => {
    if (selectedVisitors.length === 0 || !bulkAction) {
      toast.error('Please select visitors and an action');
      return;
    }

    setIsProcessing(true);
    try {
      const currentTime = new Date().toISOString();
      let updateData: any = {};
      let logAction = '';

      switch (bulkAction) {
        case 'check_in':
          updateData = { status: 'checked_in', check_in_time: currentTime };
          logAction = 'bulk_check_in';
          break;
        case 'check_out':
          updateData = { status: 'checked_out', check_out_time: currentTime };
          logAction = 'bulk_check_out';
          break;
        case 'mark_no_show':
          updateData = { status: 'no_show' };
          logAction = 'bulk_no_show';
          break;
      }

      // Update visitors in batch
      for (const visitorId of selectedVisitors) {
        await supabase
          .from('visitors')
          .update(updateData)
          .eq('id', visitorId);

        // Log the action
        await supabase.from('visitor_check_logs').insert({
          visitor_id: visitorId,
          action_type: logAction,
          performed_by: (await supabase.auth.getUser()).data.user?.id,
          notes: `Bulk action: ${bulkAction}`,
          metadata: { bulk_action: true, selected_count: selectedVisitors.length }
        });
      }

      toast.success(`Successfully processed ${selectedVisitors.length} visitors`);
      
      // Refresh data and clear selections
      await fetchTodayVisitors();
      setSelectedVisitors([]);
      setBulkAction('');

    } catch (error) {
      console.error('Error processing bulk action:', error);
      toast.error('Failed to process bulk action');
    } finally {
      setIsProcessing(false);
    }
  };

  const exportVisitorList = async () => {
    try {
      const csvContent = [
        // Header
        ['Name', 'Company', 'Purpose', 'Status', 'Entry Time', 'Check In', 'Check Out'].join(','),
        // Data rows
        ...visitors.map(v => [
          v.name,
          v.company || 'N/A',
          v.visit_purpose,
          v.status || 'scheduled',
          v.entry_time || 'N/A',
          v.check_in_time ? format(new Date(v.check_in_time), 'HH:mm') : 'N/A',
          v.check_out_time ? format(new Date(v.check_out_time), 'HH:mm') : 'N/A'
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `visitors-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Visitor list exported successfully');
    } catch (error) {
      console.error('Error exporting visitor list:', error);
      toast.error('Failed to export visitor list');
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'checked_in':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'checked_out':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case 'no_show':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'checked_in':
        return 'text-green-400';
      case 'checked_out':
        return 'text-gray-400';
      case 'no_show':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-6 text-center text-gray-400">
          Loading visitors...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Visitor Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Action Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              <Checkbox
                id="select-all"
                checked={selectedVisitors.length === visitors.length && visitors.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-white text-sm">
                Select All ({selectedVisitors.length} selected)
              </label>
            </div>

            <div className="flex gap-2">
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger className="w-40 bg-input border-border">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="check_in">Check In</SelectItem>
                  <SelectItem value="check_out">Check Out</SelectItem>
                  <SelectItem value="mark_no_show">Mark No Show</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={processBulkAction}
                disabled={isProcessing || selectedVisitors.length === 0 || !bulkAction}
                className="bg-plaza-blue hover:bg-blue-700"
              >
                {isProcessing ? 'Processing...' : 'Apply'}
              </Button>

              <Button
                onClick={exportVisitorList}
                variant="outline"
                className="border-border"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Visitor List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {visitors.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                No visitors found for today
              </div>
            ) : (
              visitors.map((visitor) => (
                <div
                  key={visitor.id}
                  className="flex items-center gap-3 p-3 bg-card/30 rounded-lg border border-border"
                >
                  <Checkbox
                    checked={selectedVisitors.includes(visitor.id)}
                    onCheckedChange={(checked) => handleSelectVisitor(visitor.id, !!checked)}
                  />
                  
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2 text-sm">
                    <div>
                      <p className="font-medium text-white">{visitor.name}</p>
                      <p className="text-gray-400">{visitor.company || 'No Company'}</p>
                    </div>
                    
                    <div>
                      <p className="text-gray-300">{visitor.visit_purpose}</p>
                      <p className="text-gray-400">Entry: {visitor.entry_time || 'N/A'}</p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {getStatusIcon(visitor.status)}
                      <span className={getStatusColor(visitor.status)}>
                        {visitor.status || 'scheduled'}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-400">
                      {visitor.check_in_time && (
                        <div>In: {format(new Date(visitor.check_in_time), 'HH:mm')}</div>
                      )}
                      {visitor.check_out_time && (
                        <div>Out: {format(new Date(visitor.check_out_time), 'HH:mm')}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};