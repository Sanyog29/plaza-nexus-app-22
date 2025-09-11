import React from 'react';
import { Outlet } from 'react-router-dom';
import { POSSidebar } from './POSSidebar';
import { POSHeader } from './POSHeader';

const POSLayout = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <POSSidebar />
      <div className="flex-1 flex flex-col">
        <POSHeader />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default POSLayout;