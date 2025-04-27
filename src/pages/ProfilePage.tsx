
import React from 'react';
import { Settings, User, Building, LogOut, FileText, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ProfilePage = () => {
  // Mock user data
  const userData = {
    name: "Alex Johnson",
    email: "alex.johnson@company.com",
    role: "Tenant",
    company: "Acme Corp",
    floor: "4th Floor",
    profileImage: "https://i.pravatar.cc/150?img=11"
  };

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">My Profile</h2>
        <Button variant="ghost" size="icon">
          <Settings size={20} className="text-gray-400" />
        </Button>
      </div>
      
      <div className="flex flex-col items-center bg-card rounded-lg p-6 card-shadow mb-8">
        <div className="relative mb-4">
          <img 
            src={userData.profileImage} 
            alt={userData.name} 
            className="w-20 h-20 rounded-full object-cover"
          />
          <div className="absolute -bottom-1 -right-1 bg-plaza-blue rounded-full p-1">
            <User size={16} className="text-white" />
          </div>
        </div>
        
        <h3 className="text-xl font-semibold text-white">{userData.name}</h3>
        <p className="text-gray-400 text-sm">{userData.email}</p>
        
        <div className="flex items-center mt-2">
          <span className="text-xs bg-plaza-blue bg-opacity-20 text-plaza-blue px-2 py-1 rounded">
            {userData.role}
          </span>
        </div>
        
        <div className="w-full border-t border-gray-700 mt-6 pt-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center">
              <Building size={18} className="text-gray-400 mr-2" />
              <span>{userData.company}</span>
            </div>
            <span>{userData.floor}</span>
          </div>
        </div>
      </div>
      
      <div className="bg-card rounded-lg card-shadow">
        <div className="px-4 py-3 border-b border-gray-700">
          <h4 className="text-lg font-medium text-white">Account Settings</h4>
        </div>
        
        <div className="divide-y divide-gray-700">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <Bell size={18} className="text-gray-400 mr-3" />
              <span className="text-white">Notifications</span>
            </div>
            <Button variant="ghost" size="sm" className="text-plaza-blue hover:text-plaza-blue">
              Manage
            </Button>
          </div>
          
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <FileText size={18} className="text-gray-400 mr-3" />
              <span className="text-white">My Requests</span>
            </div>
            <Button variant="ghost" size="sm" className="text-plaza-blue hover:text-plaza-blue">
              View
            </Button>
          </div>
          
          <div className="px-4 py-3">
            <Button variant="destructive" className="w-full flex items-center justify-center" size="sm">
              <LogOut size={18} className="mr-2" />
              Log Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
