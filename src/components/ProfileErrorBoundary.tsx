import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ProfileErrorBoundaryProps {
  children: React.ReactNode;
  onSignOut: () => void;
}

interface ProfileErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ProfileErrorBoundary extends React.Component<
  ProfileErrorBoundaryProps,
  ProfileErrorBoundaryState
> {
  constructor(props: ProfileErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ProfileErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Profile error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Card className="p-6">
            <div className="flex flex-col items-center space-y-6">
              <AlertTriangle className="h-12 w-12 text-destructive" />
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  Something went wrong
                </h2>
                <p className="text-muted-foreground mb-6">
                  We encountered an error while loading your profile. Please try signing out and back in.
                </p>
                <div className="space-x-4">
                  <Button 
                    onClick={() => window.location.reload()}
                    variant="outline"
                  >
                    Reload Page
                  </Button>
                  <Button onClick={this.props.onSignOut}>
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}