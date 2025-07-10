import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { formatDistanceToNow } from "date-fns";
import { Activity, CheckCircle, AlertCircle, MessageSquare, Calendar, Coffee, Shield } from "lucide-react";

interface ActivityItem {
  id: string;
  type: 'maintenance_request' | 'room_booking' | 'cafeteria_order' | 'visitor_registration' | 'security_alert';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
  priority?: string;
}

export function ActivityFeed() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchRecentActivity();
  }, [user]);

  const fetchRecentActivity = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const activities: ActivityItem[] = [];

      // Fetch recent maintenance requests
      const { data: requests } = await supabase
        .from('maintenance_requests')
        .select('id, title, status, priority, created_at')
        .eq('reported_by', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (requests) {
        activities.push(...requests.map(req => ({
          id: `request-${req.id}`,
          type: 'maintenance_request' as const,
          title: `Maintenance Request: ${req.title}`,
          description: `Status: ${req.status}`,
          timestamp: req.created_at,
          status: req.status,
          priority: req.priority
        })));
      }

      // Fetch recent room bookings
      const { data: bookings } = await supabase
        .from('room_bookings')
        .select('id, title, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (bookings) {
        activities.push(...bookings.map(booking => ({
          id: `booking-${booking.id}`,
          type: 'room_booking' as const,
          title: `Room Booking: ${booking.title}`,
          description: `Status: ${booking.status}`,
          timestamp: booking.created_at,
          status: booking.status
        })));
      }

      // Fetch recent cafeteria orders
      const { data: orders } = await supabase
        .from('cafeteria_orders')
        .select('id, status, total_amount, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (orders) {
        activities.push(...orders.map(order => ({
          id: `order-${order.id}`,
          type: 'cafeteria_order' as const,
          title: `Cafeteria Order`,
          description: `Amount: $${order.total_amount} - Status: ${order.status}`,
          timestamp: order.created_at,
          status: order.status
        })));
      }

      // Sort all activities by timestamp
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setActivities(activities);
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'maintenance_request':
        return <AlertCircle className="h-4 w-4" />;
      case 'room_booking':
        return <Calendar className="h-4 w-4" />;
      case 'cafeteria_order':
        return <Coffee className="h-4 w-4" />;
      case 'visitor_registration':
        return <MessageSquare className="h-4 w-4" />;
      case 'security_alert':
        return <Shield className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status?: string, priority?: string) => {
    if (priority === 'urgent') return 'destructive';
    if (status === 'completed') return 'default';
    if (status === 'pending') return 'secondary';
    if (status === 'in_progress') return 'default';
    return 'outline';
  };

  const displayedActivities = showAll ? activities : activities.slice(0, 5);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        </div>
        {activities.length > 5 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Show Less' : 'Show All'}
          </Button>
        )}
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h4 className="text-lg font-medium text-foreground mb-2">No Recent Activity</h4>
          <p className="text-muted-foreground">
            Your recent actions and requests will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedActivities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg border bg-card/50">
              <div className="flex-shrink-0 mt-0.5">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {getActivityIcon(activity.type)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground truncate">
                    {activity.title}
                  </p>
                  <time className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </time>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-muted-foreground">
                    {activity.description}
                  </p>
                  {activity.status && (
                    <Badge variant={getStatusColor(activity.status, activity.priority)} className="text-xs">
                      {activity.status}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}