import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Clock, User, FileText, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface TimeExtensionApprovalCardProps {
  extension: {
    id: string;
    request_id: string;
    additional_hours: number;
    reason: string;
    notes?: string;
    created_at: string;
    requested_by_profile?: {
      first_name: string;
      last_name: string;
    };
    maintenance_request?: {
      title: string;
      priority: string;
      status: string;
    };
  };
  onApprove: (extensionId: string, reviewNotes?: string) => Promise<void>;
  onReject: (extensionId: string, reviewNotes?: string) => Promise<void>;
  isProcessing?: boolean;
}

export const TimeExtensionApprovalCard: React.FC<TimeExtensionApprovalCardProps> = ({
  extension,
  onApprove,
  onReject,
  isProcessing = false
}) => {
  const [reviewNotes, setReviewNotes] = useState('');
  const [showReviewNotes, setShowReviewNotes] = useState(false);

  const handleApprove = async () => {
    await onApprove(extension.id, reviewNotes || undefined);
    setReviewNotes('');
    setShowReviewNotes(false);
  };

  const handleReject = async () => {
    if (!reviewNotes) {
      setShowReviewNotes(true);
      return;
    }
    await onReject(extension.id, reviewNotes);
    setReviewNotes('');
    setShowReviewNotes(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time Extension Request
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              {extension.requested_by_profile?.first_name} {extension.requested_by_profile?.last_name}
              • {format(new Date(extension.created_at), 'MMM dd, yyyy HH:mm')}
            </div>
          </div>
          <div className="flex gap-2">
            {extension.maintenance_request && (
              <Badge variant={getPriorityColor(extension.maintenance_request.priority)}>
                {extension.maintenance_request.priority}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {extension.maintenance_request && (
          <div>
            <Label className="text-sm font-medium">Request Title</Label>
            <p className="text-sm text-muted-foreground">
              {extension.maintenance_request.title}
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Additional Hours Requested</Label>
            <p className="text-lg font-semibold text-primary">
              +{extension.additional_hours} hours
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium">Reason</Label>
            <p className="text-sm text-muted-foreground">
              {extension.reason}
            </p>
          </div>
        </div>
        
        {extension.notes && (
          <div>
            <Label className="text-sm font-medium flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Additional Notes
            </Label>
            <p className="text-sm text-muted-foreground mt-1 p-2 bg-muted rounded">
              {extension.notes}
            </p>
          </div>
        )}
        
        {showReviewNotes && (
          <div className="space-y-2">
            <Label htmlFor="review-notes">Review Notes (Required for rejection)</Label>
            <Textarea
              id="review-notes"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Explain your decision..."
              rows={3}
            />
          </div>
        )}
        
        <div className="flex gap-2">
          <Button
            onClick={handleApprove}
            disabled={isProcessing}
            className="flex-1"
            variant="default"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Approve'}
          </Button>
          <Button
            onClick={handleReject}
            disabled={isProcessing}
            className="flex-1"
            variant="destructive"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
          {!showReviewNotes && (
            <Button
              onClick={() => setShowReviewNotes(!showReviewNotes)}
              variant="outline"
              size="sm"
            >
              Add Notes
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};