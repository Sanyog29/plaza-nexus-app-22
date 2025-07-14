import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Trash2, 
  Filter,
  Clock,
  ExternalLink,
  Wrench,
  Shield,
  Activity,
  Info
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useEnhancedNotifications } from '@/components/notifications/EnhancedNotificationProvider';
import { Link } from 'react-router-dom';

export default function NotificationsPage() {
  const { 
    notifications, 
    unreadCount, 
    alertCount,
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useEnhancedNotifications();
  
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert': return AlertTriangle;
      case 'maintenance': return Wrench;
      case 'security': return Shield;
      case 'system': return Activity;
      default: return Info;
    }
  };

  const getNotificationColor = (priority: string, type: string) => {
    if (priority === 'urgent') return 'border-red-500 bg-red-50 text-red-900';
    if (priority === 'high') return 'border-orange-500 bg-orange-50 text-orange-900';
    if (type === 'alert') return 'border-yellow-500 bg-yellow-50 text-yellow-900';
    return 'border-blue-500 bg-blue-50 text-blue-900';
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive" className="text-xs">URGENT</Badge>;
      case 'high':
        return <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">HIGH</Badge>;
      case 'normal':
        return <Badge variant="outline" className="text-xs">NORMAL</Badge>;
      case 'low':
        return <Badge variant="outline" className="text-xs text-gray-600">LOW</Badge>;
      default:
        return null;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'unread' && notification.is_read) return false;
    if (activeTab === 'urgent' && notification.priority !== 'urgent') return false;
    if (filterType !== 'all' && notification.type !== filterType) return false;
    if (filterPriority !== 'all' && notification.priority !== filterPriority) return false;
    return true;
  });

  const groupedNotifications = {
    today: filteredNotifications.filter(n => {
      const today = new Date();
      const notifDate = new Date(n.created_at);
      return notifDate.toDateString() === today.toDateString();
    }),
    yesterday: filteredNotifications.filter(n => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const notifDate = new Date(n.created_at);
      return notifDate.toDateString() === yesterday.toDateString();
    }),
    older: filteredNotifications.filter(n => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const notifDate = new Date(n.created_at);
      return notifDate < twoDaysAgo;
    })
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with system alerts and important messages
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark all as read ({unreadCount})
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Unread</p>
                <p className="text-2xl font-bold">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium">Urgent</p>
                <p className="text-2xl font-bold">
                  {notifications.filter(n => n.priority === 'urgent').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Active Alerts</p>
                <p className="text-2xl font-bold">{alertCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Tabs */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
                <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
                <TabsTrigger value="urgent">
                  Urgent ({notifications.filter(n => n.priority === 'urgent').length})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="alert">Alerts</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <ScrollArea className="h-[600px]">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No notifications found
                </h3>
                <p className="text-sm text-muted-foreground">
                  {activeTab === 'unread' 
                    ? "You're all caught up! No unread notifications."
                    : "Try adjusting your filters to see more notifications."}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Today */}
                {groupedNotifications.today.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Today</h3>
                    <div className="space-y-3">
                      {groupedNotifications.today.map((notification) => (
                        <NotificationItem 
                          key={notification.id}
                          notification={notification}
                          onMarkRead={markAsRead}
                          onDelete={deleteNotification}
                          getIcon={getNotificationIcon}
                          getColor={getNotificationColor}
                          getPriorityBadge={getPriorityBadge}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Yesterday */}
                {groupedNotifications.yesterday.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Yesterday</h3>
                    <div className="space-y-3">
                      {groupedNotifications.yesterday.map((notification) => (
                        <NotificationItem 
                          key={notification.id}
                          notification={notification}
                          onMarkRead={markAsRead}
                          onDelete={deleteNotification}
                          getIcon={getNotificationIcon}
                          getColor={getNotificationColor}
                          getPriorityBadge={getPriorityBadge}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Older */}
                {groupedNotifications.older.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Older</h3>
                    <div className="space-y-3">
                      {groupedNotifications.older.map((notification) => (
                        <NotificationItem 
                          key={notification.id}
                          notification={notification}
                          onMarkRead={markAsRead}
                          onDelete={deleteNotification}
                          getIcon={getNotificationIcon}
                          getColor={getNotificationColor}
                          getPriorityBadge={getPriorityBadge}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

interface NotificationItemProps {
  notification: any;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  getIcon: (type: string) => any;
  getColor: (priority: string, type: string) => string;
  getPriorityBadge: (priority: string) => React.ReactNode;
}

function NotificationItem({ 
  notification, 
  onMarkRead, 
  onDelete, 
  getIcon, 
  getColor, 
  getPriorityBadge 
}: NotificationItemProps) {
  const Icon = getIcon(notification.type);
  const colorClasses = getColor(notification.priority, notification.type);

  return (
    <div className={`p-4 rounded-lg border-l-4 ${colorClasses} ${notification.is_read ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm leading-tight">
                {notification.title}
              </h4>
              {getPriorityBadge(notification.priority)}
              {!notification.is_read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {notification.message}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </span>
              {notification.action_url && (
                <Link 
                  to={notification.action_url}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  View Details
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 flex-shrink-0">
          {!notification.is_read && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkRead(notification.id)}
              className="h-8 w-8 p-0"
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(notification.id)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}