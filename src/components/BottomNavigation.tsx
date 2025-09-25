
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, User, Coffee } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const BottomNavigation: React.FC = () => {
  const handleComingSoon = (feature: string) => {
    toast({
      title: "Coming Soon! 🚀",
      description: `${feature} feature will be available soon. Stay tuned!`,
    });
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-10">
      <div className="flex justify-around items-center h-16">
        <NavLink 
          to="/" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-full py-2 min-h-[44px] ${isActive ? 'text-primary' : 'text-muted-foreground'}`
          }
          end
        >
          <Home size={20} />
          <span className="text-xs mt-1">Home</span>
        </NavLink>
        
        <NavLink 
          to="/cafeteria" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-full py-2 min-h-[44px] ${isActive ? 'text-primary' : 'text-muted-foreground'}`
          }
        >
          <Coffee size={20} />
          <span className="text-xs mt-1">Order</span>
        </NavLink>
        
        <button
          onClick={() => handleComingSoon('Services')}
          className="flex flex-col items-center justify-center w-full py-2 min-h-[44px] text-muted-foreground hover:text-primary transition-colors"
        >
          <Coffee size={20} />
          <span className="text-xs mt-1">Services</span>
        </button>
        
        <button
          onClick={() => handleComingSoon('Community')}
          className="flex flex-col items-center justify-center w-full py-2 min-h-[44px] text-muted-foreground hover:text-primary transition-colors"
        >
          <Users size={20} />
          <span className="text-xs mt-1">Community</span>
        </button>
        
        <NavLink 
          to="/profile" 
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-full py-2 min-h-[44px] ${isActive ? 'text-primary' : 'text-muted-foreground'}`
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
