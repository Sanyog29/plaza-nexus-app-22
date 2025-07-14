import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MaintenanceNewPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/staff/maintenance')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Maintenance
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Start Maintenance</h1>
            <p className="text-muted-foreground mt-2">
              Begin a new maintenance activity
            </p>
          </div>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Maintenance Activity
            </CardTitle>
            <CardDescription>
              Record details of the maintenance work
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="activityTitle">Activity Title</Label>
              <Input id="activityTitle" placeholder="Enter maintenance activity title" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Describe the maintenance work being performed" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maintenanceType">Maintenance Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preventive">Preventive</SelectItem>
                    <SelectItem value="corrective">Corrective</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="Building/Room/Area" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedDuration">Estimated Duration (hours)</Label>
                <Input id="estimatedDuration" type="number" placeholder="2" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="equipment">Equipment/Asset</Label>
              <Input id="equipment" placeholder="Equipment or asset being maintained" />
            </div>
            
            <div className="flex gap-4 pt-4">
              <Button className="flex-1">
                Start Maintenance
              </Button>
              <Button variant="outline" onClick={() => navigate('/staff/maintenance')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}