
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface StaffAttendanceProps {
  staff: any[];
  getStatusBadge: (status: string) => JSX.Element;
}

const StaffAttendance = ({ staff, getStatusBadge }: StaffAttendanceProps) => {
  return (
    <Card className="bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-white text-lg">Staff Attendance Tracking</CardTitle>
        <CardDescription>Current staff status and assignments</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead>Staff Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Current Task</TableHead>
              <TableHead>Attendance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((person) => (
              <TableRow key={person.id} className="border-border">
                <TableCell>
                  <div className="font-medium text-white">{person.name}</div>
                </TableCell>
                <TableCell className="text-gray-400">
                  {person.role}
                </TableCell>
                <TableCell>
                  {getStatusBadge(person.status)}
                </TableCell>
                <TableCell className="text-gray-400">
                  {person.currentTask}
                </TableCell>
                <TableCell>
                  {getStatusBadge(person.attendance)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default StaffAttendance;
