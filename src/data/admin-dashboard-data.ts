
import { format, subDays } from 'date-fns';

export const generatePerformanceData = () => {
  const result = [];
  for (let i = 30; i >= 0; i--) {
    const date = subDays(new Date(), i);
    result.push({
      date: format(date, 'MMM dd'),
      totalRequests: Math.floor(Math.random() * 10) + 5,
      completed: Math.floor(Math.random() * 8) + 2,
      breached: Math.floor(Math.random() * 2),
    });
  }
  return result;
};

export const staff = [
  { id: 'staff-1', name: 'Amit Sharma', role: 'Maintenance Technician', status: 'active', currentTask: 'HVAC repair on 3rd floor', attendance: 'present' },
  { id: 'staff-2', name: 'Priya Patel', role: 'Security Officer', status: 'active', currentTask: 'Main entrance monitoring', attendance: 'present' },
  { id: 'staff-3', name: 'Rajiv Kumar', role: 'Electrician', status: 'break', currentTask: 'Scheduled break', attendance: 'present' },
  { id: 'staff-4', name: 'Sunita Verma', role: 'Cleaning Supervisor', status: 'active', currentTask: 'Floor inspection', attendance: 'present' },
  { id: 'staff-5', name: 'Vikram Singh', role: 'Maintenance Technician', status: 'offline', currentTask: 'Off duty', attendance: 'absent' },
];

export const equipment = [
  { id: 'equip-1', name: 'Main HVAC System', status: 'operational', lastMaintenance: '2025-04-15', health: '95%', alerts: 0 },
  { id: 'equip-2', name: 'Backup Generator', status: 'maintenance-due', lastMaintenance: '2025-01-20', health: '78%', alerts: 2 },
  { id: 'equip-3', name: 'Elevator System', status: 'operational', lastMaintenance: '2025-03-10', health: '92%', alerts: 0 },
  { id: 'equip-4', name: 'Security Cameras', status: 'needs-attention', lastMaintenance: '2025-02-25', health: '85%', alerts: 1 },
  { id: 'equip-5', name: 'Fire Alarm System', status: 'operational', lastMaintenance: '2025-04-05', health: '98%', alerts: 0 },
];

export const tickets = [
  { id: 'ticket-1', title: 'AC not working in Room 305', priority: 'high', status: 'in-progress', createdAt: '2025-04-25', assignedTo: 'Amit Sharma' },
  { id: 'ticket-2', title: 'Flickering lights in hallway', priority: 'medium', status: 'assigned', createdAt: '2025-04-26', assignedTo: 'Rajiv Kumar' },
  { id: 'ticket-3', title: 'Water leak in bathroom', priority: 'high', status: 'open', createdAt: '2025-04-26', assignedTo: 'Unassigned' },
  { id: 'ticket-4', title: 'Door lock broken', priority: 'medium', status: 'open', createdAt: '2025-04-27', assignedTo: 'Unassigned' },
  { id: 'ticket-5', title: 'Replace light bulbs in lobby', priority: 'low', status: 'completed', createdAt: '2025-04-24', assignedTo: 'Sunita Verma' },
];

export const slaCompliance = [
  { id: 'sla-1', category: 'HVAC Issues', target: '4 hours', actual: '3.5 hours', compliance: '100%', trend: 'improving' },
  { id: 'sla-2', category: 'Electrical Issues', target: '2 hours', actual: '1.8 hours', compliance: '100%', trend: 'stable' },
  { id: 'sla-3', category: 'Plumbing Issues', target: '3 hours', actual: '3.2 hours', compliance: '96%', trend: 'declining' },
  { id: 'sla-4', category: 'Security Issues', target: '1 hour', actual: '0.8 hours', compliance: '100%', trend: 'improving' },
  { id: 'sla-5', category: 'General Maintenance', target: '24 hours', actual: '18 hours', compliance: '100%', trend: 'stable' },
];
