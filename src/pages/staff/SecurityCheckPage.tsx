import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SecurityCheckPage() {
  const navigate = useNavigate();

  const securityItems = [
    { id: "doors", label: "All doors properly locked" },
    { id: "windows", label: "Windows secure" },
    { id: "alarms", label: "Security alarms active" },
    { id: "cameras", label: "CCTV systems operational" },
    { id: "lights", label: "Security lighting functional" },
    { id: "access", label: "Access control systems working" },
    { id: "fire", label: "Fire safety equipment accessible" },
    { id: "emergency", label: "Emergency exits clear" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/staff/security')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Security
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Security Check</h1>
            <p className="text-muted-foreground mt-2">
              Perform routine security inspection
            </p>
          </div>
        </div>

        <div className="grid gap-6 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Checklist
              </CardTitle>
              <CardDescription>
                Complete the security inspection checklist
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="checkLocation">Location/Zone</Label>
                  <Input id="checkLocation" placeholder="Enter area being checked" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="checkTime">Check Time</Label>
                  <Input id="checkTime" type="time" />
                </div>
              </div>
              
              <div className="space-y-4">
                <Label className="text-base font-medium">Security Items</Label>
                <div className="grid gap-3">
                  {securityItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <Checkbox id={item.id} />
                      <Label htmlFor={item.id} className="text-sm">
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="observations">Observations/Issues</Label>
                <Textarea 
                  id="observations" 
                  placeholder="Note any security issues or observations"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Incident Reporting
              </CardTitle>
              <CardDescription>
                Report any security incidents or anomalies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="incidentType">Incident Type</Label>
                <Input id="incidentType" placeholder="Type of incident (if any)" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="incidentDetails">Incident Details</Label>
                <Textarea 
                  id="incidentDetails" 
                  placeholder="Detailed description of any incidents"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="actionTaken">Action Taken</Label>
                <Textarea 
                  id="actionTaken" 
                  placeholder="Describe any immediate actions taken"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button className="flex-1 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Complete Security Check
            </Button>
            <Button variant="outline" onClick={() => navigate('/staff/security')}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}