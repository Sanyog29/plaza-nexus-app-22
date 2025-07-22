
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, User, CheckCircle, AlertCircle, 
  Calendar, ClipboardList, MoreHorizontal,
  Plus, RefreshCw
} from 'lucide-react';
import { format, differenceInHours, differenceInMinutes } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ShiftGuard {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  avatar_url?: string;
  created_at: string;
  email?: string;
  [key: string]: any;
}

interface SecurityGuardShiftsProps {
  guards: ShiftGuard[];
}

const SecurityGuardShifts: React.FC<SecurityGuardShiftsProps> = ({ guards }) => {
  const [loading, setLoading] = useState(false);
  const [shiftsData, setShiftsData] = useState<any[]>([]);
  
  // Fetch shift data when component mounts
  React.useEffect(() => {
    fetchShifts();
  }, [guards]);
  
  const fetchShifts = async () => {
    if (guards.length === 0) return;
    
    setLoading(true);
    try {
      const guardIds = guards.map(g => g.id);
      
      const { data, error } = await supabase
        .from('security_shifts')
        .select('*')
        .in('guard_id', guardIds)
        .order('shift_start', { ascending: false });
      
      if (error) throw error;
      setShiftsData(data || []);
    } catch (err) {
      console.error('Error fetching shifts:', err);
      toast.error('Failed to load shift data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate shift duration
  const calculateShiftDuration = (start: string, end: string | null) => {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    
    const hours = differenceInHours(endDate, startDate);
    const minutes = differenceInMinutes(endDate, startDate) % 60;
    
    return `${hours}h ${minutes}m`;
  };

  // Find active shift for a guard
  const findActiveShift = (guardId: string) => {
    return shiftsData.find(shift => 
      shift.guard_id === guardId && shift.shift_end === null
    );
  };

  // Group shifts by guard
  const shiftsByGuard = guards.map(guard => {
    const guardShifts = shiftsData.filter(shift => shift.guard_id === guard.id);
    const activeShift = findActiveShift(guard.id);
    const completedShifts = guardShifts.filter(shift => shift.shift_end);
    
    return {
      guard,
      shifts: guardShifts,
      activeShift,
      completedShifts,
      totalShifts: guardShifts.length
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchShifts}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Assign Shift
        </Button>
      </div>

      {/* Active Guard Shifts */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Active Guards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shiftsByGuard.filter(g => g.activeShift).length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No active shifts</p>
              </CardContent>
            </Card>
          ) : (
            shiftsByGuard
              .filter(g => g.activeShift)
              .map(({ guard, activeShift }) => (
                <Card key={guard.id} className="overflow-hidden">
                  <div className="p-4 bg-primary/5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{guard.first_name} {guard.last_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {guard.role === 'security_supervisor' ? 'Supervisor' : 'Security Officer'}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-600">On Duty</Badge>
                  </div>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Shift Started</div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span className="text-sm">
                            {format(new Date(activeShift.shift_start), 'HH:mm')}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Duration</div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span className="text-sm">
                            {calculateShiftDuration(activeShift.shift_start, null)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-4 w-4 mr-1" />
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Contact Guard</DropdownMenuItem>
                          <DropdownMenuItem>Assign Task</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">End Shift</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      </div>

      {/* Available Guards */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Available Guards</h3>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Role</th>
                <th className="text-left p-3 font-medium">Last Shift</th>
                <th className="text-left p-3 font-medium">Shifts Completed</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shiftsByGuard
                .filter(g => !g.activeShift)
                .map(({ guard, completedShifts, totalShifts }) => (
                  <tr key={guard.id} className="border-t">
                    <td className="p-3 font-medium">
                      {guard.first_name} {guard.last_name}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {guard.role === 'security_supervisor' ? 'Supervisor' : 'Security Officer'}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {completedShifts.length > 0 
                        ? format(new Date(completedShifts[0].shift_end || completedShifts[0].shift_start), 'PPP')
                        : 'No shifts recorded'
                      }
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {totalShifts} shifts
                    </td>
                    <td className="p-3">
                      <Button size="sm">Start Shift</Button>
                    </td>
                  </tr>
                ))}
              {shiftsByGuard.filter(g => !g.activeShift).length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center p-6 text-muted-foreground">
                    All guards are currently on duty
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="space-y-2">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Schedule Management
        </h3>
        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium mb-1">Weekly Schedule</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create and manage security staff scheduling
            </p>
            <Button className="mx-auto">View Schedule</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SecurityGuardShifts;
