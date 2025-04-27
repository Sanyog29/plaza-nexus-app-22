
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface SLAComplianceReportProps {
  slaCompliance: any[];
  getTrendBadge: (trend: string) => JSX.Element;
}

const SLAComplianceReport = ({ slaCompliance, getTrendBadge }: SLAComplianceReportProps) => {
  return (
    <Card className="bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-white text-lg">Monthly SLA Compliance Reports</CardTitle>
        <CardDescription>April 2025</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead>Category</TableHead>
              <TableHead>Target Response</TableHead>
              <TableHead>Actual Response</TableHead>
              <TableHead>Compliance</TableHead>
              <TableHead>Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slaCompliance.map((item) => (
              <TableRow key={item.id} className="border-border">
                <TableCell>
                  <div className="font-medium text-white">{item.category}</div>
                </TableCell>
                <TableCell className="text-gray-400">
                  {item.target}
                </TableCell>
                <TableCell className="text-gray-400">
                  {item.actual}
                </TableCell>
                <TableCell className="text-gray-400">
                  {item.compliance}
                </TableCell>
                <TableCell>
                  {getTrendBadge(item.trend)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default SLAComplianceReport;
