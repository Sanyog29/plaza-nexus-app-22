import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, AlertCircle } from 'lucide-react';
import { TimeExtensionApprovalCard } from './TimeExtensionApprovalCard';
import { useTimeExtensions } from '@/hooks/useTimeExtensions';

export const TimeExtensionApprovalsPanel: React.FC = () => {
  const { extensions, isLoading, reviewTimeExtension, fetchPendingExtensions } = useTimeExtensions();
  const [processingExtensions, setProcessingExtensions] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPendingExtensions();
  }, []);

  const handleApproval = async (extensionId: string, reviewNotes?: string) => {
    setProcessingExtensions(prev => new Set(prev).add(extensionId));
    await reviewTimeExtension(extensionId, true, reviewNotes);
    setProcessingExtensions(prev => {
      const newSet = new Set(prev);
      newSet.delete(extensionId);
      return newSet;
    });
  };

  const handleRejection = async (extensionId: string, reviewNotes?: string) => {
    setProcessingExtensions(prev => new Set(prev).add(extensionId));
    await reviewTimeExtension(extensionId, false, reviewNotes);
    setProcessingExtensions(prev => {
      const newSet = new Set(prev);
      newSet.delete(extensionId);
      return newSet;
    });
  };

  const pendingExtensions = extensions.filter(ext => ext.status === 'pending');
  const approvedExtensions = extensions.filter(ext => ext.status === 'approved');
  const rejectedExtensions = extensions.filter(ext => ext.status === 'rejected');

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Extension Approvals
          </CardTitle>
          {pendingExtensions.length > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {pendingExtensions.length} pending
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              Pending
              {pendingExtensions.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {pendingExtensions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({approvedExtensions.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({rejectedExtensions.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="space-y-4 mt-4">
            {pendingExtensions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pending time extension requests</p>
              </div>
            ) : (
              pendingExtensions.map((extension) => (
                <TimeExtensionApprovalCard
                  key={extension.id}
                  extension={extension}
                  onApprove={handleApproval}
                  onReject={handleRejection}
                  isProcessing={processingExtensions.has(extension.id)}
                />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="approved" className="space-y-4 mt-4">
            {approvedExtensions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No approved extensions</p>
              </div>
            ) : (
              <div className="space-y-4">
                {approvedExtensions.map((extension) => (
                  <Card key={extension.id} className="border-green-200 bg-green-50">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            +{extension.additional_hours} hours approved
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {extension.reason}
                          </p>
                        </div>
                        <Badge variant="default" className="bg-green-600">
                          Approved
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="rejected" className="space-y-4 mt-4">
            {rejectedExtensions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No rejected extensions</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rejectedExtensions.map((extension) => (
                  <Card key={extension.id} className="border-red-200 bg-red-50">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            +{extension.additional_hours} hours rejected
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {extension.reason}
                          </p>
                        </div>
                        <Badge variant="destructive">
                          Rejected
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};