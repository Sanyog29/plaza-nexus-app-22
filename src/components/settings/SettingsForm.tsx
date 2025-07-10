import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/components/AuthProvider"
import { StaffRoleRequest } from "./StaffRoleRequest";
import { NotificationSettings } from "./NotificationSettings";
import { EmergencyContactSettings } from "./EmergencyContactSettings";
import { AdvancedSettings } from "./AdvancedSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Bell, UserCheck, Settings } from "lucide-react";

import DOMPurify from 'dompurify';

const settingsFormSchema = z.object({
  firstName: z.string()
    .min(2, { message: "First name must be at least 2 characters" })
    .max(50, { message: "First name must be less than 50 characters" })
    .transform((val) => DOMPurify.sanitize(val, { ALLOWED_TAGS: [] })),
  lastName: z.string()
    .min(2, { message: "Last name must be at least 2 characters" })
    .max(50, { message: "Last name must be less than 50 characters" })
    .transform((val) => DOMPurify.sanitize(val, { ALLOWED_TAGS: [] })),
  email: z.string().email({ message: "Please enter a valid email" }),
  phone: z.string()
    .min(10, { message: "Please enter a valid phone number" })
    .max(20, { message: "Phone number must be less than 20 characters" })
    .transform((val) => DOMPurify.sanitize(val, { ALLOWED_TAGS: [] })),
  officeNumber: z.string()
    .min(1, { message: "Office number is required" })
    .max(10, { message: "Office number must be less than 10 characters" })
    .transform((val) => DOMPurify.sanitize(val, { ALLOWED_TAGS: [] })),
  department: z.string()
    .min(1, { message: "Department is required" })
    .max(50, { message: "Department must be less than 50 characters" })
    .transform((val) => DOMPurify.sanitize(val, { ALLOWED_TAGS: [] })),
  floor: z.string()
    .max(10, { message: "Floor must be less than 10 characters" })
    .transform((val) => DOMPurify.sanitize(val, { ALLOWED_TAGS: [] }))
    .optional(),
  zone: z.string()
    .max(20, { message: "Zone must be less than 20 characters" })
    .transform((val) => DOMPurify.sanitize(val, { ALLOWED_TAGS: [] }))
    .optional(),
})

type SettingsFormValues = z.infer<typeof settingsFormSchema>

export function SettingsForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: async () => {
      if (!user) return {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        officeNumber: "",
        notifications: true,
      };

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      return {
        firstName: profile?.first_name ?? "",
        lastName: profile?.last_name ?? "",
        email: user.email ?? "",
        phone: profile?.phone_number ?? "",
        officeNumber: profile?.office_number ?? "",
        department: profile?.department ?? "",
        floor: profile?.floor ?? "",
        zone: profile?.zone ?? "",
      };
    },
  });

  async function onSubmit(data: SettingsFormValues) {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          phone_number: data.phone,
          office_number: data.officeNumber,
          department: data.department,
          floor: data.floor || null,
          zone: data.zone || null,
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Settings updated",
        description: "Your settings have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="basic" className="flex items-center space-x-2">
          <User className="h-4 w-4" />
          <span>Basic</span>
        </TabsTrigger>
        <TabsTrigger value="notifications" className="flex items-center space-x-2">
          <Bell className="h-4 w-4" />
          <span>Notifications</span>
        </TabsTrigger>
        <TabsTrigger value="emergency" className="flex items-center space-x-2">
          <UserCheck className="h-4 w-4" />
          <span>Emergency</span>
        </TabsTrigger>
        <TabsTrigger value="advanced" className="flex items-center space-x-2">
          <Settings className="h-4 w-4" />
          <span>Advanced</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="mt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" disabled {...field} />
                  </FormControl>
                  <FormDescription>
                    Email cannot be changed. Contact support for assistance.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="officeNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Office Number</FormLabel>
                    <FormControl>
                      <Input placeholder="101, A-205" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="it">Information Technology</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                      <SelectItem value="legal">Legal</SelectItem>
                      <SelectItem value="admin">Administration</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="floor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Floor (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 5th Floor, Ground" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="zone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zone (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., North Wing, Zone A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </Form>

        <div className="mt-10 pt-10 border-t">
          <StaffRoleRequest />
        </div>
      </TabsContent>

      <TabsContent value="notifications" className="mt-6">
        <NotificationSettings />
      </TabsContent>

      <TabsContent value="emergency" className="mt-6">
        <EmergencyContactSettings />
      </TabsContent>

      <TabsContent value="advanced" className="mt-6">
        <AdvancedSettings />
      </TabsContent>
    </Tabs>
  );
}
