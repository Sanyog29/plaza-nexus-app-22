import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUtilityManagement } from '@/hooks/useUtilityManagement';
import { CSVImportComponent } from './CSVImportComponent';
import { toast } from '@/hooks/use-toast';
import { 
  Download, 
  Upload, 
  FileText, 
  Database,
  Calendar,
  TrendingUp
} from 'lucide-react';

export const DataExportTools: React.FC = () => {
  const { readings, meters, costCenters, budgetAllocations } = useUtilityManagement();
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({
        title: "No Data",
        description: "No data available to export",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    
    try {
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value
        ).join(',')
      );
      
      const csvContent = [headers, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: `${filename} exported successfully`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportReadings = () => {
    const exportData = readings.map(reading => ({
      meter_id: reading.meter_id,
      meter_number: reading.meter?.meter_number || '',
      utility_type: reading.meter?.utility_type || '',
      location: reading.meter?.location || '',
      reading_date: reading.reading_date,
      reading_value: reading.reading_value,
      consumption: reading.consumption || 0,
      cost_per_unit: reading.cost_per_unit || 0,
      total_cost: reading.total_cost || 0,
      reading_method: reading.reading_method,
      notes: reading.notes || ''
    }));
    
    exportToCSV(exportData, 'utility_readings');
  };

  const exportMeters = () => {
    const exportData = meters.map(meter => ({
      id: meter.id,
      meter_number: meter.meter_number,
      utility_type: meter.utility_type,
      location: meter.location,
      floor: meter.floor,
      zone: meter.zone || '',
      installation_date: meter.installation_date || '',
      last_reading_date: meter.last_reading_date || '',
      last_reading_value: meter.last_reading_value || 0,
      unit_of_measurement: meter.unit_of_measurement,
      meter_status: meter.meter_status,
      supplier_name: meter.supplier_name || '',
      contract_number: meter.contract_number || '',
      monthly_budget: meter.monthly_budget || 0
    }));
    
    exportToCSV(exportData, 'utility_meters');
  };

  const exportBudgets = () => {
    const exportData = budgetAllocations.map(allocation => ({
      cost_center: allocation.cost_center?.name || '',
      cost_center_code: allocation.cost_center?.code || '',
      allocation_month: allocation.allocation_month,
      category: allocation.category,
      allocated_amount: allocation.allocated_amount,
      spent_amount: allocation.spent_amount || 0,
      remaining_amount: allocation.allocated_amount - (allocation.spent_amount || 0),
      utilization_percentage: ((allocation.spent_amount || 0) / allocation.allocated_amount * 100).toFixed(2)
    }));
    
    exportToCSV(exportData, 'budget_allocations');
  };

  const generateAnalyticsReport = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthReadings = readings.filter(r => r.reading_date.startsWith(currentMonth));
    
    const summary = {
      report_date: new Date().toISOString().split('T')[0],
      total_readings: currentMonthReadings.length,
      total_consumption: currentMonthReadings.reduce((sum, r) => sum + (r.consumption || 0), 0),
      total_cost: currentMonthReadings.reduce((sum, r) => sum + (r.total_cost || 0), 0),
      avg_cost_per_unit: currentMonthReadings.length > 0 
        ? (currentMonthReadings.reduce((sum, r) => sum + (r.cost_per_unit || 0), 0) / currentMonthReadings.length).toFixed(2)
        : 0,
      active_meters: meters.filter(m => m.meter_status === 'active').length,
      total_meters: meters.length
    };

    const reportData = [summary];
    exportToCSV(reportData, 'monthly_analytics_summary');
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management Tools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="export" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="export" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export Data
              </TabsTrigger>
              <TabsTrigger value="import" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Import Data
              </TabsTrigger>
            </TabsList>

            <TabsContent value="export" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Utility Readings
                        </h4>
                        <p className="text-sm text-muted-foreground">Export all utility consumption data</p>
                      </div>
                      <Badge variant="secondary">{readings.length} records</Badge>
                    </div>
                    <Button 
                      onClick={exportReadings} 
                      disabled={isExporting || readings.length === 0}
                      className="w-full"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Readings
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          <Database className="h-4 w-4" />
                          Utility Meters
                        </h4>
                        <p className="text-sm text-muted-foreground">Export meter configuration data</p>
                      </div>
                      <Badge variant="secondary">{meters.length} meters</Badge>
                    </div>
                    <Button 
                      onClick={exportMeters} 
                      disabled={isExporting || meters.length === 0}
                      className="w-full"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Meters
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Budget Allocations
                        </h4>
                        <p className="text-sm text-muted-foreground">Export budget and spending data</p>
                      </div>
                      <Badge variant="secondary">{budgetAllocations.length} allocations</Badge>
                    </div>
                    <Button 
                      onClick={exportBudgets} 
                      disabled={isExporting || budgetAllocations.length === 0}
                      className="w-full"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Budgets
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Analytics Report
                        </h4>
                        <p className="text-sm text-muted-foreground">Generate monthly summary report</p>
                      </div>
                      <Badge variant="outline">Monthly</Badge>
                    </div>
                    <Button 
                      onClick={generateAnalyticsReport} 
                      disabled={isExporting}
                      className="w-full"
                      size="sm"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="import">
              <CSVImportComponent />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};