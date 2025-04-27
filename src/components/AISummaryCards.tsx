
import React from 'react';
import { ListTodo, Users, CalendarClock, BellRing } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const AISummaryCards = () => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <Card className="bg-card/50 backdrop-blur hover:bg-card/60 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-2 rounded-full">
              <ListTodo size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Team Tasks</p>
              <p className="text-xs text-blue-500">5 tasks pending for your team</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur hover:bg-card/60 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/20 p-2 rounded-full">
              <Users size={20} className="text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Room Occupancy</p>
              <p className="text-xs text-purple-500">Meeting room occupancy at 76% today</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur hover:bg-card/60 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/20 p-2 rounded-full">
              <CalendarClock size={20} className="text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Next Maintenance</p>
              <p className="text-xs text-amber-500">Fire Alarm Testing at 3 PM</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur hover:bg-card/60 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-500/20 p-2 rounded-full">
              <BellRing size={20} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Zone Alert</p>
              <p className="text-xs text-red-500">Your zone: Maintenance scheduled</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AISummaryCards;
