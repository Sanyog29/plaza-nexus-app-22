import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/components/AuthProvider';
import { useContentManagement } from '@/hooks/useContentManagement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Upload,
  Tag,
  Calendar as CalendarIcon,
  User,
  Globe,
  Settings,
  Search,
  Coffee,
  Bed
} from 'lucide-react';

interface ServiceCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
}

interface ServiceItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  is_available: boolean;
}

interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  is_vegetarian: boolean;
  is_vegan: boolean;
}

interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
}

interface Room {
  id: string;
  name: string;
  description: string | null;
  location: string;
  capacity: number;
  facilities: string[] | null;
  image_url: string | null;
}

interface Equipment {
  id: string;
  name: string;
  category: string;
  location: string;
  status: string;
  last_maintenance_date: string | null;
  next_maintenance_date: string | null;
}

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

const AdminContentPage = () => {
  const [activeTab, setActiveTab] = useState('services');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Service Management State
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<ServiceCategory | null>(null);
  const [selectedServiceItem, setSelectedServiceItem] = useState<ServiceItem | null>(null);
  
  // Menu Management State
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedMenuCategory, setSelectedMenuCategory] = useState<MenuCategory | null>(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  
  // Room Management State
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  
  // Equipment Management State
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  
  // Alert Management State
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [alertDate, setAlertDate] = useState<Date | undefined>();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchServiceData(),
        fetchMenuData(),
        fetchRooms(),
        fetchEquipment(),
        fetchAlerts()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ 
        title: "Error loading content", 
        description: "Failed to load some content. Please refresh the page.", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchServiceData = async () => {
    try {
      const [categoriesResult, itemsResult] = await Promise.all([
        supabase.from('service_categories').select('*').order('name'),
        supabase.from('service_items').select('*').order('name')
      ]);
      
      if (categoriesResult.error) throw categoriesResult.error;
      if (itemsResult.error) throw itemsResult.error;
      
      if (categoriesResult.data) setServiceCategories(categoriesResult.data);
      if (itemsResult.data) setServiceItems(itemsResult.data);
    } catch (error) {
      console.error('Error fetching service data:', error);
      // Don't show toast here as parent will handle it
    }
  };

  const fetchMenuData = async () => {
    const [categoriesResult, itemsResult] = await Promise.all([
      supabase.from('cafeteria_menu_categories').select('*').order('name'),
      supabase.from('cafeteria_menu_items').select('*').order('name')
    ]);
    
    if (categoriesResult.data) setMenuCategories(categoriesResult.data);
    if (itemsResult.data) setMenuItems(itemsResult.data);
  };

  const fetchRooms = async () => {
    const { data } = await supabase.from('rooms').select('*').order('name');
    if (data) setRooms(data);
  };

  const fetchEquipment = async () => {
    const { data } = await supabase.from('equipment').select('*').order('name');
    if (data) setEquipment(data);
  };

  const fetchAlerts = async () => {
    const { data } = await supabase.from('alerts').select('*').order('created_at', { ascending: false });
    if (data) {
      // Filter and type-cast alerts to ensure severity matches our interface
      const validAlerts = data.filter(alert => 
        ['info', 'warning', 'critical'].includes(alert.severity)
      ) as Alert[];
      setAlerts(validAlerts);
    }
  };

  const handleSaveServiceCategory = async (formData: FormData) => {
    const categoryData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || null,
      icon: formData.get('icon') as string || null,
      is_active: formData.get('is_active') === 'true'
    };

    try {
      if (selectedServiceCategory) {
        await supabase.from('service_categories').update(categoryData).eq('id', selectedServiceCategory.id);
        toast({ title: "Service category updated successfully" });
      } else {
        await supabase.from('service_categories').insert(categoryData);
        toast({ title: "Service category created successfully" });
      }
      
      fetchServiceData();
      setIsDialogOpen(false);
      setSelectedServiceCategory(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSaveServiceItem = async (formData: FormData) => {
    const itemData = {
      category_id: formData.get('category_id') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string || null,
      price: parseFloat(formData.get('price') as string),
      duration_minutes: parseInt(formData.get('duration_minutes') as string),
      is_available: formData.get('is_available') === 'true'
    };

    try {
      if (selectedServiceItem) {
        await supabase.from('service_items').update(itemData).eq('id', selectedServiceItem.id);
        toast({ title: "Service item updated successfully" });
      } else {
        await supabase.from('service_items').insert(itemData);
        toast({ title: "Service item created successfully" });
      }
      
      fetchServiceData();
      setIsDialogOpen(false);
      setSelectedServiceItem(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSaveAlert = async (formData: FormData) => {
    const alertData = {
      title: formData.get('title') as string,
      message: formData.get('message') as string,
      severity: formData.get('severity') as 'info' | 'warning' | 'critical',
      is_active: formData.get('is_active') === 'true',
      expires_at: alertDate ? alertDate.toISOString() : null
    };

    try {
      if (selectedAlert) {
        await supabase.from('alerts').update(alertData).eq('id', selectedAlert.id);
        toast({ title: "Alert updated successfully" });
      } else {
        await supabase.from('alerts').insert(alertData);
        toast({ title: "Alert created successfully" });
      }
      
      fetchAlerts();
      setIsDialogOpen(false);
      setSelectedAlert(null);
      setAlertDate(undefined);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteServiceCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await supabase.from('service_categories').delete().eq('id', id);
      toast({ title: "Category deleted successfully" });
      fetchServiceData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteServiceItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    
    try {
      await supabase.from('service_items').delete().eq('id', id);
      toast({ title: "Service deleted successfully" });
      fetchServiceData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteAlert = async (id: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) return;
    
    try {
      await supabase.from('alerts').delete().eq('id', id);
      toast({ title: "Alert deleted successfully" });
      fetchAlerts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'default';
      case 'info': return 'secondary';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-plaza-blue"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Content Management</h1>
          <p className="text-gray-400">Manage all application content and settings</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="menu">Menu</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Services Management */}
        <TabsContent value="services" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Service Categories */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Service Categories</CardTitle>
                <Dialog open={isDialogOpen && selectedServiceCategory !== null} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={() => setSelectedServiceCategory({} as ServiceCategory)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card text-white">
                    <DialogHeader>
                      <DialogTitle>
                        {selectedServiceCategory?.id ? 'Edit Service Category' : 'Add Service Category'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveServiceCategory(new FormData(e.currentTarget));
                    }} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input name="name" defaultValue={selectedServiceCategory?.name || ''} required />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea name="description" defaultValue={selectedServiceCategory?.description || ''} />
                      </div>
                      <div>
                        <Label htmlFor="icon">Icon</Label>
                        <Select name="icon" defaultValue={selectedServiceCategory?.icon || ''}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an icon" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Sparkles">Sparkles (Cleaning)</SelectItem>
                            <SelectItem value="Wrench">Wrench (Maintenance)</SelectItem>
                            <SelectItem value="Truck">Truck (Transport)</SelectItem>
                            <SelectItem value="Shield">Shield (Security)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch name="is_active" defaultChecked={selectedServiceCategory?.is_active !== false} />
                        <Label>Active</Label>
                      </div>
                      <DialogFooter>
                        <Button type="submit">Save Category</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {serviceCategories.filter(cat => 
                    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div>
                        <h4 className="font-medium text-white">{category.name}</h4>
                        <p className="text-sm text-gray-400">{category.description}</p>
                        <Badge variant={category.is_active ? 'default' : 'secondary'}>
                          {category.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          setSelectedServiceCategory(category);
                          setIsDialogOpen(true);
                        }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => 
                          handleDeleteServiceCategory(category.id)
                        }>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Service Items */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Service Items</CardTitle>
                <Dialog open={isDialogOpen && selectedServiceItem !== null} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={() => setSelectedServiceItem({} as ServiceItem)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Service
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card text-white">
                    <DialogHeader>
                      <DialogTitle>
                        {selectedServiceItem?.id ? 'Edit Service Item' : 'Add Service Item'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveServiceItem(new FormData(e.currentTarget));
                    }} className="space-y-4">
                      <div>
                        <Label htmlFor="category_id">Category</Label>
                        <Select name="category_id" defaultValue={selectedServiceItem?.category_id || ''} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {serviceCategories.map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="name">Service Name</Label>
                        <Input name="name" defaultValue={selectedServiceItem?.name || ''} required />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea name="description" defaultValue={selectedServiceItem?.description || ''} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="price">Price (₹)</Label>
                          <Input 
                            name="price" 
                            type="number" 
                            step="0.01" 
                            defaultValue={selectedServiceItem?.price || ''} 
                            required 
                          />
                        </div>
                        <div>
                          <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                          <Input 
                            name="duration_minutes" 
                            type="number" 
                            defaultValue={selectedServiceItem?.duration_minutes || ''} 
                            required 
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch name="is_available" defaultChecked={selectedServiceItem?.is_available !== false} />
                        <Label>Available</Label>
                      </div>
                      <DialogFooter>
                        <Button type="submit">Save Service</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {serviceItems.filter(item => 
                    item.name.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div>
                        <h4 className="font-medium text-white">{item.name}</h4>
                        <p className="text-sm text-gray-400">{item.description}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge>₹{item.price}</Badge>
                          <Badge variant="outline">{item.duration_minutes}min</Badge>
                          <Badge variant={item.is_available ? 'default' : 'secondary'}>
                            {item.is_available ? 'Available' : 'Unavailable'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          setSelectedServiceItem(item);
                          setIsDialogOpen(true);
                        }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => 
                          handleDeleteServiceItem(item.id)
                        }>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Management */}
        <TabsContent value="alerts" className="space-y-6">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>System Alerts</CardTitle>
              <Dialog open={isDialogOpen && selectedAlert !== null} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => setSelectedAlert({} as Alert)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Alert
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card text-white">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedAlert?.id ? 'Edit Alert' : 'Create Alert'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveAlert(new FormData(e.currentTarget));
                  }} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Alert Title</Label>
                      <Input name="title" defaultValue={selectedAlert?.title || ''} required />
                    </div>
                    <div>
                      <Label htmlFor="message">Message</Label>
                      <Textarea name="message" defaultValue={selectedAlert?.message || ''} required />
                    </div>
                    <div>
                      <Label htmlFor="severity">Severity</Label>
                      <Select name="severity" defaultValue={selectedAlert?.severity || 'info'}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Expires At (Optional)</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !alertDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {alertDate ? format(alertDate, "PPP") : "No expiry date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={alertDate}
                            onSelect={setAlertDate}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch name="is_active" defaultChecked={selectedAlert?.is_active !== false} />
                      <Label>Active</Label>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Save Alert</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.filter(alert => 
                  alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  alert.message.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((alert) => (
                  <div key={alert.id} className="flex items-start justify-between p-4 bg-gray-800 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-white">{alert.title}</h4>
                        <Badge variant={getSeverityColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <Badge variant={alert.is_active ? 'default' : 'secondary'}>
                          {alert.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{alert.message}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Created: {format(new Date(alert.created_at), 'MMM d, yyyy')}</span>
                        {alert.expires_at && (
                          <span>Expires: {format(new Date(alert.expires_at), 'MMM d, yyyy')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => {
                        setSelectedAlert(alert);
                        setAlertDate(alert.expires_at ? new Date(alert.expires_at) : undefined);
                        setIsDialogOpen(true);
                      }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => 
                        handleDeleteAlert(alert.id)
                      }>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Placeholder tabs for Menu, Rooms, Equipment */}
        <TabsContent value="menu">
          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="p-8 text-center">
              <Coffee className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Menu Management</h3>
              <p className="text-gray-400">Menu management interface coming next...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rooms">
          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="p-8 text-center">
              <Bed className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Room Management</h3>
              <p className="text-gray-400">Room management interface coming next...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipment">
          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="p-8 text-center">
              <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Equipment Management</h3>
              <p className="text-gray-400">Equipment management interface coming next...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminContentPage;