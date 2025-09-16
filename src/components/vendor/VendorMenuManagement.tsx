import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Download, Upload, BarChart3, Package, FileSpreadsheet } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MenuItemForm from './menu/MenuItemForm';
import MenuItemsList from './menu/MenuItemsList';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import MenuCategoriesTab from './menu/MenuCategoriesTab';
import MenuExcelImport from './menu/MenuExcelImport';

interface VendorMenuManagementProps {
  vendorId: string;
}

const VendorMenuManagement: React.FC<VendorMenuManagementProps> = ({ vendorId }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('items');

  const handleSuccess = () => {
    setShowAddForm(false);
    setEditingItem(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleImportComplete = () => {
    setRefreshTrigger(prev => prev + 1);
    setActiveTab('items'); // Switch back to items tab after successful import
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    setShowAddForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Menu Management</h2>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => setActiveTab('import')}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="items" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Menu Items
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Import Menu
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Menu Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <MenuItemsList
            vendorId={vendorId}
            onEditItem={handleEditItem}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>

        <TabsContent value="categories">
          <MenuCategoriesTab
            vendorId={vendorId}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>

        <TabsContent value="import">
          <MenuExcelImport 
            vendorId={vendorId}
            onImportComplete={handleImportComplete}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Menu Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Menu analytics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddForm} onOpenChange={(open) => {
        if (!open) {
          setShowAddForm(false);
          setEditingItem(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
            </DialogTitle>
          </DialogHeader>
          <MenuItemForm
            vendorId={vendorId}
            initialData={editingItem}
            onSuccess={handleSuccess}
            onCancel={() => {
              setShowAddForm(false);
              setEditingItem(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorMenuManagement;