
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/sonner';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { CalendarIcon, Clock } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

interface VisitorFormProps {
  onClose: () => void;
  onVisitorAdded: () => void;
}

const formSchema = z.object({
  visitorName: z.string().min(2, {
    message: "Visitor name must be at least 2 characters.",
  }),
  company: z.string().optional(),
  purpose: z.string().min(2, {
    message: "Purpose must be at least 2 characters.",
  }),
  categoryId: z.string().min(1, {
    message: "Please select a visitor category.",
  }),
  mobile: z.string().min(10, {
    message: "Mobile number must be valid.",
  }),
  date: z.date(),
  time: z.string().min(1, {
    message: "Please select a time.",
  }),
  duration: z.string().min(1, {
    message: "Please select duration.",
  }),
  vehicleNumber: z.string().optional(),
  parkingRequired: z.boolean().default(false),
  notes: z.string().optional(),
});

const VisitorForm: React.FC<VisitorFormProps> = ({ onClose, onVisitorAdded }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      visitorName: "",
      company: "",
      purpose: "",
      categoryId: "",
      mobile: "",
      date: new Date(),
      time: "",
      duration: "",
      vehicleNumber: "",
      parkingRequired: false,
      notes: "",
    },
  });

  // Fetch visitor categories
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('visitor_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (data) {
        setCategories(data);
      }
    };

    fetchCategories();
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      // Create visitor record
      const { data: visitor, error: visitorError } = await supabase
        .from('visitors')
        .insert({
          name: values.visitorName,
          company: values.company || null,
          visit_purpose: values.purpose,
          category_id: values.categoryId,
          contact_number: values.mobile,
          visit_date: values.date.toISOString().split('T')[0],
          entry_time: values.time,
          host_id: user.id,
          notes: values.notes || null,
          approval_status: 'pending',
          status: 'scheduled'
        })
        .select()
        .maybeSingle();

      if (visitorError) throw visitorError;

      // Create parking request if needed
      if (values.parkingRequired && values.vehicleNumber && visitor) {
        const { error: parkingError } = await supabase
          .from('parking_requests')
          .insert({
            visitor_id: visitor.id,
            user_id: user.id,
            vehicle_number: values.vehicleNumber,
            visit_date: values.date.toISOString().split('T')[0],
            duration: values.duration,
            approved: false
          });

        if (parkingError) {
          console.error('Error creating parking request:', parkingError);
          // Don't fail the whole operation for parking
        }
      }

      toast.success("Visitor Registered", {
        description: `${values.visitorName} has been scheduled for ${format(values.date, 'PPP')} at ${values.time}. Approval pending.`,
      });
      
      onVisitorAdded();
    } catch (error: any) {
      console.error('Error registering visitor:', error);
      toast.error("Error", {
        description: "Failed to register visitor. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-card text-white sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Register a Visitor</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="visitorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visitor Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} className="bg-background/50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter company name" {...field} className="bg-background/50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visitor Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Select visitor category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            {category.icon && <span>{category.icon}</span>}
                            <span>{category.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose of Visit</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter purpose" {...field} className="bg-background/50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter mobile number" {...field} className="bg-background/50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visit Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : "Pick a date"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background/50">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: 24 }).map((_, i) => {
                          const hour = i % 12 || 12;
                          const ampm = i < 12 ? 'AM' : 'PM';
                          const time = `${hour}:00 ${ampm}`;
                          return <SelectItem key={time} value={time}>{time}</SelectItem>;
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="30 mins">30 minutes</SelectItem>
                      <SelectItem value="1 hour">1 hour</SelectItem>
                      <SelectItem value="2 hours">2 hours</SelectItem>
                      <SelectItem value="4 hours">4 hours</SelectItem>
                      <SelectItem value="Full day">Full day</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parkingRequired"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Parking Required</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Check this if the visitor needs parking space
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {form.watch("parkingRequired") && (
              <FormField
                control={form.control}
                name="vehicleNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Number</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter vehicle number" 
                        {...field} 
                        className="bg-background/50" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Any special requirements or notes" {...field} className="bg-background/50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="mt-2 sm:mt-0"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-plaza-blue hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Registering..." : "Register Visitor"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default VisitorForm;
