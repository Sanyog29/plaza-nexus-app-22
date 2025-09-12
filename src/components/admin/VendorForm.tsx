import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, CreditCard, FileText, Utensils } from 'lucide-react';

interface VendorFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface VendorFormData {
  name: string;
  description: string;
  cuisine_type: string;
  stall_location: string;
  contact_email: string;
  contact_phone: string;
  commission_rate: number;
  logo_url: string;
  bank_account_number: string;
  bank_ifsc_code: string;
  bank_account_holder_name: string;
  gst_number: string;
  pan_number: string;
  operating_hours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
}

const VendorForm: React.FC<VendorFormProps> = ({ onSuccess, onCancel }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<VendorFormData>({
    name: '',
    description: '',
    cuisine_type: '',
    stall_location: '',
    contact_email: '',
    contact_phone: '',
    commission_rate: 15,
    logo_url: '',
    bank_account_number: '',
    bank_ifsc_code: '',
    bank_account_holder_name: '',
    gst_number: '',
    pan_number: '',
    operating_hours: {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '09:00', close: '17:00', closed: false },
      sunday: { open: '09:00', close: '17:00', closed: true },
    }
  });

  const createVendor = useMutation({
    mutationFn: async (vendorData: VendorFormData) => {
      const { data, error } = await supabase.rpc('admin_create_vendor', {
        vendor_data: vendorData as any
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendors'] });
      toast({
        title: "Vendor Created",
        description: "Vendor has been created successfully and is pending approval.",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create vendor.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await createVendor.mutateAsync(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: keyof VendorFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateOperatingHours = (day: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      operating_hours: {
        ...prev.operating_hours,
        [day]: {
          ...prev.operating_hours[day as keyof typeof prev.operating_hours],
          [field]: value
        }
      }
    }));
  };

  const cuisineTypes = [
    'Indian', 'Chinese', 'Italian', 'Mexican', 'Thai', 'Japanese', 
    'Continental', 'Fast Food', 'Healthy', 'Desserts', 'Beverages', 'Other'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <Utensils className="h-4 w-4" />
            Operations
          </TabsTrigger>
          <TabsTrigger value="banking" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Banking
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Vendor Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    placeholder="Enter vendor business name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="cuisine_type">Cuisine Type *</Label>
                  <Select value={formData.cuisine_type} onValueChange={(value) => updateFormData('cuisine_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cuisine type" />
                    </SelectTrigger>
                    <SelectContent>
                      {cuisineTypes.map((cuisine) => (
                        <SelectItem key={cuisine} value={cuisine}>{cuisine}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  placeholder="Brief description of the vendor and their specialties"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stall_location">Stall Location *</Label>
                  <Input
                    id="stall_location"
                    value={formData.stall_location}
                    onChange={(e) => updateFormData('stall_location', e.target.value)}
                    placeholder="e.g., Food Court Level 1, Stall A"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    value={formData.logo_url}
                    onChange={(e) => updateFormData('logo_url', e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact & Operations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_email">Contact Email *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => updateFormData('contact_email', e.target.value)}
                    placeholder="vendor@example.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="contact_phone">Contact Phone *</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => updateFormData('contact_phone', e.target.value)}
                    placeholder="+91 9876543210"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                <Input
                  id="commission_rate"
                  type="number"
                  min="0"
                  max="50"
                  step="0.1"
                  value={formData.commission_rate}
                  onChange={(e) => updateFormData('commission_rate', parseFloat(e.target.value))}
                />
              </div>

              <div>
                <Label>Operating Hours</Label>
                <div className="space-y-3 mt-2">
                  {Object.entries(formData.operating_hours).map(([day, hours]) => (
                    <div key={day} className="flex items-center gap-4">
                      <div className="w-20 text-sm font-medium capitalize">{day}</div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!hours.closed}
                          onChange={(e) => updateOperatingHours(day, 'closed', !e.target.checked)}
                          className="mr-2"
                        />
                        <Input
                          type="time"
                          value={hours.open}
                          onChange={(e) => updateOperatingHours(day, 'open', e.target.value)}
                          disabled={hours.closed}
                          className="w-32"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={hours.close}
                          onChange={(e) => updateOperatingHours(day, 'close', e.target.value)}
                          disabled={hours.closed}
                          className="w-32"
                        />
                        <span className="text-muted-foreground text-sm">
                          {hours.closed ? 'Closed' : 'Open'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Banking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bank_account_holder_name">Account Holder Name</Label>
                <Input
                  id="bank_account_holder_name"
                  value={formData.bank_account_holder_name}
                  onChange={(e) => updateFormData('bank_account_holder_name', e.target.value)}
                  placeholder="As per bank records"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bank_account_number">Account Number</Label>
                  <Input
                    id="bank_account_number"
                    value={formData.bank_account_number}
                    onChange={(e) => updateFormData('bank_account_number', e.target.value)}
                    placeholder="1234567890123456"
                  />
                </div>

                <div>
                  <Label htmlFor="bank_ifsc_code">IFSC Code</Label>
                  <Input
                    id="bank_ifsc_code"
                    value={formData.bank_ifsc_code}
                    onChange={(e) => updateFormData('bank_ifsc_code', e.target.value)}
                    placeholder="ABCD0123456"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Legal Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gst_number">GST Number</Label>
                  <Input
                    id="gst_number"
                    value={formData.gst_number}
                    onChange={(e) => updateFormData('gst_number', e.target.value)}
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>

                <div>
                  <Label htmlFor="pan_number">PAN Number</Label>
                  <Input
                    id="pan_number"
                    value={formData.pan_number}
                    onChange={(e) => updateFormData('pan_number', e.target.value)}
                    placeholder="ABCDE1234F"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || !formData.name || !formData.cuisine_type || !formData.stall_location}
          className="btn-primary"
        >
          {isSubmitting ? 'Creating...' : 'Create Vendor'}
        </Button>
      </div>
    </form>
  );
};

export default VendorForm;