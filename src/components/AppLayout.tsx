
import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';
import Header from './Header';

const AppLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-plaza-dark">
      <Header />
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
      <BottomNavigation />
    </div>
  );
};

export default AppLayout;
