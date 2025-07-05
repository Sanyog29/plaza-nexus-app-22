import React from 'react';
import { Building, Info, Phone, Mail } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from '@/components/ui/separator';

const WelcomeCard = () => {
  return (
    <Card className="bg-gradient-to-br from-plaza-blue to-blue-700 text-white p-6 hidden md:block">
      <CardHeader>
        <div className="flex items-center gap-3 mb-4">
          <Building className="h-10 w-10" />
          <div>
            <h1 className="text-2xl font-bold">SS Plaza</h1>
            <p className="text-sm opacity-90">Powered by Autopilot Offices</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Info size={18} />
            Building Features
          </h3>
          <ul className="list-disc list-inside text-sm space-y-1 opacity-90">
            <li>24/7 Access Control & Security</li>
            <li>Smart Building Management</li>
            <li>Modern Meeting Facilities</li>
            <li>Premium Cafeteria Services</li>
          </ul>
        </div>
        <Separator className="bg-white/20" />
        <div>
          <h3 className="font-semibold mb-2">Need Help?</h3>
          <div className="text-sm opacity-90 space-y-1">
            <p className="flex items-center gap-2">
              <Phone size={14} />
              Support: +91 80 4123 5000
            </p>
            <p className="flex items-center gap-2">
              <Mail size={14} />
              Email: support@ssplaza.com
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WelcomeCard;