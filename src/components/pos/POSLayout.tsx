import React from 'react';
import { Outlet } from 'react-router-dom';
import { POSSidebar } from './POSSidebar';
import { POSHeader } from './POSHeader';
import { ScrollArea } from '@/components/ui/scroll-area';

const POSLayout = () => {
  return (
    <div className="flex h-screen bg-background">
      <POSSidebar />
      <div className="flex-1 flex flex-col">
        <POSHeader />
        <main className="flex-1 overflow-hidden">
          <ScrollArea className="h-full w-full">
            <div className="min-w-max h-full">
              <Outlet />
            </div>
          </ScrollArea>
        </main>
      </div>
    </div>
  );
};

export default POSLayout;