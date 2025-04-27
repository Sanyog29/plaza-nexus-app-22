
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface TicketManagementProps {
  tickets: any[];
  getStatusBadge: (status: string) => JSX.Element;
  getPriorityBadge: (priority: string) => JSX.Element;
}

const TicketManagement = ({ tickets, getStatusBadge, getPriorityBadge }: TicketManagementProps) => {
  return (
    <Card className="bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-white text-lg">Ticket Management Pipeline</CardTitle>
        <CardDescription>Active and recent maintenance tickets</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead>Ticket</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id} className="border-border">
                <TableCell>
                  <div className="font-medium text-white">{ticket.title}</div>
                </TableCell>
                <TableCell>
                  {getPriorityBadge(ticket.priority)}
                </TableCell>
                <TableCell>
                  {getStatusBadge(ticket.status)}
                </TableCell>
                <TableCell className="text-gray-400">
                  {ticket.assignedTo}
                </TableCell>
                <TableCell className="text-gray-400">
                  {format(new Date(ticket.createdAt), 'PP')}
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

export default TicketManagement;
