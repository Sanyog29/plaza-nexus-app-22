import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  BarChart3, 
  Settings, 
  MessageSquare,
  AlertTriangle,
  FileText,
  User,
  LogOut
} from 'lucide-react';
import { useAuth } from './AuthProvider';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const AdminNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const adminNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: ClipboardList, label: 'Requests', path: '/admin/requests' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-gray-800 z-50">
      <div className="flex justify-around items-center py-2 px-4 max-w-md mx-auto">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                active 
                  ? 'text-plaza-blue bg-plaza-blue/10' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <Icon size={20} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}
        
        {/* Reports Button */}
        <button
          onClick={() => navigate('/admin/reports')}
          className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
            isActive('/admin/reports')
              ? 'text-plaza-blue bg-plaza-blue/10' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <FileText size={20} />
          <span className="text-xs mt-1 font-medium">Reports</span>
        </button>
        
        {/* Profile & Sign Out Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="flex flex-col items-center py-2 px-3 text-gray-400 hover:text-white hover:bg-gray-800/50"
            >
              <User size={20} />
              <span className="text-xs mt-1 font-medium">Profile</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card border-gray-800">
            <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>View Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-400">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default AdminNavigation;