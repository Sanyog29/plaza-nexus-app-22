import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { 
  Home, 
  Calendar, 
  Wrench, 
  CreditCard, 
  Bell 
} from 'lucide-react';

interface MobileTenantTabsProps {
  tabComponents: Record<string, React.ReactNode>;
}

export function MobileTenantTabs({ tabComponents }: MobileTenantTabsProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expanded, setExpanded] = useState(false);

  const tabConfig = [
    { key: 'dashboard', label: 'Dashboard', icon: Home, color: 'text-blue-500' },
    { key: 'booking', label: 'Book Room', icon: Calendar, color: 'text-green-500' },
    { key: 'requests', label: 'Requests', icon: Wrench, color: 'text-orange-500' },
    { key: 'billing', label: 'Billing', icon: CreditCard, color: 'text-purple-500' },
    { key: 'notifications', label: 'Notifications', icon: Bell, color: 'text-red-500' }
  ];

  const currentTab = tabConfig.find(tab => tab.key === activeTab);

  return (
    <div className="space-y-4">
      {/* Mobile Tab Selector */}
      <Card className="mx-4 mt-4">
        <CardContent className="p-0">
          <Button
            variant="ghost"
            className="w-full p-4 justify-between hover:bg-muted/50"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-center gap-3">
              {currentTab && (
                <>
                  <currentTab.icon className={`h-5 w-5 ${currentTab.color}`} />
                  <span className="font-medium">{currentTab.label}</span>
                </>
              )}
            </div>
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          
          {expanded && (
            <div className="border-t p-4 grid grid-cols-2 gap-3">
              {tabConfig.map((tab) => (
                <Button
                  key={tab.key}
                  variant={activeTab === tab.key ? "default" : "outline"}
                  size="sm"
                  className="justify-start gap-2 h-12"
                  onClick={() => {
                    setActiveTab(tab.key);
                    setExpanded(false);
                  }}
                >
                  <tab.icon className={`h-4 w-4 ${activeTab === tab.key ? 'text-white' : tab.color}`} />
                  <span className="text-xs">{tab.label}</span>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tab Content */}
      <div className="flex-1">
        {tabComponents[activeTab]}
      </div>

      {/* Quick Navigation Pills */}
      <div className="px-4 pb-20">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabConfig.map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "default" : "outline"}
              size="sm"
              className="flex-shrink-0 gap-2 text-xs"
              onClick={() => setActiveTab(tab.key)}
            >
              <tab.icon className={`h-3 w-3 ${activeTab === tab.key ? 'text-white' : tab.color}`} />
              {tab.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}