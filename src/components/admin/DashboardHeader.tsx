import React from 'react';
import { Button } from '@/components/ui/button';
import { ServerCog, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DashboardHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Admin Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Real-time building operations and analytics</p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => navigate('/admin/content')}
        >
          <ServerCog size={16} />
          Manage Content
        </Button>
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => navigate('/admin/users')}
        >
          <Users size={16} />
          Manage Users
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;