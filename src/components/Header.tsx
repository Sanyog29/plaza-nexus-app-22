
import React from 'react';
import { Book, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NotificationCenter } from './notifications/NotificationCenter';
import { SmartBreadcrumb } from './ui/smart-breadcrumb';
import { ThemeToggle } from './theme/ThemeToggle';
import { Button } from './ui/button';
import { useAuth } from './AuthProvider';
import AvailabilityToggle from './availability/AvailabilityToggle';

const Header: React.FC = () => {
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="sticky top-0 z-10 px-4 py-3 bg-surface border-b border-border glass-effect">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-2">
            <h1 className="text-lg font-bold text-foreground">SS Plaza</h1>
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          {/* Show availability toggle for staff only */}
          {user && (
            <AvailabilityToggle />
          )}
          <Link 
            to="/manual" 
            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            title="User Manual"
          >
            <Book className="h-5 w-5" />
            <span className="hidden sm:inline">Manual</span>
          </Link>
          <NotificationCenter />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-foreground hover:text-primary transition-colors p-2"
            title="Sign Out"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Breadcrumbs */}
      <div className="px-4 py-2 border-t border-border/20">
        <SmartBreadcrumb showIcons={true} showHomeIcon={true} maxItems={4} />
      </div>
    </header>
  );
};

export default Header;
