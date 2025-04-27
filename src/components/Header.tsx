
import React from 'react';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-10 px-4 py-3 bg-plaza-dark border-b border-border glass-effect">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center space-x-2">
            <h1 className="text-lg font-bold text-white">SS Plaza</h1>
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/alerts" className="relative">
            <Bell className="h-5 w-5 text-white" />
            <span className="absolute -top-1 -right-1 bg-plaza-blue text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              3
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
