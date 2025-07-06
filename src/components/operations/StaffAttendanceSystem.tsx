import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QrCode, Clock, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { QRScanner } from '@/components/security/QRScanner';
import { useStaffAttendance } from '@/hooks/useStaffAttendance';
import { format } from 'date-fns';

export const StaffAttendanceSystem: React.FC = () => {
  const [showScanner, setShowScanner] = useState(false);
  const { 
    activeAttendance, 
    availableZones, 
    isLoading, 
    checkIn, 
    checkOut, 
    getTodaysAttendance 
  } = useStaffAttendance();

  const handleQRScan = async (qrData: any) => {
    if (qrData.type === 'attendance') {
      const success = await checkIn(qrData);
      if (success) {
        setShowScanner(false);
      }
    }
  };

  const handleCheckOut = async () => {
    await checkOut();
  };

  const todaysAttendance = getTodaysAttendance();

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Clock className="h-5 w-5" />
            Attendance Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeAttendance ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Badge className="bg-green-600 mb-2">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Checked In
                  </Badge>
                  <p className="text-sm text-gray-300">
                    Zone: {activeAttendance.zone_qr_code}
                  </p>
                  <p className="text-sm text-gray-400">
                    Since: {format(new Date(activeAttendance.check_in_time), 'HH:mm')}
                  </p>
                </div>
                <Button 
                  onClick={handleCheckOut}
                  disabled={isLoading}
                  variant="destructive"
                >
                  Check Out
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <Badge variant="secondary" className="bg-gray-600">
                <XCircle className="h-3 w-3 mr-1" />
                Not Checked In
              </Badge>
              <Button 
                onClick={() => setShowScanner(true)}
                disabled={isLoading}
                className="bg-plaza-blue hover:bg-blue-700"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Scan QR to Check In
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Scanner */}
      {showScanner && (
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Scan Zone QR Code</CardTitle>
          </CardHeader>
          <CardContent>
            <QRScanner onVisitorScanned={() => setShowScanner(false)} />
            <Button 
              onClick={() => setShowScanner(false)}
              variant="outline"
              className="w-full mt-4"
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Available Zones */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Available Zones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {availableZones.map((zone) => (
              <div 
                key={zone.id}
                className="p-3 bg-background/20 rounded-lg border border-border"
              >
                <h4 className="font-medium text-white capitalize">
                  {zone.zone_name.replace(/_/g, ' ')}
                </h4>
                <p className="text-sm text-gray-400">Floor {zone.floor}</p>
                {zone.location_description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {zone.location_description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Today's Attendance History */}
      {todaysAttendance.length > 0 && (
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Today's Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todaysAttendance.map((record) => (
                <div 
                  key={record.id}
                  className="flex items-center justify-between p-3 bg-background/20 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-white capitalize">
                      {record.zone_qr_code.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm text-gray-400">
                      In: {format(new Date(record.check_in_time), 'HH:mm')}
                      {record.check_out_time && (
                        <span> | Out: {format(new Date(record.check_out_time), 'HH:mm')}</span>
                      )}
                    </p>
                  </div>
                  <Badge 
                    className={record.check_out_time ? 'bg-gray-600' : 'bg-green-600'}
                  >
                    {record.check_out_time ? 'Completed' : 'Active'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};