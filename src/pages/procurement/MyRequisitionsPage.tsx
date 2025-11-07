import React from 'react';
import { SEOHead } from '@/components/seo/SEOHead';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MyTasksList } from '@/components/procurement/MyTasksList';
import { WaitingForApprovalList } from '@/components/procurement/WaitingForApprovalList';
import { useAuth } from '@/components/AuthProvider';
import { Clock } from 'lucide-react';

const MyRequisitionsPage = () => {
  const { userRole } = useAuth();
  const isProcurementRole = userRole === 'purchase_executive' || userRole === 'procurement_manager';

  return (
    <>
      <SEOHead
        title="My Requisitions"
        description="View and manage your requisition lists"
        url={`${window.location.origin}/procurement/my-requisitions`}
        type="website"
        noindex
      />
      
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">My Requisitions</h1>
          <p className="text-muted-foreground mt-1">
            Track status of all your requisition requests
          </p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className={`grid w-full ${isProcurementRole ? 'grid-cols-6' : 'grid-cols-5'}`}>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            {isProcurementRole && (
              <TabsTrigger value="waiting" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Waiting
              </TabsTrigger>
            )}
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <MyTasksList filter="all" />
          </TabsContent>

          <TabsContent value="draft" className="mt-6">
            <MyTasksList filter="draft" />
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            <MyTasksList filter="pending_manager_approval" />
          </TabsContent>

          {isProcurementRole && (
            <TabsContent value="waiting" className="mt-6">
              <WaitingForApprovalList />
            </TabsContent>
          )}

          <TabsContent value="approved" className="mt-6">
            <MyTasksList filter="manager_approved" />
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <MyTasksList filter="all" />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default MyRequisitionsPage;
