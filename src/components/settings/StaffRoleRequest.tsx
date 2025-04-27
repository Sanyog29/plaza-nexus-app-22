
import { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const staffRequestSchema = z.object({
  reason: z.string().min(10, { message: "Please provide a detailed reason for your request" })
});

type StaffRequestFormValues = z.infer<typeof staffRequestSchema>;

export function StaffRoleRequest() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  const form = useForm<StaffRequestFormValues>({
    resolver: zodResolver(staffRequestSchema),
    defaultValues: {
      reason: "",
    },
  });

  const checkExistingRequest = async () => {
    const { data, error } = await supabase
      .from('staff_role_requests')
      .select('status')
      .eq('status', 'pending')
      .maybeSingle();

    if (error) {
      console.error('Error checking request status:', error);
      return;
    }

    setHasPendingRequest(!!data);
  };

  useEffect(() => {
    checkExistingRequest();
  }, []);

  async function onSubmit(data: StaffRequestFormValues) {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('staff_role_requests')
        .insert({
          reason: data.reason,
          // user_id is automatically set by RLS policies
        });

      if (error) throw error;

      toast({
        title: "Request submitted",
        description: "Your request for staff role has been submitted and is pending review.",
      });
      
      setHasPendingRequest(true);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (hasPendingRequest) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <h3 className="text-lg font-medium">Staff Role Request</h3>
          <p className="text-sm text-muted-foreground">
            Your request is pending review. You will be notified once it has been processed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h3 className="text-lg font-medium">Request Staff Role</h3>
        <p className="text-sm text-muted-foreground">
          Submit a request to become a staff member. Your request will be reviewed by an administrator.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason for Request</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Explain why you would like to become a staff member..."
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Provide details about your qualifications and why you would be a good fit for the role.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Submitting..." : "Submit Request"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
