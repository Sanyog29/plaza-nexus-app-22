
import React, { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';

// Sample room data
const roomsData = [
  {
    id: 'room-001',
    name: 'Conference Room A',
    capacity: 12,
    floor: '4th Floor',
    facilities: ['Projector', 'Video Conference'],
    availability: [
      { time: '09:00', available: true },
      { time: '10:00', available: true },
      { time: '11:00', available: false },
      { time: '12:00', available: true },
      { time: '13:00', available: true },
      { time: '14:00', available: false },
      { time: '15:00', available: false },
      { time: '16:00', available: true },
    ],
  },
  {
    id: 'room-002',
    name: 'Meeting Room B',
    capacity: 6,
    floor: '4th Floor',
    facilities: ['TV Screen'],
    availability: [
      { time: '09:00', available: true },
      { time: '10:00', available: true },
      { time: '11:00', available: true },
      { time: '12:00', available: false },
      { time: '13:00', available: false },
      { time: '14:00', available: true },
      { time: '15:00', available: true },
      { time: '16:00', available: true },
    ],
  },
  {
    id: 'room-003',
    name: 'Training Room',
    capacity: 20,
    floor: '3rd Floor',
    facilities: ['Projector', 'Whiteboards', 'Video Conference'],
    availability: [
      { time: '09:00', available: false },
      { time: '10:00', available: false },
      { time: '11:00', available: true },
      { time: '12:00', available: true },
      { time: '13:00', available: true },
      { time: '14:00', available: true },
      { time: '15:00', available: false },
      { time: '16:00', available: false },
    ],
  },
];

const BookingsPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  
  return (
    <div className="px-4 py-6">
      <h2 className="text-2xl font-bold text-white mb-6">Book a Room</h2>
      
      <div className="mb-8">
        <h3 className="text-lg font-medium text-white mb-3">Select Date</h3>
        <div className="bg-card rounded-lg p-4 card-shadow">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="bg-card pointer-events-auto"
          />
        </div>
      </div>
      
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium text-white">Available Rooms</h3>
          <div className="text-sm text-gray-400">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'short',
              month: 'short', 
              day: 'numeric' 
            })}
          </div>
        </div>
        
        <div className="space-y-4">
          {roomsData.map((room) => (
            <div 
              key={room.id}
              className={`bg-card rounded-lg p-4 card-shadow ${
                selectedRoom === room.id ? 'border-2 border-plaza-blue' : ''
              }`}
              onClick={() => setSelectedRoom(room.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-white">{room.name}</h4>
                  <p className="text-sm text-gray-400">
                    {room.floor} • Capacity: {room.capacity}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {room.facilities.map((facility) => (
                      <span 
                        key={facility}
                        className="text-xs px-2 py-1 rounded-full bg-muted text-gray-300"
                      >
                        {facility}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-300 mb-2">Availability</h5>
                <div className="grid grid-cols-4 gap-2">
                  {room.availability.map((slot) => (
                    <Button
                      key={slot.time}
                      variant="outline"
                      size="sm"
                      disabled={!slot.available}
                      className={slot.available 
                        ? 'bg-muted hover:bg-plaza-blue hover:text-white' 
                        : 'bg-muted opacity-50'
                      }
                    >
                      {slot.time}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BookingsPage;
