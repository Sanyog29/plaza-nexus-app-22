import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Smartphone, 
  Wifi, 
  Download, 
  Upload,
  CheckCircle,
  Clock,
  MapPin
} from 'lucide-react';

const MobileInterface: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mobile Optimization</h1>
          <p className="text-muted-foreground">
            Optimized interface for field staff mobile devices
          </p>
        </div>
        <Smartphone className="h-8 w-8 text-primary" />
      </div>

      {isMobile && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Mobile Mode Active</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button className="h-16 flex-col">
                <CheckCircle className="h-6 w-6 mb-2" />
                Complete Task
              </Button>
              <Button variant="outline" className="h-16 flex-col">
                <MapPin className="h-6 w-6 mb-2" />
                Check Location
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Offline Capabilities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5 text-blue-600" />
                <span>Task Data Synced</span>
              </div>
              <Badge variant="default">Ready</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Upload className="h-5 w-5 text-green-600" />
                <span>Pending Uploads</span>
              </div>
              <Badge variant="secondary">3 items</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Wifi className="h-5 w-5 text-green-600" />
                <span>Network Status</span>
              </div>
              <Badge variant="default">Online</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MobileInterface;