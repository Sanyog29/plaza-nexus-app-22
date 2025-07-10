import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
import { useProfile } from "@/hooks/useProfile"
import { useToast } from "@/hooks/use-toast"
import { UserCheck, AlertCircle } from "lucide-react"
import DOMPurify from 'dompurify';

const emergencyContactSchema = z.object({
  emergency_contact_name: z.string()
    .min(1, { message: "Emergency contact name is required" })
    .max(100, { message: "Name must be less than 100 characters" })
    .transform((val) => DOMPurify.sanitize(val, { ALLOWED_TAGS: [] })),
  emergency_contact_phone: z.string()
    .min(10, { message: "Please enter a valid phone number" })
    .max(20, { message: "Phone number must be less than 20 characters" })
    .transform((val) => DOMPurify.sanitize(val, { ALLOWED_TAGS: [] })),
  emergency_contact_relationship: z.string()
    .min(1, { message: "Please specify relationship" })
    .transform((val) => DOMPurify.sanitize(val, { ALLOWED_TAGS: [] })),
});

type EmergencyContactValues = z.infer<typeof emergencyContactSchema>

export function EmergencyContactSettings() {
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const form = useForm<EmergencyContactValues>({
    resolver: zodResolver(emergencyContactSchema),
    defaultValues: {
      emergency_contact_name: profile?.emergency_contact_name || "",
      emergency_contact_phone: profile?.emergency_contact_phone || "",
      emergency_contact_relationship: profile?.emergency_contact_relationship || "",
    },
  });

  const onSubmit = async (data: EmergencyContactValues) => {
    setIsUpdating(true);
    try {
      const success = await updateProfile(data);
      if (success) {
        toast({
          title: "Emergency contact updated",
          description: "Your emergency contact information has been saved.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update emergency contact information.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const hasEmergencyContact = profile?.emergency_contact_name && profile?.emergency_contact_phone;

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <UserCheck className="h-5 w-5 text-primary" />
        <div>
          <h3 className="text-lg font-semibold text-foreground">Emergency Contact</h3>
          <p className="text-sm text-muted-foreground">
            Someone to contact in case of emergency
          </p>
        </div>
      </div>

      {!hasEmergencyContact && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200">No Emergency Contact Set</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                For your safety, please add an emergency contact who can be reached in case of an emergency.
              </p>
            </div>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="emergency_contact_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emergency_contact_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="+1 (555) 000-0000" {...field} />
                </FormControl>
                <FormDescription>
                  Include country code for international numbers
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="emergency_contact_relationship"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Relationship</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="spouse">Spouse</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="child">Child</SelectItem>
                    <SelectItem value="sibling">Sibling</SelectItem>
                    <SelectItem value="friend">Friend</SelectItem>
                    <SelectItem value="colleague">Colleague</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isUpdating} className="w-full">
            {isUpdating ? "Updating..." : "Update Emergency Contact"}
          </Button>
        </form>
      </Form>
    </Card>
  );
}