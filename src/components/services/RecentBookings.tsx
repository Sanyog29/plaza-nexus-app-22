
import { Car, CalendarClock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const RecentBookings = () => {
  return (
    <Card className="bg-card/50 backdrop-blur mb-6">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium text-white">Recent Bookings</h3>
          <Button variant="link" className="text-plaza-blue p-0">View All</Button>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 rounded-md bg-card/60">
            <div className="flex items-center gap-3">
              <div className="bg-plaza-blue bg-opacity-20 p-2 rounded-full">
                <Car size={18} className="text-plaza-blue" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Plaza Cab</p>
                <div className="flex items-center text-xs text-gray-400">
                  <CalendarClock size={12} className="mr-1" />
                  <span>Today, 5:30 PM</span>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-yellow-500 border-yellow-500">Confirmed</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentBookings;
