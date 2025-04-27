
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ServerCog } from 'lucide-react';
import { format } from 'date-fns';

interface EquipmentMonitoringProps {
  equipment: any[];
  getStatusBadge: (status: string) => JSX.Element;
}

const EquipmentMonitoring = ({ equipment, getStatusBadge }: EquipmentMonitoringProps) => {
  return (
    <Card className="bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-white text-lg">Equipment Monitoring</CardTitle>
        <CardDescription>Real-time building systems status</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead>Equipment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Health</TableHead>
              <TableHead>Last Maintenance</TableHead>
              <TableHead>Alerts</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipment.map((item) => (
              <TableRow key={item.id} className="border-border">
                <TableCell>
                  <div className="flex items-center">
                    <ServerCog className="h-5 w-5 text-plaza-blue mr-3" />
                    <div className="font-medium text-white">{item.name}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(item.status)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <div className="w-24 h-2 bg-gray-600 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          parseInt(item.health) > 90 ? 'bg-green-600' : 
                          parseInt(item.health) > 75 ? 'bg-yellow-600' : 'bg-red-600'
                        }`}
                        style={{ width: item.health }}
                      />
                    </div>
                    <span className="ml-2 text-gray-400">{item.health}</span>
                  </div>
                </TableCell>
                <TableCell className="text-gray-400">
                  {format(new Date(item.lastMaintenance), 'PP')}
                </TableCell>
                <TableCell>
                  {item.alerts > 0 ? (
                    <Badge variant="destructive">{item.alerts}</Badge>
                  ) : (
                    <span className="text-gray-400">None</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm">
                    Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default EquipmentMonitoring;
