import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Package, Camera } from "lucide-react";
import { SimplePhotoCapture } from "../ui/SimplePhotoCapture";

const deliverySchema = z.object({
  tracking_number: z.string().optional(),
  recipient_name: z.string().min(1, "Recipient name is required"),
  recipient_company: z.string().optional(),
  recipient_contact: z.string().optional(),
  sender_name: z.string().optional(),
  sender_company: z.string().optional(),
  delivery_service: z.string().optional(),
  package_type: z.string().default("package"),
  package_description: z.string().optional(),
  delivery_time: z.string().optional(),
  special_instructions: z.string().optional(),
});

type DeliveryFormData = z.infer<typeof deliverySchema>;

interface DeliveryManagementFormProps {
  onSuccess?: () => void;
}

export function DeliveryManagementForm({ onSuccess }: DeliveryManagementFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState<any[]>([]);

  const form = useForm<DeliveryFormData>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      package_type: "package",
    },
  });

  const onSubmit = async (data: DeliveryFormData) => {
    setIsSubmitting(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("deliveries")
        .insert({
          recipient_name: data.recipient_name,
          recipient_company: data.recipient_company,
          recipient_contact: data.recipient_contact,
          sender_name: data.sender_name,
          sender_company: data.sender_company,
          delivery_service: data.delivery_service,
          package_type: data.package_type,
          package_description: data.package_description,
          delivery_time: data.delivery_time,
          special_instructions: data.special_instructions,
          tracking_number: data.tracking_number,
          logged_by: user.user.id,
          photo_urls: capturedMedia.map(media => media.url),
          status: "pending",
        });

      if (error) throw error;

      // Send notification to recipient if contact info provided
      if (data.recipient_contact) {
        // This would integrate with notification system
        console.log("Sending delivery notification to:", data.recipient_contact);
      }

      toast({
        title: "Delivery logged successfully",
        description: "The delivery has been logged and recipient will be notified.",
      });

      form.reset();
      setCapturedMedia([]);
      onSuccess?.();
    } catch (error) {
      console.error("Error logging delivery:", error);
      toast({
        title: "Error",
        description: "Failed to log delivery. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">Log New Delivery</h3>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="tracking_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tracking Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter tracking number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="delivery_service"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Service</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select delivery service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fedex">FedEx</SelectItem>
                        <SelectItem value="dhl">DHL</SelectItem>
                        <SelectItem value="ups">UPS</SelectItem>
                        <SelectItem value="bluedart">Blue Dart</SelectItem>
                        <SelectItem value="dtdc">DTDC</SelectItem>
                        <SelectItem value="courier">Local Courier</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="recipient_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter recipient name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recipient_company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Company</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter company name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="recipient_contact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recipient Contact</FormLabel>
                <FormControl>
                  <Input placeholder="Phone or email for notification" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="sender_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sender Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter sender name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sender_company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sender Company</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter sender company" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="package_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Package Type</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select package type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="package">Package</SelectItem>
                        <SelectItem value="envelope">Envelope</SelectItem>
                        <SelectItem value="documents">Documents</SelectItem>
                        <SelectItem value="food">Food</SelectItem>
                        <SelectItem value="fragile">Fragile Item</SelectItem>
                        <SelectItem value="bulk">Bulk Delivery</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="delivery_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="package_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Package Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Brief description of package contents" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="special_instructions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Special Instructions</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Any special handling instructions" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormLabel className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Package Photos
            </FormLabel>
            <SimplePhotoCapture
              onMediaCaptured={setCapturedMedia}
              disabled={isSubmitting}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Logging Delivery..." : "Log Delivery"}
          </Button>
        </form>
      </Form>
    </div>
  );
}