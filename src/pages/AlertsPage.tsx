
import React from 'react';
import { AlertTriangle, Droplet, Zap, Thermometer, ArrowUp } from 'lucide-react';

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
  
  return (
    <div className={`bg-card rounded-lg overflow-hidden card-shadow border-l-4 ${getSeverityClass()}`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="bg-card bg-opacity-60 p-2 rounded-full mr-3">
            {getIcon()}
          </div>
          <div>
            <h4 className="font-medium text-white">{alert.title}</h4>
            <p className="text-sm text-gray-400 mt-1">{alert.description}</p>
            <p className="text-xs text-gray-500 mt-2">
              {new Date(alert.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const AlertsPage = () => {
  return (
    <div className="px-4 py-6">
      <h2 className="text-2xl font-bold text-white mb-6">Facility Alerts</h2>
      
      <div className="space-y-4">
        {alertsData.map((alert) => (
          <AlertItem key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  );
};

export default AlertsPage;
