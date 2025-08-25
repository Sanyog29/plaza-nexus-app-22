import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useRequestOffers } from '@/hooks/useRequestOffers';
import { formatDistanceToNow } from 'date-fns';

export const IncomingTasks = () => {
  const { offers, isLoading, acceptOffer, declineOffer } = useRequestOffers();
  const [processingOffers, setProcessingOffers] = useState<Set<string>>(new Set());

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const handleAccept = async (requestId: string) => {
    setProcessingOffers(prev => new Set(prev).add(requestId));
    try {
      await acceptOffer(requestId);
    } finally {
      setProcessingOffers(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const handleDecline = async (requestId: string) => {
    setProcessingOffers(prev => new Set(prev).add(requestId));
    try {
      await declineOffer(requestId);
    } finally {
      setProcessingOffers(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const expirationTime = new Date(expiresAt);
    const now = new Date();
    const diffMs = expirationTime.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Expired';
    
    const minutes = Math.floor(diffMs / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Incoming Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (offers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Incoming Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No tasks available at the moment</p>
            <p className="text-sm">New task offers will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Incoming Tasks
          <Badge variant="secondary" className="ml-auto">
            {offers.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {offers.map((offer) => {
          const isProcessing = processingOffers.has(offer.request_id);
          
          return (
            <div
              key={offer.id}
              className="border rounded-lg p-4 space-y-3 bg-card"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium">{offer.request.title}</h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {offer.request.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Expires in {getTimeRemaining(offer.expires_at)}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={getPriorityColor(offer.request.priority)}>
                    {offer.request.priority}
                  </Badge>
                  <Badge variant="outline">
                    {offer.request.category?.name || 'General'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAccept(offer.request_id)}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {isProcessing ? 'Claiming...' : 'Accept Task'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDecline(offer.request_id)}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-1" />
                  Decline
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};