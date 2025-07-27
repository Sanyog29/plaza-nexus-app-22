import React from 'react';
import { useAuth } from '@/components/AuthProvider';
import { MobileFieldDashboard } from '@/components/mobile/MobileFieldDashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone } from 'lucide-react';

export default function StaffMobilePage() {
  const { userRole, isStaff } = useAuth();
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isStaff) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Staff Access Required</h2>
            <p className="text-muted-foreground mb-4">
              This mobile interface is designed for facility staff members only.
            </p>
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isMobile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-blue-500/20">
                <Smartphone className="h-8 w-8 text-blue-400" />
              </div>
            </div>
            <h2 className="text-xl font-semibold">Mobile Interface</h2>
            <p className="text-muted-foreground">
              This interface is optimized for mobile devices. Please access from a smartphone or tablet for the best experience.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => window.history.back()}>
                Desktop View
              </Button>
              <Button onClick={() => setIsMobile(true)}>
                <Monitor className="h-4 w-4 mr-2" />
                Preview Mobile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <MobileFieldDashboard />;
}