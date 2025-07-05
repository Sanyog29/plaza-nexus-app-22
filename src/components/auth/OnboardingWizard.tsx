import React, { useState } from 'react';
import { User, Home, Phone, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';

interface OnboardingWizardProps {
  onComplete: () => void;
}

interface OnboardingData {
  firstName: string;
  lastName: string;
  apartmentNumber: string;
  phoneNumber: string;
  avatarUrl: string | null;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    firstName: '',
    lastName: '',
    apartmentNumber: '',
    phoneNumber: '',
    avatarUrl: null,
  });

  const totalSteps = 3;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleAvatarUpdate = (url: string | null) => {
    setData(prev => ({ ...prev, avatarUrl: url }));
  };

  const validateStep = () => {
    if (currentStep === 1) {
      return data.firstName.trim() && data.lastName.trim();
    }
    if (currentStep === 2) {
      return data.apartmentNumber.trim() && data.phoneNumber.trim();
    }
    return true;
  };

  const handleComplete = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Update or create profile
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          first_name: data.firstName,
          last_name: data.lastName,
          apartment_number: data.apartmentNumber,
          phone_number: data.phoneNumber,
          avatar_url: data.avatarUrl,
          role: 'tenant',
        });

      if (error) throw error;

      toast({
        title: "Welcome to SS Plaza!",
        description: "Your profile has been set up successfully.",
      });

      onComplete();

    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast({
        title: "Setup failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <User className="w-12 h-12 text-primary mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-white">Basic Information</h3>
              <p className="text-muted-foreground">Let's get to know you better</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-white">First Name</Label>
                <Input
                  id="firstName"
                  value={data.firstName}
                  onChange={(e) => setData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="John"
                  className="bg-input border-border"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-white">Last Name</Label>
                <Input
                  id="lastName"
                  value={data.lastName}
                  onChange={(e) => setData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Doe"
                  className="bg-input border-border"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Home className="w-12 h-12 text-primary mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-white">Contact Details</h3>
              <p className="text-muted-foreground">How can we reach you?</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apartment" className="text-white">Apartment Number</Label>
                <Input
                  id="apartment"
                  value={data.apartmentNumber}
                  onChange={(e) => setData(prev => ({ ...prev, apartmentNumber: e.target.value }))}
                  placeholder="A-1001"
                  className="bg-input border-border"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={data.phoneNumber}
                  onChange={(e) => setData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="+1 (555) 123-4567"
                  className="bg-input border-border"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-white">Profile Picture (Optional)</h3>
              <p className="text-muted-foreground">Add a profile picture to personalize your account</p>
            </div>

            <div className="flex justify-center">
              <AvatarUpload
                currentAvatarUrl={data.avatarUrl}
                onAvatarUpdate={handleAvatarUpdate}
                size="lg"
              />
            </div>

            <div className="text-center space-y-2">
              <h4 className="font-medium text-white">
                Welcome, {data.firstName} {data.lastName}!
              </h4>
              <p className="text-sm text-muted-foreground">
                Apartment {data.apartmentNumber} • {data.phoneNumber}
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="text-center">
          <CardTitle className="text-white">Welcome to SS Plaza</CardTitle>
          <CardDescription>
            Let's set up your profile ({currentStep} of {totalSteps})
          </CardDescription>
          
          {/* Progress indicator */}
          <div className="flex justify-center mt-4">
            <div className="flex space-x-2">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index < currentStep
                      ? 'bg-primary'
                      : index === currentStep - 1
                      ? 'bg-primary'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {renderStep()}

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Previous
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={!validateStep()}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90"
              >
                Next
                <ArrowRight size={16} />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">◌</span>
                    Setting up...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};