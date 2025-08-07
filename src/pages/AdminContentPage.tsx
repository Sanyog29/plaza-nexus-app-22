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
import { IconPicker } from '@/components/ui/icon-picker';
import { AdminPermissionCheck } from '@/components/admin/AdminPermissionCheck';
import { UserStatusDisplay } from '@/components/admin/UserStatusDisplay';
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
  warranty_expiry: string | null;
  purchase_date: string | null;
  purchase_cost: number | null;
  notes: string | null;
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
  
  // UI State
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
    setIsSubmitting(true);
    
    const categoryData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || null,
      icon: selectedIcon || formData.get('icon') as string || null,
      is_active: formData.get('is_active') === 'true'
    };

    console.log('Saving service category:', categoryData);

    try {
      let result;
      if (selectedServiceCategory?.id) {
        result = await supabase
          .from('service_categories')
          .update(categoryData)
          .eq('id', selectedServiceCategory.id)
          .select();
        
        console.log('Update result:', result);
        
        if (result.error) throw result.error;
        toast({ title: "Service category updated successfully" });
      } else {
        result = await supabase
          .from('service_categories')
          .insert(categoryData)
          .select();
        
        console.log('Insert result:', result);
        
        if (result.error) throw result.error;
        toast({ title: "Service category created successfully" });
      }
      
      await fetchServiceData();
      setIsDialogOpen(false);
      setSelectedServiceCategory(null);
      setSelectedIcon('');
    } catch (error: any) {
      console.error('Error saving service category:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to save service category", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveServiceItem = async (formData: FormData) => {
    setIsSubmitting(true);
    
    const itemData = {
      category_id: formData.get('category_id') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string || null,
      price: parseFloat(formData.get('price') as string),
      duration_minutes: parseInt(formData.get('duration_minutes') as string),
      is_available: formData.get('is_available') === 'true'
    };

    console.log('Saving service item:', itemData);

    try {
      let result;
      if (selectedServiceItem?.id) {
        result = await supabase
          .from('service_items')
          .update(itemData)
          .eq('id', selectedServiceItem.id)
          .select();
          
        console.log('Update result:', result);
        
        if (result.error) throw result.error;
        toast({ title: "Service item updated successfully" });
      } else {
        result = await supabase
          .from('service_items')
          .insert(itemData)
          .select();
          
        console.log('Insert result:', result);
        
        if (result.error) throw result.error;
        toast({ title: "Service item created successfully" });
      }
      
      await fetchServiceData();
      setIsDialogOpen(false);
      setSelectedServiceItem(null);
    } catch (error: any) {
      console.error('Error saving service item:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to save service item", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
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

  const handleSaveMenuCategory = async (formData: FormData) => {
    setIsSubmitting(true);
    
    const categoryData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || null,
      image_url: formData.get('image_url') as string || null
    };

    try {
      let result;
      if (selectedMenuCategory?.id) {
        result = await supabase
          .from('cafeteria_menu_categories')
          .update(categoryData)
          .eq('id', selectedMenuCategory.id)
          .select();
        
        if (result.error) throw result.error;
        toast({ title: "Menu category updated successfully" });
      } else {
        result = await supabase
          .from('cafeteria_menu_categories')
          .insert(categoryData)
          .select();
        
        if (result.error) throw result.error;
        toast({ title: "Menu category created successfully" });
      }
      
      await fetchMenuData();
      setIsDialogOpen(false);
      setSelectedMenuCategory(null);
    } catch (error: any) {
      console.error('Error saving menu category:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to save menu category", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveMenuItem = async (formData: FormData) => {
    setIsSubmitting(true);
    
    const itemData = {
      category_id: formData.get('category_id') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string || null,
      price: parseFloat(formData.get('price') as string),
      is_vegetarian: formData.get('is_vegetarian') === 'on',
      is_vegan: formData.get('is_vegan') === 'on',
      is_available: formData.get('is_available') === 'on'
    };

    try {
      let result;
      if (selectedMenuItem?.id) {
        result = await supabase
          .from('cafeteria_menu_items')
          .update(itemData)
          .eq('id', selectedMenuItem.id)
          .select();
        
        if (result.error) throw result.error;
        toast({ title: "Menu item updated successfully" });
      } else {
        result = await supabase
          .from('cafeteria_menu_items')
          .insert(itemData)
          .select();
        
        if (result.error) throw result.error;
        toast({ title: "Menu item created successfully" });
      }
      
      await fetchMenuData();
      setIsDialogOpen(false);
      setSelectedMenuItem(null);
    } catch (error: any) {
      console.error('Error saving menu item:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to save menu item", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMenuCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await supabase.from('cafeteria_menu_categories').delete().eq('id', id);
      toast({ title: "Menu category deleted successfully" });
      fetchMenuData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await supabase.from('cafeteria_menu_items').delete().eq('id', id);
      toast({ title: "Menu item deleted successfully" });
      fetchMenuData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSaveRoom = async (formData: FormData) => {
    setIsSubmitting(true);
    
    const facilitiesArray = formData.get('facilities') ? (formData.get('facilities') as string).split(',').map(f => f.trim()) : [];
    
    const roomData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || null,
      location: formData.get('location') as string,
      capacity: parseInt(formData.get('capacity') as string),
      facilities: facilitiesArray,
      image_url: formData.get('image_url') as string || null
    };

    try {
      let result;
      if (selectedRoom?.id) {
        result = await supabase
          .from('rooms')
          .update(roomData)
          .eq('id', selectedRoom.id)
          .select();
        
        if (result.error) throw result.error;
        toast({ title: "Room updated successfully" });
      } else {
        result = await supabase
          .from('rooms')
          .insert(roomData)
          .select();
        
        if (result.error) throw result.error;
        toast({ title: "Room created successfully" });
      }
      
      await fetchRooms();
      setIsDialogOpen(false);
      setSelectedRoom(null);
    } catch (error: any) {
      console.error('Error saving room:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to save room", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;
    
    try {
      await supabase.from('rooms').delete().eq('id', id);
      toast({ title: "Room deleted successfully" });
      fetchRooms();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSaveEquipment = async (formData: FormData) => {
    setIsSubmitting(true);
    
    const equipmentData = {
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      location: formData.get('location') as string,
      status: formData.get('status') as string,
      notes: formData.get('notes') as string || null,
      last_maintenance_date: formData.get('last_maintenance_date') ? new Date(formData.get('last_maintenance_date') as string).toISOString().split('T')[0] : null,
      next_maintenance_date: formData.get('next_maintenance_date') ? new Date(formData.get('next_maintenance_date') as string).toISOString().split('T')[0] : null,
      warranty_expiry: formData.get('warranty_expiry') ? new Date(formData.get('warranty_expiry') as string).toISOString().split('T')[0] : null,
      purchase_date: formData.get('purchase_date') ? new Date(formData.get('purchase_date') as string).toISOString().split('T')[0] : null,
      purchase_cost: formData.get('purchase_cost') ? parseFloat(formData.get('purchase_cost') as string) : null
    };

    try {
      let result;
      if (selectedEquipment?.id) {
        result = await supabase
          .from('equipment')
          .update(equipmentData)
          .eq('id', selectedEquipment.id)
          .select();
        
        if (result.error) throw result.error;
        toast({ title: "Equipment updated successfully" });
      } else {
        result = await supabase
          .from('equipment')
          .insert(equipmentData)
          .select();
        
        if (result.error) throw result.error;
        toast({ title: "Equipment created successfully" });
      }
      
      await fetchEquipment();
      setIsDialogOpen(false);
      setSelectedEquipment(null);
    } catch (error: any) {
      console.error('Error saving equipment:', error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to save equipment", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this equipment?')) return;
    
    try {
      await supabase.from('equipment').delete().eq('id', id);
      toast({ title: "Equipment deleted successfully" });
      fetchEquipment();
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
    <AdminPermissionCheck>
      <SEOHead
        title="Content Management"
        description="Manage all application content and settings."
        url={`${window.location.origin}/admin/content`}
        type="website"
        noindex
      />
      <div className="container mx-auto px-4 py-6 space-y-6">
        <UserStatusDisplay />
        
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
                        <div className="flex gap-2">
                          <Input 
                            value={selectedIcon || selectedServiceCategory?.icon || ''} 
                            placeholder="Select an icon"
                            readOnly
                            className="flex-1"
                          />
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                              setSelectedIcon(selectedServiceCategory?.icon || '');
                              setIsIconPickerOpen(true);
                            }}
                          >
                            Browse Icons
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch name="is_active" defaultChecked={selectedServiceCategory?.is_active !== false} />
                        <Label>Active</Label>
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? 'Saving...' : 'Save Category'}
                        </Button>
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
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? 'Saving...' : 'Save Service'}
                        </Button>
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

        {/* Menu Management */}
        <TabsContent value="menu" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Menu Categories */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Menu Categories</CardTitle>
                <Dialog open={isDialogOpen && selectedMenuCategory !== null} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={() => setSelectedMenuCategory({} as MenuCategory)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card text-white">
                    <DialogHeader>
                      <DialogTitle>
                        {selectedMenuCategory?.id ? 'Edit Menu Category' : 'Add Menu Category'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveMenuCategory(new FormData(e.currentTarget));
                    }} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input name="name" defaultValue={selectedMenuCategory?.name || ''} required />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea name="description" defaultValue={selectedMenuCategory?.description || ''} />
                      </div>
                      <div>
                        <Label htmlFor="image_url">Image URL</Label>
                        <Input name="image_url" defaultValue={selectedMenuCategory?.image_url || ''} placeholder="https://..." />
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? 'Saving...' : 'Save Category'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {menuCategories.filter(cat => 
                    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        {category.image_url && (
                          <img src={category.image_url} alt={category.name} className="w-10 h-10 rounded object-cover" />
                        )}
                        <div>
                          <h4 className="font-medium text-white">{category.name}</h4>
                          <p className="text-sm text-gray-400">{category.description}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          setSelectedMenuCategory(category);
                          setIsDialogOpen(true);
                        }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => 
                          handleDeleteMenuCategory(category.id)
                        }>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Menu Items */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Menu Items</CardTitle>
                <Dialog open={isDialogOpen && selectedMenuItem !== null} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={() => setSelectedMenuItem({} as MenuItem)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card text-white">
                    <DialogHeader>
                      <DialogTitle>
                        {selectedMenuItem?.id ? 'Edit Menu Item' : 'Add Menu Item'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveMenuItem(new FormData(e.currentTarget));
                    }} className="space-y-4">
                      <div>
                        <Label htmlFor="category_id">Category</Label>
                        <Select name="category_id" defaultValue={selectedMenuItem?.category_id || ''} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {menuCategories.map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="name">Item Name</Label>
                        <Input name="name" defaultValue={selectedMenuItem?.name || ''} required />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea name="description" defaultValue={selectedMenuItem?.description || ''} />
                      </div>
                      <div>
                        <Label htmlFor="price">Price (₹)</Label>
                        <Input 
                          name="price" 
                          type="number" 
                          step="0.01" 
                          defaultValue={selectedMenuItem?.price || ''} 
                          required 
                        />
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Switch name="is_vegetarian" defaultChecked={selectedMenuItem?.is_vegetarian || false} />
                          <Label>Vegetarian</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch name="is_vegan" defaultChecked={selectedMenuItem?.is_vegan || false} />
                          <Label>Vegan</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch name="is_available" defaultChecked={selectedMenuItem?.is_available !== false} />
                          <Label>Available</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? 'Saving...' : 'Save Item'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {menuItems.filter(item => 
                    item.name.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div>
                        <h4 className="font-medium text-white">{item.name}</h4>
                        <p className="text-sm text-gray-400">{item.description}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge>₹{item.price}</Badge>
                          {item.is_vegetarian && <Badge variant="outline">Veg</Badge>}
                          {item.is_vegan && <Badge variant="outline">Vegan</Badge>}
                          <Badge variant={item.is_available ? 'default' : 'secondary'}>
                            {item.is_available ? 'Available' : 'Unavailable'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          setSelectedMenuItem(item);
                          setIsDialogOpen(true);
                        }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => 
                          handleDeleteMenuItem(item.id)
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

        {/* Room Management */}
        <TabsContent value="rooms" className="space-y-6">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Room Management</CardTitle>
              <Dialog open={isDialogOpen && selectedRoom !== null} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => setSelectedRoom({} as Room)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Room
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card text-white">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedRoom?.id ? 'Edit Room' : 'Add Room'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveRoom(new FormData(e.currentTarget));
                  }} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Room Name</Label>
                      <Input name="name" defaultValue={selectedRoom?.name || ''} required />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea name="description" defaultValue={selectedRoom?.description || ''} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input name="location" defaultValue={selectedRoom?.location || ''} required />
                      </div>
                      <div>
                        <Label htmlFor="capacity">Capacity</Label>
                        <Input 
                          name="capacity" 
                          type="number" 
                          defaultValue={selectedRoom?.capacity || ''} 
                          required 
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="facilities">Facilities (comma-separated)</Label>
                      <Input 
                        name="facilities" 
                        defaultValue={selectedRoom?.facilities?.join(', ') || ''} 
                        placeholder="Projector, Whiteboard, AC, WiFi"
                      />
                    </div>
                    <div>
                      <Label htmlFor="image_url">Image URL</Label>
                      <Input name="image_url" defaultValue={selectedRoom?.image_url || ''} placeholder="https://..." />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Room'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.filter(room => 
                  room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  room.location.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((room) => (
                  <div key={room.id} className="bg-gray-800 rounded-lg p-4">
                    {room.image_url && (
                      <img 
                        src={room.image_url} 
                        alt={room.name} 
                        className="w-full h-32 object-cover rounded mb-3" 
                      />
                    )}
                    <div className="space-y-2">
                      <h4 className="font-medium text-white">{room.name}</h4>
                      <p className="text-sm text-gray-400">{room.description}</p>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline">{room.location}</Badge>
                        <Badge>{room.capacity} people</Badge>
                      </div>
                      {room.facilities && room.facilities.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {room.facilities.map((facility, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {facility}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          setSelectedRoom(room);
                          setIsDialogOpen(true);
                        }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => 
                          handleDeleteRoom(room.id)
                        }>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {rooms.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  No rooms available. Create your first room to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipment Management */}
        <TabsContent value="equipment" className="space-y-6">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Equipment Management</CardTitle>
              <Dialog open={isDialogOpen && selectedEquipment !== null} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => setSelectedEquipment({} as Equipment)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Equipment
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card text-white max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedEquipment?.id ? 'Edit Equipment' : 'Add Equipment'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveEquipment(new FormData(e.currentTarget));
                  }} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Equipment Name</Label>
                        <Input name="name" defaultValue={selectedEquipment?.name || ''} required />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select name="category" defaultValue={selectedEquipment?.category || ''} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="HVAC">HVAC</SelectItem>
                            <SelectItem value="Electrical">Electrical</SelectItem>
                            <SelectItem value="Plumbing">Plumbing</SelectItem>
                            <SelectItem value="Fire Safety">Fire Safety</SelectItem>
                            <SelectItem value="Security">Security</SelectItem>
                            <SelectItem value="Elevator">Elevator</SelectItem>
                            <SelectItem value="Generator">Generator</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input name="location" defaultValue={selectedEquipment?.location || ''} required />
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select name="status" defaultValue={selectedEquipment?.status || 'operational'}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="operational">Operational</SelectItem>
                            <SelectItem value="maintenance">Under Maintenance</SelectItem>
                            <SelectItem value="repair">Needs Repair</SelectItem>
                            <SelectItem value="decommissioned">Decommissioned</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="purchase_date">Purchase Date</Label>
                        <Input 
                          name="purchase_date" 
                          type="date" 
                          defaultValue={selectedEquipment?.purchase_date || ''} 
                        />
                      </div>
                      <div>
                        <Label htmlFor="purchase_cost">Purchase Cost (₹)</Label>
                        <Input 
                          name="purchase_cost" 
                          type="number" 
                          step="0.01"
                          defaultValue={selectedEquipment?.purchase_cost || ''} 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="last_maintenance_date">Last Maintenance</Label>
                        <Input 
                          name="last_maintenance_date" 
                          type="date" 
                          defaultValue={selectedEquipment?.last_maintenance_date || ''} 
                        />
                      </div>
                      <div>
                        <Label htmlFor="next_maintenance_date">Next Maintenance</Label>
                        <Input 
                          name="next_maintenance_date" 
                          type="date" 
                          defaultValue={selectedEquipment?.next_maintenance_date || ''} 
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="warranty_expiry">Warranty Expiry</Label>
                      <Input 
                        name="warranty_expiry" 
                        type="date" 
                        defaultValue={selectedEquipment?.warranty_expiry || ''} 
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea name="notes" defaultValue={selectedEquipment?.notes || ''} />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Equipment'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {equipment.filter(item => 
                  item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  item.category.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((item) => (
                  <div key={item.id} className="bg-gray-800 rounded-lg p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-white">{item.name}</h4>
                        <Badge variant={
                          item.status === 'operational' ? 'default' :
                          item.status === 'maintenance' ? 'secondary' :
                          item.status === 'repair' ? 'destructive' : 'outline'
                        }>
                          {item.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline">{item.category}</Badge>
                          <Badge variant="outline">{item.location}</Badge>
                        </div>
                        
                        {item.last_maintenance_date && (
                          <p className="text-xs text-gray-400">
                            Last maintenance: {format(new Date(item.last_maintenance_date), 'MMM d, yyyy')}
                          </p>
                        )}
                        
                        {item.next_maintenance_date && (
                          <p className="text-xs text-gray-400">
                            Next maintenance: {format(new Date(item.next_maintenance_date), 'MMM d, yyyy')}
                          </p>
                        )}
                        
                        {item.warranty_expiry && (
                          <p className="text-xs text-gray-400">
                            Warranty expires: {format(new Date(item.warranty_expiry), 'MMM d, yyyy')}
                          </p>
                        )}
                        
                        {item.notes && (
                          <p className="text-sm text-gray-300 truncate" title={item.notes}>
                            {item.notes}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          setSelectedEquipment(item);
                          setIsDialogOpen(true);
                        }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => 
                          handleDeleteEquipment(item.id)
                        }>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {equipment.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  No equipment available. Create your first equipment entry to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Icon Picker */}
      <IconPicker
        isOpen={isIconPickerOpen}
        onClose={() => setIsIconPickerOpen(false)}
        onSelect={setSelectedIcon}
        selectedIcon={selectedIcon}
      />
    </div>
    </AdminPermissionCheck>
  );
};

export default AdminContentPage;