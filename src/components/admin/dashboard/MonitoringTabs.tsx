
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, User, Clock } from 'lucide-react';
import { getStatusBadge, getPriorityBadge, getTrendBadge } from './BadgeUtils';
import TicketManagement from './TicketManagement';
import StaffAttendance from './StaffAttendance';
import SLAComplianceReport from './SLAComplianceReport';
import { staff, tickets, slaCompliance } from '@/data/admin-dashboard-data';

const MonitoringTabs = () => {
  return (
    <Tabs defaultValue="tickets" className="w-full">
      <TabsList className="grid grid-cols-3 mb-6 bg-card/50">
        <TabsTrigger value="tickets" className="data-[state=active]:bg-plaza-blue">
          <LayoutDashboard className="h-4 w-4 mr-2" />
          Tickets
        </TabsTrigger>
        <TabsTrigger value="staff" className="data-[state=active]:bg-plaza-blue">
          <User className="h-4 w-4 mr-2" />
          Staff
        </TabsTrigger>
        <TabsTrigger value="sla" className="data-[state=active]:bg-plaza-blue">
          <Clock className="h-4 w-4 mr-2" />
          SLA Compliance
        </TabsTrigger>
      </TabsList>

      <TabsContent value="tickets">
        <TicketManagement 
          tickets={tickets}
          getStatusBadge={getStatusBadge}
          getPriorityBadge={getPriorityBadge}
        />
      </TabsContent>

      <TabsContent value="staff">
        <StaffAttendance 
          staff={staff}
          getStatusBadge={getStatusBadge}
        />
      </TabsContent>

      <TabsContent value="sla">
        <SLAComplianceReport 
          slaCompliance={slaCompliance}
          getTrendBadge={getTrendBadge}
        />
      </TabsContent>
    </Tabs>
  );
};

export default MonitoringTabs;
