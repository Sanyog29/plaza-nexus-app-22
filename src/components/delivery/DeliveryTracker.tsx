import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Package, Search, Clock, CheckCircle, AlertCircle, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Delivery {
  id: string;
  tracking_number: string | null;
  recipient_name: string;
  recipient_company: string | null;
  recipient_contact: string | null;
  sender_name: string | null;
  sender_company: string | null;
  delivery_service: string | null;
  package_type: string;
  package_description: string | null;
  status: string;
  pickup_code: string | null;
  delivery_date: string;
  delivery_time: string | null;
  created_at: string;
  photo_urls: string[] | null;
  special_instructions: string | null;
}

const statusConfig = {
  pending: { label: "Pending Pickup", icon: Clock, color: "bg-yellow-500" },
  ready: { label: "Ready for Pickup", icon: Package, color: "bg-blue-500" },
  picked_up: { label: "Picked Up", icon: CheckCircle, color: "bg-green-500" },
  expired: { label: "Expired", icon: AlertCircle, color: "bg-red-500" },
};

export function DeliveryTracker() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const { data, error } = await supabase
        .from("deliveries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDeliveries(data || []);
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      toast({
        title: "Error",
        description: "Failed to load deliveries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryStatus = async (deliveryId: string, newStatus: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const updateData: any = { status: newStatus };
      
      if (newStatus === "picked_up") {
        updateData.pickup_at = new Date().toISOString();
        updateData.pickup_by = user.user.id;
      }

      const { error } = await supabase
        .from("deliveries")
        .update(updateData)
        .eq("id", deliveryId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Delivery marked as ${newStatus.replace("_", " ")}`,
      });

      fetchDeliveries();
    } catch (error) {
      console.error("Error updating delivery status:", error);
      toast({
        title: "Error",
        description: "Failed to update delivery status",
        variant: "destructive",
      });
    }
  };

  const filteredDeliveries = deliveries.filter(delivery =>
    delivery.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    delivery.tracking_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    delivery.pickup_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    delivery.recipient_company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${config.color}`} />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium">Delivery Tracker</h3>
        </div>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search deliveries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      {filteredDeliveries.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No deliveries found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? "Try adjusting your search query" : "No deliveries have been logged yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDeliveries.map((delivery) => (
            <Card key={delivery.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{delivery.recipient_name}</h4>
                      {delivery.recipient_company && (
                        <Badge variant="outline">{delivery.recipient_company}</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{delivery.package_type}</span>
                      {delivery.tracking_number && (
                        <span>#{delivery.tracking_number}</span>
                      )}
                      {delivery.delivery_service && (
                        <span>{delivery.delivery_service}</span>
                      )}
                    </div>

                    {delivery.pickup_code && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Pickup Code:</span>
                        <Badge className="font-mono text-lg">
                          {delivery.pickup_code}
                        </Badge>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(delivery.created_at), { addSuffix: true })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {getStatusBadge(delivery.status)}
                    
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedDelivery(delivery)}
                          >
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Delivery Details</DialogTitle>
                          </DialogHeader>
                          {selectedDelivery && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium mb-2">Recipient</h4>
                                  <p>{selectedDelivery.recipient_name}</p>
                                  {selectedDelivery.recipient_company && (
                                    <p className="text-sm text-muted-foreground">
                                      {selectedDelivery.recipient_company}
                                    </p>
                                  )}
                                  {selectedDelivery.recipient_contact && (
                                    <p className="text-sm text-muted-foreground">
                                      {selectedDelivery.recipient_contact}
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Sender</h4>
                                  <p>{selectedDelivery.sender_name || "N/A"}</p>
                                  {selectedDelivery.sender_company && (
                                    <p className="text-sm text-muted-foreground">
                                      {selectedDelivery.sender_company}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div>
                                <h4 className="font-medium mb-2">Package Information</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Type:</span> {selectedDelivery.package_type}
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Service:</span> {selectedDelivery.delivery_service || "N/A"}
                                  </div>
                                </div>
                                {selectedDelivery.package_description && (
                                  <p className="text-sm mt-2">{selectedDelivery.package_description}</p>
                                )}
                              </div>

                              {selectedDelivery.special_instructions && (
                                <div>
                                  <h4 className="font-medium mb-2">Special Instructions</h4>
                                  <p className="text-sm">{selectedDelivery.special_instructions}</p>
                                </div>
                              )}

                              {selectedDelivery.photo_urls && selectedDelivery.photo_urls.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-2">Package Photos</h4>
                                  <div className="grid grid-cols-3 gap-2">
                                    {selectedDelivery.photo_urls.map((url, index) => (
                                      <img
                                        key={index}
                                        src={url}
                                        alt={`Package photo ${index + 1}`}
                                        className="w-full h-24 object-cover rounded-lg"
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {delivery.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => updateDeliveryStatus(delivery.id, "ready")}
                        >
                          Mark Ready
                        </Button>
                      )}

                      {delivery.status === "ready" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateDeliveryStatus(delivery.id, "picked_up")}
                        >
                          Mark Picked Up
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}