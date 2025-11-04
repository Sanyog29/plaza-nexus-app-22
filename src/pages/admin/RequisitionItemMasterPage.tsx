import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/seo/SEOHead';
import { Plus } from 'lucide-react';
import { ItemMasterTable } from '@/components/requisition/ItemMasterTable';
import { CategoryManager } from '@/components/requisition/CategoryManager';
import { AddEditItemModal } from '@/components/requisition/AddEditItemModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const RequisitionItemMasterPage = () => {
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsItemModalOpen(false);
    setEditingItem(null);
  };

  return (
    <>
      <SEOHead
        title="Requisition Item Master"
        description="Manage requisition items and categories"
        url={`${window.location.origin}/admin/requisition-master`}
        type="website"
        noindex
      />
      
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Requisition Item Master</h1>
            <p className="text-muted-foreground mt-1">
              Manage items and categories for requisition lists
            </p>
          </div>
          <Button onClick={() => setIsItemModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>

        <Tabs defaultValue="items" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="space-y-4 mt-6">
            <ItemMasterTable onEditItem={handleEditItem} />
          </TabsContent>

          <TabsContent value="categories" className="space-y-4 mt-6">
            <CategoryManager />
          </TabsContent>
        </Tabs>

        <AddEditItemModal
          open={isItemModalOpen}
          onClose={handleCloseModal}
          item={editingItem}
        />
      </div>
    </>
  );
};

export default RequisitionItemMasterPage;
