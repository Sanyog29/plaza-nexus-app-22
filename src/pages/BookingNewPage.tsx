import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Building, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function BookingNewPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/bookings')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Bookings
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Book a Room</h1>
            <p className="text-muted-foreground mt-2">
              Reserve a meeting room or space
            </p>
          </div>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Room Booking Details
            </CardTitle>
            <CardDescription>
              Enter the details for your room reservation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Meeting Title</Label>
              <Input id="title" placeholder="Enter meeting title" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="room">Room</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conference-a">Conference Room A (10 people)</SelectItem>
                  <SelectItem value="conference-b">Conference Room B (6 people)</SelectItem>
                  <SelectItem value="meeting-1">Meeting Room 1 (4 people)</SelectItem>
                  <SelectItem value="meeting-2">Meeting Room 2 (4 people)</SelectItem>
                  <SelectItem value="boardroom">Boardroom (12 people)</SelectItem>
                  <SelectItem value="training">Training Room (20 people)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attendees">Number of Attendees</Label>
                <Input id="attendees" type="number" placeholder="4" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input id="startTime" type="time" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input id="endTime" type="time" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="equipment">Required Equipment</Label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Projector</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Whiteboard</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Video Conference</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Refreshments</span>
                </label>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Meeting Description</Label>
              <Textarea id="description" placeholder="Brief description of the meeting purpose" />
            </div>
            
            <div className="flex gap-4 pt-4">
              <Button className="flex-1 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Book Room
              </Button>
              <Button variant="outline" onClick={() => navigate('/bookings')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}