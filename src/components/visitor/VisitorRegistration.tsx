import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { QrCode, User, Mail, Phone, Building, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface VisitorFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  purpose: string;
  hostEmployee: string;
  visitDate: string;
  visitTime: string;
  duration: string;
  notes: string;
}

export const VisitorRegistration: React.FC = () => {
  const [formData, setFormData] = useState<VisitorFormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    purpose: '',
    hostEmployee: '',
    visitDate: '',
    visitTime: '',
    duration: '1',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);

  const handleInputChange = (field: keyof VisitorFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate QR code data
      const qrData = `VISITOR:${formData.name}:${Date.now()}`;
      setGeneratedQR(qrData);
      
      toast.success('Visitor registered successfully! QR code generated.');
    } catch (error) {
      toast.error('Failed to register visitor. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const purposeOptions = [
    'Business Meeting',
    'Interview',
    'Delivery',
    'Maintenance',
    'Client Visit',
    'Vendor Meeting',
    'Other'
  ];

  const hostEmployees = [
    'John Smith (Admin)',
    'Sarah Johnson (HR)',
    'Mike Chen (Security)',
    'Emily Davis (Operations)',
    'Other'
  ];

  if (generatedQR) {
    return (
      <div className="space-y-6">
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-green-600 flex items-center justify-center gap-2">
              <QrCode className="h-6 w-6" />
              Registration Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="w-48 h-48 bg-white mx-auto rounded-lg flex items-center justify-center border">
              <QrCode className="h-32 w-32 text-gray-400" />
            </div>
            <div className="space-y-2">
              <p className="font-medium">{formData.name}</p>
              <p className="text-sm text-muted-foreground">{formData.company}</p>
              <Badge variant="outline">{formData.purpose}</Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Visit Date: {formData.visitDate}</p>
              <p>Time: {formData.visitTime}</p>
              <p>Host: {formData.hostEmployee}</p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setGeneratedQR(null)}>
                Register Another
              </Button>
              <Button variant="outline">
                Send via Email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Visitor Pre-Registration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Personal Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Company/Organization</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                  />
                </div>
              </div>

              {/* Visit Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Visit Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose of Visit *</Label>
                  <Select value={formData.purpose} onValueChange={(value) => handleInputChange('purpose', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      {purposeOptions.map((purpose) => (
                        <SelectItem key={purpose} value={purpose}>
                          {purpose}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="host">Host Employee *</Label>
                  <Select value={formData.hostEmployee} onValueChange={(value) => handleInputChange('hostEmployee', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select host" />
                    </SelectTrigger>
                    <SelectContent>
                      {hostEmployees.map((host) => (
                        <SelectItem key={host} value={host}>
                          {host}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="visitDate">Visit Date *</Label>
                    <Input
                      id="visitDate"
                      type="date"
                      value={formData.visitDate}
                      onChange={(e) => handleInputChange('visitDate', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="visitTime">Visit Time *</Label>
                    <Input
                      id="visitTime"
                      type="time"
                      value={formData.visitTime}
                      onChange={(e) => handleInputChange('visitTime', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Expected Duration (hours)</Label>
                  <Select value={formData.duration} onValueChange={(value) => handleInputChange('duration', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">30 minutes</SelectItem>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="2">2 hours</SelectItem>
                      <SelectItem value="4">Half day</SelectItem>
                      <SelectItem value="8">Full day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any special requirements, equipment needs, or additional information..."
                rows={3}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting} className="min-w-32">
                {isSubmitting ? 'Registering...' : 'Generate QR Pass'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};