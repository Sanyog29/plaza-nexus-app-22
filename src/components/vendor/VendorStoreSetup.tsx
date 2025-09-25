import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { VendorLogoUpload } from './VendorLogoUpload';
import { 
  Store, 
  Settings, 
  Palette, 
  Bell, 
  CreditCard,
  Clock,
  MapPin,
  Star
} from 'lucide-react';

interface VendorStoreSetupProps {
  vendorId: string;
}

interface StoreConfig {
  storeName: string;
  storeDescription: string;
  logo: string;
  banner: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
  features: {
    onlineOrdering: boolean;
    tableBooking: boolean;
    loyaltyProgram: boolean;
    promotions: boolean;
  };
  notifications: {
    orderAlerts: boolean;
    lowStockAlerts: boolean;
    customerFeedback: boolean;
    promotionalUpdates: boolean;
  };
  operatingHours: {
    [key: string]: {
      open: string;
      close: string;
      closed: boolean;
    };
  };
  deliveryConfig: {
    deliveryRadius: number;
    minimumOrder: number;
    deliveryFee: number;
    estimatedTime: number;
  };
}

const VendorStoreSetup: React.FC<VendorStoreSetupProps> = ({ vendorId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const { data: vendor, isLoading } = useQuery({
    queryKey: ['vendor-details', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const [storeConfig, setStoreConfig] = useState<StoreConfig>({
    storeName: '',
    storeDescription: '',
    logo: '',
    banner: '',
    theme: {
      primaryColor: '#3B82F6',
      secondaryColor: '#EF4444',
      accentColor: '#10B981'
    },
    features: {
      onlineOrdering: true,
      tableBooking: false,
      loyaltyProgram: false,
      promotions: true
    },
    notifications: {
      orderAlerts: true,
      lowStockAlerts: true,
      customerFeedback: true,
      promotionalUpdates: false
    },
    operatingHours: {
      monday: { open: '09:00', close: '22:00', closed: false },
      tuesday: { open: '09:00', close: '22:00', closed: false },
      wednesday: { open: '09:00', close: '22:00', closed: false },
      thursday: { open: '09:00', close: '22:00', closed: false },
      friday: { open: '09:00', close: '22:00', closed: false },
      saturday: { open: '09:00', close: '22:00', closed: false },
      sunday: { open: '10:00', close: '21:00', closed: false }
    },
    deliveryConfig: {
      deliveryRadius: 5,
      minimumOrder: 100,
      deliveryFee: 30,
      estimatedTime: 30
    }
  });

  // Initialize config with vendor data
  React.useEffect(() => {
    if (vendor) {
      try {
        const vendorStoreConfig = vendor.store_config as any;
        const vendorOperatingHours = vendor.operating_hours as any;
        
        setStoreConfig(prev => {
          const updatedConfig = {
            ...prev,
            storeName: vendor.name || '',
            storeDescription: vendor.description || '',
            logo: vendor.logo_url || ''
          };

          // Safely merge operating hours
          if (vendorOperatingHours && typeof vendorOperatingHours === 'object') {
            updatedConfig.operatingHours = vendorOperatingHours;
          }

          // Safely merge store config
          if (vendorStoreConfig && typeof vendorStoreConfig === 'object') {
            Object.assign(updatedConfig, vendorStoreConfig);
          }

          return updatedConfig;
        });
      } catch (error) {
        console.error('Error initializing store config:', error);
      }
    }
  }, [vendor]);

  const saveStoreConfig = useMutation({
    mutationFn: async (config: StoreConfig) => {
      const { error } = await supabase
        .from('vendors')
        .update({
          store_config: config as any,
          name: config.storeName,
          description: config.storeDescription,
          logo_url: config.logo,
          operating_hours: config.operatingHours as any
        })
        .eq('id', vendorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-details', vendorId] });
      toast({
        title: "Store Configuration Saved",
        description: "Your store setup has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save store configuration.",
        variant: "destructive",
      });
    },
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveStoreConfig.mutateAsync(storeConfig);
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfig = (section: keyof StoreConfig, field: string, value: any) => {
    setStoreConfig(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value
      }
    }));
  };

  const updateSimpleField = (field: keyof StoreConfig, value: any) => {
    setStoreConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Store Setup</h2>
          <p className="text-muted-foreground">Configure your vendor store and POS settings</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="btn-primary"
        >
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Basic
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Features
          </TabsTrigger>
          <TabsTrigger value="operations" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Operations
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
              <CardDescription>Basic details about your store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="storeName">Store Name</Label>
                <Input
                  id="storeName"
                  value={storeConfig.storeName}
                  onChange={(e) => updateSimpleField('storeName', e.target.value)}
                  placeholder="Enter your store name"
                />
              </div>

              <div>
                <Label htmlFor="storeDescription">Store Description</Label>
                <Textarea
                  id="storeDescription"
                  value={storeConfig.storeDescription}
                  onChange={(e) => updateSimpleField('storeDescription', e.target.value)}
                  placeholder="Describe your store and specialties"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Store Logo</Label>
                  <VendorLogoUpload
                    currentLogoUrl={storeConfig.logo}
                    onLogoUpdate={(logoUrl) => updateSimpleField('logo', logoUrl || '')}
                    vendorId={vendorId}
                  />
                </div>

                <div>
                  <Label htmlFor="banner">Banner URL</Label>
                  <Input
                    id="banner"
                    value={storeConfig.banner}
                    onChange={(e) => updateSimpleField('banner', e.target.value)}
                    placeholder="https://example.com/banner.jpg"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Store Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Current Status</p>
                  <p className="text-sm text-muted-foreground">Your store is currently</p>
                </div>
                <Badge variant={vendor?.is_active ? 'default' : 'secondary'}>
                  {vendor?.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Color Theme</CardTitle>
              <CardDescription>Customize your store's visual appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={storeConfig.theme.primaryColor}
                      onChange={(e) => updateConfig('theme', 'primaryColor', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={storeConfig.theme.primaryColor}
                      onChange={(e) => updateConfig('theme', 'primaryColor', e.target.value)}
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={storeConfig.theme.secondaryColor}
                      onChange={(e) => updateConfig('theme', 'secondaryColor', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={storeConfig.theme.secondaryColor}
                      onChange={(e) => updateConfig('theme', 'secondaryColor', e.target.value)}
                      placeholder="#EF4444"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={storeConfig.theme.accentColor}
                      onChange={(e) => updateConfig('theme', 'accentColor', e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={storeConfig.theme.accentColor}
                      onChange={(e) => updateConfig('theme', 'accentColor', e.target.value)}
                      placeholder="#10B981"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 border rounded-lg bg-background">
                <h4 className="font-medium mb-3">Preview</h4>
                <div className="space-y-2">
                  <div 
                    className="h-8 rounded" 
                    style={{ backgroundColor: storeConfig.theme.primaryColor }}
                  ></div>
                  <div className="flex gap-2">
                    <div 
                      className="h-4 flex-1 rounded" 
                      style={{ backgroundColor: storeConfig.theme.secondaryColor }}
                    ></div>
                    <div 
                      className="h-4 flex-1 rounded" 
                      style={{ backgroundColor: storeConfig.theme.accentColor }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Store Features</CardTitle>
              <CardDescription>Enable or disable store capabilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(storeConfig.features).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <Label className="text-base capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {key === 'onlineOrdering' && 'Allow customers to place orders online'}
                      {key === 'tableBooking' && 'Enable table reservation system'}
                      {key === 'loyaltyProgram' && 'Reward returning customers'}
                      {key === 'promotions' && 'Create and manage promotional offers'}
                    </p>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) => updateConfig('features', key, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deliveryRadius">Delivery Radius (km)</Label>
                  <Input
                    id="deliveryRadius"
                    type="number"
                    value={storeConfig.deliveryConfig.deliveryRadius}
                    onChange={(e) => updateConfig('deliveryConfig', 'deliveryRadius', Number(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="minimumOrder">Minimum Order (₹)</Label>
                  <Input
                    id="minimumOrder"
                    type="number"
                    value={storeConfig.deliveryConfig.minimumOrder}
                    onChange={(e) => updateConfig('deliveryConfig', 'minimumOrder', Number(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="deliveryFee">Delivery Fee (₹)</Label>
                  <Input
                    id="deliveryFee"
                    type="number"
                    value={storeConfig.deliveryConfig.deliveryFee}
                    onChange={(e) => updateConfig('deliveryConfig', 'deliveryFee', Number(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="estimatedTime">Estimated Delivery Time (minutes)</Label>
                  <Input
                    id="estimatedTime"
                    type="number"
                    value={storeConfig.deliveryConfig.estimatedTime}
                    onChange={(e) => updateConfig('deliveryConfig', 'estimatedTime', Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Operating Hours</CardTitle>
              <CardDescription>Set your store's operating schedule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(storeConfig.operatingHours).map(([day, hours]) => (
                <div key={day} className="flex items-center gap-4">
                  <div className="w-24 text-sm font-medium capitalize">{day}</div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={!hours.closed}
                      onCheckedChange={(checked) => 
                        updateConfig('operatingHours', day, { ...hours, closed: !checked })
                      }
                    />
                    <Input
                      type="time"
                      value={hours.open}
                      onChange={(e) => 
                        updateConfig('operatingHours', day, { ...hours, open: e.target.value })
                      }
                      disabled={hours.closed}
                      className="w-32"
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                      type="time"
                      value={hours.close}
                      onChange={(e) => 
                        updateConfig('operatingHours', day, { ...hours, close: e.target.value })
                      }
                      disabled={hours.closed}
                      className="w-32"
                    />
                    <span className="text-muted-foreground text-sm">
                      {hours.closed ? 'Closed' : 'Open'}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure when and how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(storeConfig.notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <Label className="text-base capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {key === 'orderAlerts' && 'Get notified when new orders are placed'}
                      {key === 'lowStockAlerts' && 'Alerts when menu items run out of stock'}
                      {key === 'customerFeedback' && 'Notifications for new reviews and ratings'}
                      {key === 'promotionalUpdates' && 'Platform updates and promotional opportunities'}
                    </p>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) => updateConfig('notifications', key, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorStoreSetup;