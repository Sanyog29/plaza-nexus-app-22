import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ItemCategoryGrid } from './ItemCategoryGrid';
import { ItemSearchAndSelect } from './ItemSearchAndSelect';
import { RequisitionCart } from './RequisitionCart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const ItemSelectionStep = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Select Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="categories" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="categories">By Category</TabsTrigger>
                <TabsTrigger value="search">Search</TabsTrigger>
              </TabsList>

              <TabsContent value="categories" className="mt-6">
                <ItemCategoryGrid />
              </TabsContent>

              <TabsContent value="search" className="mt-6">
                <ItemSearchAndSelect />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <div className="sticky top-6">
          <RequisitionCart />
        </div>
      </div>
    </div>
  );
};
