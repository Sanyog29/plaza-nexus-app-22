import React, { useState, useEffect } from 'react';
import { AlertTriangle, Droplet, Zap, Thermometer, ArrowUp, Bell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

const AlertStats = ({ alerts }: { alerts: Alert[] }) => {
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;
  const infoCount = alerts.filter(a => a.severity === 'info').length;

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="bg-red-500/20 p-2 rounded-full">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Critical</p>
            <p className="text-lg font-semibold text-foreground">{criticalCount}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="bg-yellow-500/20 p-2 rounded-full">
            <Bell size={20} className="text-yellow-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Warnings</p>
            <p className="text-lg font-semibold text-foreground">{warningCount}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="bg-blue-500/20 p-2 rounded-full">
            <Bell size={20} className="text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Info</p>
            <p className="text-lg font-semibold text-foreground">{infoCount}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const AlertItem = ({ alert }: { alert: Alert }) => {
  const getIcon = () => {
    // Use title keywords to determine icon type
    const title = alert.title.toLowerCase();
    if (title.includes('water') || title.includes('plumb')) {
      return <Droplet size={24} className="text-blue-400" />;
    } else if (title.includes('power') || title.includes('electric')) {
      return <Zap size={24} className="text-yellow-400" />;
    } else if (title.includes('ac') || title.includes('air') || title.includes('temperature')) {
      return <Thermometer size={24} className="text-green-400" />;
    } else if (title.includes('elevator') || title.includes('lift')) {
      return <ArrowUp size={24} className="text-purple-400" />;
    } else {
      return <AlertTriangle size={24} className="text-red-400" />;
    }
  };
  
  const getSeverityClass = () => {
    switch (alert.severity) {
      case 'critical':
        return 'border-l-red-500';
      case 'warning':
        return 'border-l-yellow-500';
      case 'info':
        return 'border-l-blue-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const getSeverityBadge = () => {
    switch (alert.severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-600">Warning</Badge>;
      case 'info':
        return <Badge variant="secondary">Info</Badge>;
      default:
        return null;
    }
  };
  
  return (
    <Card className={`bg-card/50 backdrop-blur hover:bg-card/60 transition-colors border-l-4 ${getSeverityClass()}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start">
            <div className="bg-card/60 p-2 rounded-full mr-3">
              {getIcon()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-foreground">{alert.title}</h4>
                {getSeverityBadge()}
              </div>
              <p className="text-sm text-muted-foreground">{alert.message}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{new Date(alert.created_at).toLocaleString()}</span>
                {alert.expires_at && (
                  <>
                    <span>•</span>
                    <span>Expires: {new Date(alert.expires_at).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AlertFilters = ({ 
  selectedSeverity, 
  onSeverityChange 
}: { 
  selectedSeverity: string; 
  onSeverityChange: (severity: string) => void;
}) => {
  const severities = ['all', 'critical', 'warning', 'info'];

  return (
    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
      {severities.map((severity) => (
        <button
          key={severity}
          onClick={() => onSeverityChange(severity)}
          className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
            selectedSeverity === severity
              ? 'bg-primary text-primary-foreground'
              : 'bg-card/50 text-muted-foreground hover:bg-card'
          }`}
        >
          {severity.charAt(0).toUpperCase() + severity.slice(1)}
        </button>
      ))}
    </div>
  );
};

const AlertsPage = () => {
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('is_active', true)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter and type-cast the data to ensure severity matches our interface
      const validAlerts = (data || []).filter(alert => 
        ['info', 'warning', 'critical'].includes(alert.severity)
      ) as Alert[];
      
      setAlerts(validAlerts);
    } catch (error: any) {
      toast({
        title: "Error loading alerts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAlerts = selectedSeverity === 'all'
    ? alerts
    : alerts.filter(alert => alert.severity === selectedSeverity);

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-plaza-blue"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Facility Alerts</h2>
          <p className="text-sm text-muted-foreground mt-1">Monitor and track building alerts</p>
        </div>
      </div>
      
      <AlertStats alerts={alerts} />
      
      <Separator className="my-6 bg-gray-800" />
      
      <AlertFilters selectedSeverity={selectedSeverity} onSeverityChange={setSelectedSeverity} />
      
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No active alerts found</p>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert) => (
            <AlertItem key={alert.id} alert={alert} />
          ))
        )}
      </div>
    </div>
  );
};

export default AlertsPage;
