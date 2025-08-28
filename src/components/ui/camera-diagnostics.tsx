import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { CameraDiagnostics } from '@/hooks/useCamera';

interface CameraDiagnosticsUIProps {
  diagnostics: CameraDiagnostics;
  className?: string;
}

export function CameraDiagnosticsUI({ diagnostics, className }: CameraDiagnosticsUIProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getStatusBadge = (condition: boolean, label: string) => (
    <Badge variant={condition ? "default" : "destructive"}>
      {condition ? "✓" : "✗"} {label}
    </Badge>
  );

  return (
    <Card className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Camera Diagnostics
              </div>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {getStatusBadge(diagnostics.isSecureContext, "Secure Context")}
              {getStatusBadge(diagnostics.hasGetUserMedia, "getUserMedia API")}
              {getStatusBadge(diagnostics.isNative, "Native Platform")}
              {getStatusBadge(diagnostics.activeTracks > 0, "Active Tracks")}
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Active tracks: {diagnostics.activeTracks}</div>
              {diagnostics.lastError && (
                <div className="text-destructive">
                  Last error: {diagnostics.lastError}
                </div>
              )}
            </div>

            <div className="text-xs text-muted-foreground pt-2 border-t">
              <div><strong>Secure Context:</strong> HTTPS or localhost required</div>
              <div><strong>getUserMedia:</strong> Browser camera API support</div>
              <div><strong>Native Platform:</strong> Capacitor app environment</div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}