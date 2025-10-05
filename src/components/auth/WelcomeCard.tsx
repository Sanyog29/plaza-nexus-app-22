import React from 'react';
import { Building, Info, Phone, Mail } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from '@/components/ui/separator';

const WelcomeCard = () => {
  const currentHour = new Date().getHours();
  const getGreeting = () => {
    if (currentHour < 12) return 'Good Morning';
    if (currentHour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getTimeBasedMessage = () => {
    if (currentHour < 12) return 'Start your day with seamless facility management';
    if (currentHour < 17) return 'Continue managing your workspace efficiently';
    return 'Access your tenant services anytime';
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary-glow text-primary-foreground p-0 hidden md:block animate-fade-in-up">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-white/20 to-transparent rounded-full -translate-x-48 -translate-y-48" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-gradient-to-tl from-white/20 to-transparent rounded-full translate-x-36 translate-y-36" />
      </div>
      
      <CardHeader className="relative z-10 p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
            <Building className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">AUTOPILOT</h1>
            <p className="text-sm opacity-90 font-medium">Professional Building Management</p>
          </div>
        </div>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">{getGreeting()}!</h2>
          <p className="opacity-90">{getTimeBasedMessage()}</p>
        </div>
      </CardHeader>
      <CardContent className="relative z-10 px-8 pb-8 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Info size={16} />
            </div>
            <h3 className="font-semibold text-lg">Premium Features</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {[
              { icon: '🔒', text: '24/7 Security & Access Control' },
              { icon: '🏢', text: 'Smart Building Automation' },
              { icon: '🤝', text: 'Professional Meeting Spaces' },
              { icon: '☕', text: 'Premium Dining & Cafeteria' },
              { icon: '🚗', text: 'Dedicated Parking Solutions' },
              { icon: '📱', text: 'Mobile-First Experience' }
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                <span className="text-lg">{feature.icon}</span>
                <span className="text-sm font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
        
        <Separator className="bg-white/30" />
        
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Phone size={16} />
            </div>
            <h3 className="font-semibold">24/7 Support</h3>
          </div>
          
          <div className="space-y-2 pl-11">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Phone size={14} />
              +91 80 4123 5000
            </p>
            <p className="flex items-center gap-2 text-sm font-medium">
              <Mail size={14} />
              support@autopilot.com
            </p>
            <p className="text-xs opacity-75 mt-2">
              Our dedicated support team is available around the clock to assist you.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WelcomeCard;