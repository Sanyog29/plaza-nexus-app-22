import React, { useState } from 'react';
import { AlertTriangle, Droplet, Zap, Thermometer, ArrowUp, Bell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

// Sample alert data
const alertsData = [
  {
    id: 'alert-001',
    title: 'Planned Power Shutdown',
    description: 'There will be a planned power shutdown for maintenance on Saturday from 10 PM to 4 AM.',
    type: 'electricity',
    severity: 'warning',
    timestamp: '2025-04-29T10:00:00',
  },
  {
    id: 'alert-002',
    title: 'AC Maintenance',
    description: 'AC units on floors 3-5 will undergo maintenance tomorrow. Temporary temperature fluctuations expected.',
    type: 'ac',
    severity: 'info',
    timestamp: '2025-04-28T09:15:00',
  },
  {
    id: 'alert-003',
    title: 'Water Supply Disruption',
    description: 'Water supply will be temporarily disrupted on the 7th floor due to pipe repairs from 2 PM to 4 PM today.',
    type: 'water',
    severity: 'critical',
    timestamp: '2025-04-27T14:00:00',
  },
  {
    id: 'alert-004',
    title: 'Elevator 2 Out of Service',
    description: 'Elevator 2 is currently undergoing repairs and will be out of service until tomorrow afternoon.',
    type: 'elevator',
    severity: 'warning',
    timestamp: '2025-04-27T11:30:00',
  },
];

const AlertStats = ({ alerts }: { alerts: typeof alertsData }) => {
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
            <p className="text-sm text-gray-400">Critical</p>
            <p className="text-lg font-semibold text-white">{criticalCount}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="bg-yellow-500/20 p-2 rounded-full">
            <Bell size={20} className="text-yellow-500" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Warnings</p>
            <p className="text-lg font-semibold text-white">{warningCount}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="bg-blue-500/20 p-2 rounded-full">
            <Bell size={20} className="text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Info</p>
            <p className="text-lg font-semibold text-white">{infoCount}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const AlertItem = ({ alert }: { alert: typeof alertsData[0] }) => {
  const getIcon = () => {
    switch (alert.type) {
      case 'water':
        return <Droplet size={24} className="text-blue-400" />;
      case 'electricity':
        return <Zap size={24} className="text-yellow-400" />;
      case 'ac':
        return <Thermometer size={24} className="text-green-400" />;
      case 'elevator':
        return <ArrowUp size={24} className="text-purple-400" />;
      default:
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
                <h4 className="font-medium text-white">{alert.title}</h4>
                {getSeverityBadge()}
              </div>
              <p className="text-sm text-gray-400">{alert.description}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Type: {alert.type}</span>
                <span>•</span>
                <span>{new Date(alert.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AlertFilters = ({ 
  selectedType, 
  onTypeChange 
}: { 
  selectedType: string; 
  onTypeChange: (type: string) => void;
}) => {
  const types = ['all', 'electricity', 'water', 'ac', 'elevator'];

  return (
    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
      {types.map((type) => (
        <button
          key={type}
          onClick={() => onTypeChange(type)}
          className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
            selectedType === type
              ? 'bg-plaza-blue text-white'
              : 'bg-card/50 text-gray-400 hover:bg-card'
          }`}
        >
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </button>
      ))}
    </div>
  );
};

const AlertsPage = () => {
  const [selectedType, setSelectedType] = useState('all');

  const filteredAlerts = selectedType === 'all'
    ? alertsData
    : alertsData.filter(alert => alert.type === selectedType);

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Facility Alerts</h2>
          <p className="text-sm text-gray-400 mt-1">Monitor and track building alerts</p>
        </div>
      </div>
      
      <AlertStats alerts={alertsData} />
      
      <Separator className="my-6 bg-gray-800" />
      
      <AlertFilters selectedType={selectedType} onTypeChange={setSelectedType} />
      
      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <AlertItem key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  );
};

export default AlertsPage;
