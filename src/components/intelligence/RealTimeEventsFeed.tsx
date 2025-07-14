import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRealTimeEvents } from '@/hooks/useRealTimeEvents';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  User, 
  Wrench, 
  FileText,
  RefreshCw,
  Circle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface EventFilters {
  severity: string[];
  eventTypes: string[];
  entityTypes: string[];
}

export const RealTimeEventsFeed: React.FC = () => {
  const { events, isConnected, fetchRecentEvents } = useRealTimeEvents();
  const [filters, setFilters] = useState<EventFilters>({
    severity: ['critical', 'warning', 'info'],
    eventTypes: [],
    entityTypes: []
  });

  const getEventIcon = (eventType: string, severity: string) => {
    if (severity === 'critical') return <AlertTriangle className="h-4 w-4 text-red-500" />;
    
    switch (eventType) {
      case 'request_created':
      case 'request_updated':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'request_completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'user_activity':
        return <User className="h-4 w-4 text-purple-500" />;
      case 'maintenance_scheduled':
      case 'maintenance_completed':
        return <Wrench className="h-4 w-4 text-orange-500" />;
      case 'system_alert':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'outline';
      case 'debug': return 'default';
      default: return 'default';
    }
  };

  const formatEventMessage = (event: any) => {
    const { event_type, event_data, entity_type } = event;
    
    switch (event_type) {
      case 'request_created':
        return `New ${entity_type} request created`;
      case 'request_updated':
        return `Request status updated to ${event_data.status || 'unknown'}`;
      case 'request_completed':
        return `Request completed successfully`;
      case 'request_assigned':
        return `Request assigned to ${event_data.assigned_to || 'staff member'}`;
      case 'user_activity':
        return `User ${event_data.activity || 'activity'} detected`;
      case 'system_alert':
        return event_data.message || `${event_data.alert_type} alert`;
      case 'maintenance_scheduled':
        return `Maintenance scheduled for ${event_data.asset_name || 'asset'}`;
      case 'maintenance_completed':
        return `Maintenance completed for ${event_data.asset_name || 'asset'}`;
      default:
        return `${event_type.replace('_', ' ')} event`;
    }
  };

  const filteredEvents = events.filter(event => {
    const severityMatch = filters.severity.length === 0 || filters.severity.includes(event.severity);
    const eventTypeMatch = filters.eventTypes.length === 0 || filters.eventTypes.includes(event.event_type);
    const entityTypeMatch = filters.entityTypes.length === 0 || filters.entityTypes.includes(event.entity_type);
    
    return severityMatch && eventTypeMatch && entityTypeMatch;
  });

  const uniqueEventTypes = Array.from(new Set(events.map(e => e.event_type)));
  const uniqueEntityTypes = Array.from(new Set(events.map(e => e.entity_type)));

  const toggleFilter = (filterType: keyof EventFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(v => v !== value)
        : [...prev[filterType], value]
    }));
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Real-Time Events
              <div className="flex items-center gap-1 ml-2">
                <Circle className={`h-2 w-2 ${isConnected ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'}`} />
                <span className="text-xs text-muted-foreground">
                  {isConnected ? 'Live' : 'Disconnected'}
                </span>
              </div>
            </CardTitle>
            <CardDescription>
              System events and activity feed
            </CardDescription>
          </div>
          <Button onClick={() => fetchRecentEvents()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Filters */}
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium mb-2">Severity</p>
            <div className="flex gap-1 flex-wrap">
              {['critical', 'warning', 'info', 'debug'].map(severity => (
                <Badge
                  key={severity}
                  variant={filters.severity.includes(severity) ? 'default' : 'outline'}
                  className="cursor-pointer text-xs"
                  onClick={() => toggleFilter('severity', severity)}
                >
                  {severity}
                </Badge>
              ))}
            </div>
          </div>

          {uniqueEventTypes.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Event Types</p>
              <div className="flex gap-1 flex-wrap">
                {uniqueEventTypes.slice(0, 6).map(eventType => (
                  <Badge
                    key={eventType}
                    variant={filters.eventTypes.includes(eventType) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleFilter('eventTypes', eventType)}
                  >
                    {eventType.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="p-4 space-y-3">
            {filteredEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className="mt-1">
                  {getEventIcon(event.event_type, event.severity)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium truncate">
                      {formatEventMessage(event)}
                    </p>
                    <Badge variant={getSeverityColor(event.severity)} className="text-xs">
                      {event.severity}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{event.entity_type}</span>
                    {event.entity_id && (
                      <>
                        <span>•</span>
                        <span className="truncate max-w-24">{event.entity_id}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}</span>
                  </div>

                  {event.event_data && Object.keys(event.event_data).length > 1 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {Object.entries(event.event_data)
                        .filter(([key]) => !['timestamp', 'id'].includes(key))
                        .slice(0, 2)
                        .map(([key, value]) => (
                          <div key={key} className="truncate">
                            {key}: {String(value)}
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredEvents.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No events match the current filters</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};