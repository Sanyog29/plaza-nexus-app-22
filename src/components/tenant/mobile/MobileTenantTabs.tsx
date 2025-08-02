import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp, Search, Plus } from 'lucide-react';
import { 
  Home, 
  Calendar, 
  Wrench, 
  CreditCard, 
  Bell,
  Coffee,
  Users,
  BarChart3,
  Settings,
  Zap
} from 'lucide-react';

interface MobileTenantTabsProps {
  tabComponents: Record<string, React.ReactNode>;
}

export function MobileTenantTabs({ tabComponents }: MobileTenantTabsProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expanded, setExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const tabConfig = [
    { 
      key: 'dashboard', 
      label: 'Dashboard', 
      icon: Home, 
      gradient: 'from-blue-500 to-blue-600',
      description: 'Overview & insights',
      badge: null
    },
    { 
      key: 'booking', 
      label: 'Book Spaces', 
      icon: Calendar, 
      gradient: 'from-emerald-500 to-emerald-600',
      description: 'Reserve rooms & areas',
      badge: null
    },
    { 
      key: 'requests', 
      label: 'Service Requests', 
      icon: Wrench, 
      gradient: 'from-orange-500 to-orange-600',
      description: 'Maintenance & support',
      badge: 2
    },
    { 
      key: 'services', 
      label: 'Building Services', 
      icon: Coffee, 
      gradient: 'from-purple-500 to-purple-600',
      description: 'Food & amenities',
      badge: null
    },
    { 
      key: 'billing', 
      label: 'Billing & Payments', 
      icon: CreditCard, 
      gradient: 'from-indigo-500 to-indigo-600',
      description: 'Manage finances',
      badge: null
    },
    { 
      key: 'notifications', 
      label: 'Notifications', 
      icon: Bell, 
      gradient: 'from-red-500 to-red-600',
      description: 'Updates & alerts',
      badge: 5
    }
  ];

  const quickActions = [
    { label: 'New Request', icon: Plus, action: () => setActiveTab('requests') },
    { label: 'Search', icon: Search, action: () => setShowSearch(!showSearch) }
  ];

  const currentTab = tabConfig.find(tab => tab.key === activeTab);
  const filteredTabs = tabConfig.filter(tab => 
    tab.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tab.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 relative">
      {/* Enhanced Header with Search */}
      <Card className="mx-4 mt-4 overflow-hidden">
        <CardContent className="p-0">
          {/* Main Navigation Header */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              className="flex-1 p-4 justify-between hover:bg-muted/50"
              onClick={() => setExpanded(!expanded)}
            >
              <div className="flex items-center gap-3">
                {currentTab && (
                  <>
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${currentTab.gradient}`}>
                      <currentTab.icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{currentTab.label}</div>
                      <div className="text-xs text-muted-foreground">{currentTab.description}</div>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {currentTab?.badge && (
                  <Badge className="bg-primary text-xs">
                    {currentTab.badge}
                  </Badge>
                )}
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </Button>
            
            {/* Quick Actions */}
            <div className="flex border-l">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="px-3 py-4 rounded-none hover:bg-muted/50"
                  onClick={action.action}
                >
                  <action.icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          {showSearch && (
            <div className="border-t p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search features..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}
          
          {/* Expanded Tab Grid */}
          {expanded && (
            <div className="border-t p-4">
              <div className="grid grid-cols-2 gap-3">
                {(searchQuery ? filteredTabs : tabConfig).map((tab) => (
                  <Button
                    key={tab.key}
                    variant={activeTab === tab.key ? "default" : "outline"}
                    size="sm"
                    className="justify-start gap-3 h-16 p-3"
                    onClick={() => {
                      setActiveTab(tab.key);
                      setExpanded(false);
                      setShowSearch(false);
                      setSearchQuery('');
                    }}
                  >
                    <div className={`p-2 rounded-lg bg-gradient-to-r ${tab.gradient} ${activeTab === tab.key ? 'bg-white' : ''}`}>
                      <tab.icon className={`h-4 w-4 ${activeTab === tab.key ? 'text-primary' : 'text-white'}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-xs font-medium">{tab.label}</div>
                      <div className="text-xs text-muted-foreground">{tab.description}</div>
                    </div>
                    {tab.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {tab.badge}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tab Content */}
      <div className="flex-1">
        {tabComponents[activeTab]}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 z-50">
        <Button
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg bg-gradient-to-r from-primary to-accent hover:shadow-xl transition-all duration-300"
          onClick={() => setActiveTab('requests')}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Enhanced Bottom Navigation Pills */}
      <div className="px-4 pb-20">
        <Card className="p-2">
          <div className="flex gap-1 overflow-x-auto">
            {tabConfig.slice(0, 4).map((tab) => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? "default" : "ghost"}
                size="sm"
                className={`flex-shrink-0 gap-2 text-xs relative ${
                  activeTab === tab.key 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                <tab.icon className="h-3 w-3" />
                {tab.label.split(' ')[0]}
                {tab.badge && (
                  <Badge className="absolute -top-1 -right-1 w-4 h-4 p-0 text-xs bg-red-500">
                    {tab.badge}
                  </Badge>
                )}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="flex-shrink-0 gap-2 text-xs"
              onClick={() => setExpanded(true)}
            >
              <Settings className="h-3 w-3" />
              More
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}