
import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// Sample request data
const requestData = [
  {
    id: 'req-001',
    title: 'AC not working in Meeting Room B',
    category: 'Maintenance',
    status: 'In Progress',
    createdAt: '2025-04-25T10:30:00',
    updatedAt: '2025-04-25T14:15:00',
  },
  {
    id: 'req-002',
    title: 'Request for deep cleaning',
    category: 'Cleaning',
    status: 'Completed',
    createdAt: '2025-04-23T08:45:00',
    updatedAt: '2025-04-24T11:20:00',
  },
  {
    id: 'req-003',
    title: 'WiFi connection issues',
    category: 'IT',
    status: 'New',
    createdAt: '2025-04-27T09:10:00',
    updatedAt: '2025-04-27T09:10:00',
  },
];

const RequestsPage = () => {
  return (
    <div className="px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Requests</h2>
        <Link to="/requests/new">
          <Button className="bg-plaza-blue hover:bg-blue-700">New Request</Button>
        </Link>
      </div>
      
      <div className="space-y-4">
        {requestData.map((request) => (
          <Link key={request.id} to={`/requests/${request.id}`}>
            <div className="bg-card rounded-lg p-4 card-shadow">
              <div className="flex justify-between items-start">
                <div className="flex items-start">
                  <div className="bg-plaza-blue bg-opacity-20 p-2 rounded-full mr-3 mt-1">
                    <MessageSquare size={18} className="text-plaza-blue" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{request.title}</h4>
                    <p className="text-sm text-gray-400">{request.category}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(request.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="ml-3">
                  <span 
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      request.status === 'New' 
                        ? 'bg-plaza-blue bg-opacity-20 text-plaza-blue' 
                        : request.status === 'In Progress' 
                        ? 'bg-amber-500 bg-opacity-20 text-amber-500' 
                        : 'bg-green-500 bg-opacity-20 text-green-500'
                    }`}
                  >
                    {request.status}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RequestsPage;
