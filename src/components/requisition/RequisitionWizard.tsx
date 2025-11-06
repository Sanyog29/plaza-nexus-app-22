import React, { startTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCreateRequisition } from '@/hooks/useCreateRequisition';
import { ItemSelectionStep } from './ItemSelectionStep';
import { RequisitionSummaryStep } from './RequisitionSummaryStep';
import { RequisitionReviewStep } from './RequisitionReviewStep';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigationTransition } from '@/hooks/useNavigationTransition';

const steps = [
  { id: 1, name: 'Basic Info', description: 'Property & details' },
  { id: 2, name: 'Select Items', description: 'Choose items' },
  { id: 3, name: 'Review', description: 'Submit requisition' },
];

export const RequisitionWizard = () => {
  const { navigate } = useNavigationTransition();
  const {
    currentStep,
    setCurrentStep,
    formData,
    selectedItems,
    saveDraft,
    submitForApproval,
  } = useCreateRequisition();

  const handleSaveDraft = async () => {
    await saveDraft.mutateAsync();
    navigate('/procurement/my-requisitions');
  };

  const handleSubmit = async () => {
    await submitForApproval.mutateAsync();
    navigate('/procurement/my-requisitions');
  };

  const handleNext = () => {
    startTransition(() => {
      setCurrentStep(currentStep + 1);
    });
  };

  const handlePrevious = () => {
    startTransition(() => {
      setCurrentStep(Math.max(1, currentStep - 1));
    });
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center">
                  <div
                    className={cn(
                      'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                      currentStep > step.id
                        ? 'bg-primary border-primary text-primary-foreground'
                        : currentStep === step.id
                        ? 'border-primary text-primary'
                        : 'border-muted text-muted-foreground'
                    )}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{step.name}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 bg-muted mx-4" />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <div className="min-h-[600px]">
        {currentStep === 1 && <RequisitionSummaryStep />}
        {currentStep === 2 && <ItemSelectionStep />}
        {currentStep === 3 && <RequisitionReviewStep />}
      </div>

      {/* Navigation Buttons */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            <div className="flex flex-col items-end gap-2">
              <div className="flex gap-2">
                {currentStep < 3 && (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleSaveDraft}
                      disabled={saveDraft.isPending || selectedItems.length === 0}
                    >
                      Save Draft
                    </Button>
                    <Button
                      onClick={handleNext}
                      disabled={
                        (currentStep === 1 && !formData.property_id) ||
                        (currentStep === 2 && selectedItems.length === 0)
                      }
                    >
                      Next
                    </Button>
                  </>
                )}

                {currentStep === 3 && (
                  <Button
                    onClick={handleSubmit}
                    disabled={submitForApproval.isPending}
                  >
                    {submitForApproval.isPending ? 'Submitting...' : 'Submit for Approval'}
                  </Button>
                )}
              </div>
              
              {/* Helper text for disabled buttons */}
              {currentStep === 1 && !formData.property_id && (
                <p className="text-sm text-muted-foreground">
                  Loading property information...
                </p>
              )}
              {currentStep === 2 && selectedItems.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Add at least one item to continue
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
