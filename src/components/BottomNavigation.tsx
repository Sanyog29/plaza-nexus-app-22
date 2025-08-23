
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MessageSquare, Calendar, User, Coffee } from 'lucide-react';

const BottomNavigation: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-10">
      <div className="flex justify-around items-center h-16">
        <NavLink 
          to="/" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-full py-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`
          }
          end
        >
          <Home size={20} />
          <span className="text-xs mt-1">Home</span>
        </NavLink>
        
        <NavLink 
          to="/requests" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-full py-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`
          }
        >
          <MessageSquare size={20} />
          <span className="text-xs mt-1">Requests</span>
        </NavLink>
        
        <NavLink 
          to="/services" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-full py-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`
          }
        >
          <Coffee size={20} />
          <span className="text-xs mt-1">Services</span>
        </NavLink>
        
        <NavLink 
          to="/bookings" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-full py-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`
          }
        >
          <Calendar size={20} />
          <span className="text-xs mt-1">Bookings</span>
        </NavLink>
        
        <NavLink 
          to="/profile" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-full py-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`
          }
        >
          <User size={20} />
          <span className="text-xs mt-1">Profile</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default BottomNavigation;
