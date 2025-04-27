
import React from 'react';
import { MessageSquare, Calendar, Coffee, Bell, FileText } from 'lucide-react';
import DashboardTile from '../components/DashboardTile';

const HomePage = () => {
  const userName = "Alex"; // This would come from authentication
  
  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Welcome, {userName}</h2>
        <p className="text-gray-400 text-sm">Tuesday, April 27</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        <DashboardTile 
          title="Raise Request"
          icon={<MessageSquare size={24} className="text-white" />}
          to="/requests/new"
          bgColor="bg-gradient-to-br from-plaza-blue to-blue-700"
          count={0}
        />
        
        <DashboardTile 
          title="Book Room"
          icon={<Calendar size={24} className="text-white" />}
          to="/bookings"
          bgColor="bg-gradient-to-br from-purple-600 to-purple-800"
          count={2}
        />
        
        <DashboardTile 
          title="Cafeteria"
          icon={<Coffee size={24} className="text-white" />}
          to="/cafeteria"
          bgColor="bg-gradient-to-br from-amber-600 to-amber-800"
        />
        
        <DashboardTile 
          title="Alerts"
          icon={<Bell size={24} className="text-white" />}
          to="/alerts"
          bgColor="bg-gradient-to-br from-red-600 to-red-800"
          count={3}
        />
      </div>
      
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">Building Info</h3>
          <a href="/info-hub" className="text-plaza-blue text-sm">View All</a>
        </div>
        
        <div className="bg-card rounded-lg p-4 card-shadow">
          <div className="flex items-center">
            <div className="bg-plaza-blue bg-opacity-20 p-2 rounded-lg mr-4">
              <FileText size={24} className="text-plaza-blue" />
            </div>
            <div>
              <h4 className="font-medium text-white">SS Plaza Directory</h4>
              <p className="text-sm text-gray-400">Floor plans & contacts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
