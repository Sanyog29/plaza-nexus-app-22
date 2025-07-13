import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserCheck, UserX, Clock, Bell, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface VisitorApprovalRequest {
  id: string;
  visitor_id: string;
  approval_status: string;
  approved_at: string | null;
  rejection_reason: string | null;
  notification_sent_at: string | null;
  response_deadline: string | null;
  created_at: string;
  visitors: {
    id: string;
    name: string;
    company: string | null;
    contact_number: string | null;
    visit_purpose: string | null;
    visit_date: string;
    entry_time: string | null;
  };
}

export function VisitorApprovalNotifications() {
  const [approvalRequests, setApprovalRequests] = useState<VisitorApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<VisitorApprovalRequest | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchApprovalRequests();
  }, []);

  const fetchApprovalRequests = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from("visitor_approval_requests")
        .select(`
          *,
          visitors (
            id,
            name,
            company,
            contact_number,
            visit_purpose,
            visit_date,
            entry_time
          )
        `)
        .eq("host_user_id", user.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApprovalRequests(data || []);
    } catch (error) {
      console.error("Error fetching approval requests:", error);
      toast({
        title: "Error",
        description: "Failed to load approval requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateApprovalStatus = async (
    requestId: string,
    status: "approved" | "rejected",
    reason?: string
  ) => {
    try {
      const updateData: any = {
        approval_status: status,
        approved_at: new Date().toISOString(),
      };

      if (status === "rejected" && reason) {
        updateData.rejection_reason = reason;
      }

      const { error } = await supabase
        .from("visitor_approval_requests")
        .update(updateData)
        .eq("id", requestId);

      if (error) throw error;

      // Also update the visitor record
      const request = approvalRequests.find(r => r.id === requestId);
      if (request) {
        const { error: visitorError } = await supabase
          .from("visitors")
          .update({
            approval_status: status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", request.visitor_id);

        if (visitorError) throw visitorError;
      }

      toast({
        title: `Visitor ${status}`,
        description: `The visitor request has been ${status}`,
      });

      fetchApprovalRequests();
      setRejectionReason("");
      setSelectedRequest(null);
    } catch (error) {
      console.error("Error updating approval status:", error);
      toast({
        title: "Error",
        description: "Failed to update approval status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500 text-white">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const isPending = (request: VisitorApprovalRequest) => 
    request.approval_status === "pending";

  const isExpired = (request: VisitorApprovalRequest) => 
    request.response_deadline && new Date(request.response_deadline) < new Date();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const pendingRequests = approvalRequests.filter(isPending);
  const completedRequests = approvalRequests.filter(r => !isPending(r));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">Visitor Approval Requests</h3>
        {pendingRequests.length > 0 && (
          <Badge className="bg-red-500 text-white">
            {pendingRequests.length} pending
          </Badge>
        )}
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-orange-600">⏰ Pending Approval</h4>
          {pendingRequests.map((request) => (
            <Card key={request.id} className="border-orange-200 bg-orange-50/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{request.visitors.name}</h4>
                      {request.visitors.company && (
                        <Badge variant="outline">{request.visitors.company}</Badge>
                      )}
                      {isExpired(request) && (
                        <Badge variant="destructive">Expired</Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <p><span className="font-medium">Purpose:</span> {request.visitors.visit_purpose}</p>
                      <p><span className="font-medium">Visit Date:</span> {new Date(request.visitors.visit_date).toLocaleDateString()}</p>
                      {request.visitors.entry_time && (
                        <p><span className="font-medium">Entry Time:</span> {request.visitors.entry_time}</p>
                      )}
                      {request.visitors.contact_number && (
                        <p><span className="font-medium">Contact:</span> {request.visitors.contact_number}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Requested {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updateApprovalStatus(request.id, "approved")}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <UserCheck className="w-4 h-4 mr-1" />
                      Approve
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <UserX className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reject Visitor Request</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p>
                            Are you sure you want to reject the visitor request for{" "}
                            <strong>{selectedRequest?.visitors.name}</strong>?
                          </p>
                          <div>
                            <label className="text-sm font-medium">
                              Reason for rejection (optional):
                            </label>
                            <Textarea
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="Please provide a reason for rejection..."
                              className="mt-1"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedRequest(null);
                                setRejectionReason("");
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() =>
                                selectedRequest &&
                                updateApprovalStatus(
                                  selectedRequest.id,
                                  "rejected",
                                  rejectionReason
                                )
                              }
                            >
                              Reject Request
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Completed Requests */}
      {completedRequests.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-muted-foreground">Recent Completed Requests</h4>
          {completedRequests.slice(0, 5).map((request) => (
            <Card key={request.id} className="opacity-75">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{request.visitors.name}</h4>
                      {request.visitors.company && (
                        <Badge variant="outline">{request.visitors.company}</Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <p>{request.visitors.visit_purpose}</p>
                      {request.rejection_reason && (
                        <p className="text-red-600">
                          <span className="font-medium">Rejection reason:</span> {request.rejection_reason}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {request.approved_at
                        ? `Processed ${formatDistanceToNow(new Date(request.approved_at), { addSuffix: true })}`
                        : "Processing..."
                      }
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(request.approval_status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {approvalRequests.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No approval requests</h3>
            <p className="text-muted-foreground">
              You'll receive notifications here when visitors request approval to meet you.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}