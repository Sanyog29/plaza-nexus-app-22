import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Building, 
  Zap, 
  BarChart3, 
  TrendingUp, 
  Settings, 
  Users, 
  Shield,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileAdminTabsProps {
  tabComponents: Record<string, React.ReactNode>;
}

const tabConfig = [
  { key: 'dashboard', label: 'Dashboard', icon: Home, color: 'text-primary' },
  { key: 'assets', label: 'Assets', icon: Building, color: 'text-blue-600' },
  { key: 'utilities', label: 'Utilities', icon: Zap, color: 'text-yellow-600' },
  { key: 'analytics', label: 'Analytics', icon: BarChart3, color: 'text-green-600' },
  { key: 'performance', label: 'Performance', icon: TrendingUp, color: 'text-purple-600' },
  { key: 'workflows', label: 'Automation', icon: Settings, color: 'text-orange-600' },
  { key: 'users', label: 'Users', icon: Users, color: 'text-indigo-600' },
  { key: 'security', label: 'Security', icon: Shield, color: 'text-red-600' }
];

export function MobileAdminTabs({ tabComponents }: MobileAdminTabsProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expanded, setExpanded] = useState(false);

  const activeTabConfig = tabConfig.find(tab => tab.key === activeTab);
  const ActiveIcon = activeTabConfig?.icon || Home;

  return (
    <div className="mt-6 space-y-4">
      {/* Mobile Tab Selector */}
      <Card>
        <CardContent className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-between h-auto p-3"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-center gap-3">
              <ActiveIcon className={cn("h-5 w-5", activeTabConfig?.color)} />
              <span className="font-medium">{activeTabConfig?.label}</span>
              <Badge variant="secondary" className="ml-2">
                {tabConfig.findIndex(tab => tab.key === activeTab) + 1} / {tabConfig.length}
              </Badge>
            </div>
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {expanded && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {tabConfig.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                
                return (
                  <Button
                    key={tab.key}
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "justify-start h-auto p-3",
                      isActive && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => {
                      setActiveTab(tab.key);
                      setExpanded(false);
                    }}
                  >
                    <Icon className={cn(
                      "h-4 w-4 mr-2",
                      isActive ? "text-primary-foreground" : tab.color
                    )} />
                    <span className="text-sm">{tab.label}</span>
                  </Button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {tabComponents[activeTab]}
      </div>

      {/* Quick Navigation Pills */}
      <div className="flex gap-2 pb-4 overflow-x-auto">
        {tabConfig.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          
          return (
            <Button
              key={tab.key}
              variant={isActive ? "default" : "outline"}
              size="sm"
              className={cn(
                "flex-shrink-0 h-8",
                !isActive && "text-muted-foreground"
              )}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon className="h-3 w-3 mr-1" />
              {tab.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}