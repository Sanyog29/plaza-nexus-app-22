
import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const RequestDetailsPage = () => {
  const { requestId } = useParams();
  
  // For now using static data - would be fetched from API in real implementation
  const request = {
    id: requestId,
    title: 'AC not working in Meeting Room B',
    category: 'Maintenance',
    priority: 'high',
    status: 'In Progress',
    createdAt: '2025-04-25T10:30:00',
    updatedAt: '2025-04-25T14:15:00',
    assignedTo: 'Technical Team',
    eta: '2025-04-25T16:30:00',
    description: 'The air conditioning unit is not cooling properly. Temperature is consistently above 26°C.'
  };

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <Link to="/requests">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Requests
          </Button>
        </Link>
      </div>

      <Card className="bg-card">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{request.title}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Badge variant="outline">{request.category}</Badge>
                  <Badge 
                    variant={request.priority === 'high' ? 'destructive' : 'default'}
                    className="capitalize"
                  >
                    {request.priority} Priority
                  </Badge>
                </div>
              </div>
              <Badge 
                className="capitalize"
                variant={request.status === 'In Progress' ? 'default' : 'secondary'}
              >
                {request.status}
              </Badge>
            </div>

            <div className="grid gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="h-4 w-4" />
                <span>Created: {new Date(request.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <MessageSquare className="h-4 w-4" />
                <span>Assigned to: {request.assignedTo}</span>
              </div>
              {request.eta && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>ETA: {new Date(request.eta).toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="mt-4">
              <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
              <p className="text-gray-400">{request.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestDetailsPage;
