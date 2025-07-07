import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Bot, Users } from 'lucide-react';

export const SmartRequestRouting = () => {
  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-white flex items-center gap-2">
        <Bot className="h-5 w-5" />
        Smart Routing Engine
      </h4>
      <Card className="bg-card/30 border-border/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-white">2847</div>
              <div className="text-xs text-muted-foreground">Requests Routed</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-400">94.2%</div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-400">1.8h</div>
              <div className="text-xs text-muted-foreground">Avg Response</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-400">4.6/5</div>
              <div className="text-xs text-muted-foreground">Staff Rating</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};