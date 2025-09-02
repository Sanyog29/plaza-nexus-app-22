
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, BarChart3, Settings, Database } from 'lucide-react';
import UnifiedDataExportTools from './UnifiedDataExportTools';

export const OperationsTabs: React.FC = () => {
  return (
    <Tabs defaultValue="export" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="export" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Data Export
        </TabsTrigger>
        <TabsTrigger value="analytics" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Analytics
        </TabsTrigger>
        <TabsTrigger value="settings" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Settings
        </TabsTrigger>
        <TabsTrigger value="database" className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          Database
        </TabsTrigger>
      </TabsList>

      <TabsContent value="export">
        <UnifiedDataExportTools />
      </TabsContent>

      <TabsContent value="analytics">
        <div className="text-center py-12 text-muted-foreground">
          Operations Analytics coming soon...
        </div>
      </TabsContent>

      <TabsContent value="settings">
        <div className="text-center py-12 text-muted-foreground">
          System Settings coming soon...
        </div>
      </TabsContent>

      <TabsContent value="database">
        <div className="text-center py-12 text-muted-foreground">
          Database Management coming soon...
        </div>
      </TabsContent>
    </Tabs>
  );
};
