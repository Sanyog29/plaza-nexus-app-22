
import { EnhancedUserManagement } from '@/components/admin/EnhancedUserManagement';
import { BulkUserUpload } from '@/components/admin/BulkUserUpload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const UserManagementPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Create, manage, and monitor user accounts across the system
          </p>
        </div>
        
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="bulk-upload">Bulk Upload</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <EnhancedUserManagement />
          </TabsContent>
          
          <TabsContent value="bulk-upload">
            <BulkUserUpload onSuccess={() => {
              // Optionally refresh the user list or show a success message
            }} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserManagementPage;
