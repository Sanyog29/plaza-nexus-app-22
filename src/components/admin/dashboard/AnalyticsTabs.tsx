
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MaintenanceHeatmap from '@/components/admin/MaintenanceHeatmap';
import StaffWorkloadChart from '@/components/admin/StaffWorkloadChart';
import EquipmentCostChart from '@/components/admin/EquipmentCostChart';

const AnalyticsTabs = () => {
  return (
    <Tabs defaultValue="heatmap" className="w-full">
      <TabsList className="grid grid-cols-3 mb-6 bg-card/50">
        <TabsTrigger value="heatmap" className="data-[state=active]:bg-plaza-blue">
          Heatmaps
        </TabsTrigger>
        <TabsTrigger value="staffing" className="data-[state=active]:bg-plaza-blue">
          Staff Workload
        </TabsTrigger>
        <TabsTrigger value="budget" className="data-[state=active]:bg-plaza-blue">
          Budget Impact
        </TabsTrigger>
      </TabsList>

      <TabsContent value="heatmap">
        <MaintenanceHeatmap />
      </TabsContent>

      <TabsContent value="staffing">
        <StaffWorkloadChart />
      </TabsContent>

      <TabsContent value="budget">
        <EquipmentCostChart />
      </TabsContent>
    </Tabs>
  );
};

export default AnalyticsTabs;
