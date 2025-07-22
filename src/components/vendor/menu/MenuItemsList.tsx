import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Trash2, Search, Filter, Image, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface MenuItemsListProps {
  vendorId: string;
  onEditItem: (item: any) => void;
  refreshTrigger: number;
}

const MenuItemsList: React.FC<MenuItemsListProps> = ({
  vendorId,
  onEditItem,
  refreshTrigger
}) => {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAvailable, setFilterAvailable] = useState<string>('all');
  const [filterFeatured, setFilterFeatured] = useState<string>('all');

  useEffect(() => {
    fetchMenuItems();
  }, [vendorId, refreshTrigger]);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vendor_menu_items')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error: any) {
      console.error('Error fetching menu items:', error);
      toast({
        title: "Error fetching menu items",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (itemId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('vendor_menu_items')
        .update({ is_available: !currentStatus })
        .eq('id', itemId);

      if (error) throw error;

      setMenuItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, is_available: !currentStatus } : item
      ));

      toast({
        title: `Item ${!currentStatus ? 'enabled' : 'disabled'} successfully!`
      });
    } catch (error: any) {
      console.error('Error updating availability:', error);
      toast({
        title: "Error updating availability",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('vendor_menu_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setMenuItems(prev => prev.filter(item => item.id !== itemId));
      toast({ title: "Menu item deleted successfully!" });
    } catch (error: any) {
      console.error('Error deleting menu item:', error);
      toast({
        title: "Error deleting menu item",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAvailable = filterAvailable === 'all' || 
                           (filterAvailable === 'available' && item.is_available) ||
                           (filterAvailable === 'unavailable' && !item.is_available);
    
    const matchesFeatured = filterFeatured === 'all' ||
                          (filterFeatured === 'featured' && item.is_featured) ||
                          (filterFeatured === 'regular' && !item.is_featured);

    return matchesSearch && matchesAvailable && matchesFeatured;
  });

  const getStockStatus = (item: any) => {
    if (item.stock_quantity === 0) return { status: 'out-of-stock', color: 'destructive' };
    if (item.stock_quantity <= item.low_stock_threshold) return { status: 'low-stock', color: 'secondary' };
    return { status: 'in-stock', color: 'default' };
  };

  const calculateProfit = (price: number, cost: number) => {
    if (!cost) return null;
    const profit = price - cost;
    const margin = (profit / price) * 100;
    return { profit, margin };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterAvailable} onValueChange={setFilterAvailable}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterFeatured} onValueChange={setFilterFeatured}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Featured" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="featured">Featured Only</SelectItem>
                <SelectItem value="regular">Regular Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => {
          const stockStatus = getStockStatus(item);
          const profitInfo = calculateProfit(item.price, item.cost_price);

          return (
            <Card key={item.id} className="relative overflow-hidden">
              {item.is_featured && (
                <Badge className="absolute top-2 left-2 z-10" variant="secondary">
                  Featured
                </Badge>
              )}
              
              <div className="aspect-video relative bg-muted">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                
                <div className="absolute top-2 right-2 flex gap-2">
                  {stockStatus.status === 'low-stock' && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Low Stock
                    </Badge>
                  )}
                  {stockStatus.status === 'out-of-stock' && (
                    <Badge variant="destructive">Out of Stock</Badge>
                  )}
                </div>
              </div>

              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg truncate">{item.name}</h3>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={item.is_available}
                      onCheckedChange={() => toggleAvailability(item.id, item.is_available)}
                    />
                  </div>
                </div>

                {item.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {item.description}
                  </p>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Price:</span>
                    <span className="font-semibold">${item.price}</span>
                  </div>
                  
                  {item.cost_price && profitInfo && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Profit:</span>
                      <span className="text-sm">
                        ${profitInfo.profit.toFixed(2)} ({profitInfo.margin.toFixed(1)}%)
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Stock:</span>
                    <Badge variant={stockStatus.color as any}>
                      {item.stock_quantity} units
                    </Badge>
                  </div>

                  {item.preparation_time_minutes && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Prep Time:</span>
                      <span className="text-sm">{item.preparation_time_minutes} min</span>
                    </div>
                  )}
                </div>

                {/* Dietary Tags */}
                {item.dietary_tags && item.dietary_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.dietary_tags.slice(0, 3).map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {item.dietary_tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{item.dietary_tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                {/* Spice Level */}
                {item.spice_level > 0 && (
                  <div className="flex items-center gap-1 mb-3">
                    <span className="text-sm">Spice:</span>
                    <div className="flex">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span
                          key={i}
                          className={`text-xs ${
                            i < item.spice_level ? 'text-red-500' : 'text-gray-300'
                          }`}
                        >
                          🌶️
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onEditItem(item)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Menu Item</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{item.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteItem(item.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No menu items found</h3>
            <p className="text-muted-foreground">
              {menuItems.length === 0
                ? "Get started by adding your first menu item."
                : "Try adjusting your search or filter criteria."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MenuItemsList;