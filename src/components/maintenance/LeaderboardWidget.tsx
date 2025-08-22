import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Crown, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

interface LeaderboardEntry {
  id: string;
  technician_name: string;
  avatar_url?: string;
  department?: string;
  current_tier: string;
  monthly_points: number;
  total_points: number;
  tickets_completed: number;
  avg_completion_hours: number;
}

interface LeaderboardWidgetProps {
  period?: 'monthly' | 'all_time';
  showStats?: boolean;
  limit?: number;
}

const LeaderboardWidget: React.FC<LeaderboardWidgetProps> = ({
  period = 'monthly',
  showStats = true,
  limit = 10
}) => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [period, limit]);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('monthly_leaderboard')
        .select('*')
        .limit(limit);

      if (error) throw error;

      setLeaderboard(data || []);

      // Find user's rank
      const userIndex = data?.findIndex(entry => entry.id === user?.id);
      setUserRank(userIndex !== -1 && userIndex !== undefined ? userIndex + 1 : null);

    } catch (error: any) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Award className="w-5 h-5 text-amber-600" />;
      default: return <span className="text-sm font-bold text-muted-foreground">#{position}</span>;
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'gold': return 'bg-yellow-500';
      case 'silver': return 'bg-gray-400';
      case 'bronze': return 'bg-amber-600';
      default: return 'bg-muted';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading leaderboard...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Monthly Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="points" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="points">Points</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
          </TabsList>
          
          <TabsContent value="points" className="space-y-4 mt-4">
            {/* User's Current Rank */}
            {userRank && (
              <>
                <div className="bg-primary/10 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-full text-primary-foreground text-sm font-bold">
                        #{userRank}
                      </div>
                      <span className="font-medium">Your Rank</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {leaderboard[userRank - 1]?.monthly_points || 0} pts
                      </p>
                      <p className="text-xs text-muted-foreground">This month</p>
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Top Rankings */}
            <div className="space-y-3">
              {leaderboard.slice(0, Math.min(limit, 10)).map((entry, index) => (
                <div 
                  key={entry.id} 
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    entry.id === user?.id ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/50'
                  }`}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-8 h-8">
                    {getRankIcon(index + 1)}
                  </div>

                  {/* Avatar */}
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={entry.avatar_url} alt={entry.technician_name} />
                    <AvatarFallback className="text-xs">
                      {getInitials(entry.technician_name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{entry.technician_name}</p>
                      {entry.current_tier && (
                        <div className={`w-2 h-2 rounded-full ${getTierBadgeColor(entry.current_tier)}`} />
                      )}
                    </div>
                    {entry.department && (
                      <p className="text-xs text-muted-foreground truncate">{entry.department}</p>
                    )}
                  </div>

                  {/* Points */}
                  <div className="text-right">
                    <p className="font-semibold">{entry.monthly_points.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tickets" className="space-y-4 mt-4">
            <div className="space-y-3">
              {leaderboard
                .sort((a, b) => b.tickets_completed - a.tickets_completed)
                .slice(0, Math.min(limit, 10))
                .map((entry, index) => (
                <div 
                  key={entry.id} 
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    entry.id === user?.id ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/50'
                  }`}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-8 h-8">
                    <span className="text-sm font-bold text-muted-foreground">#{index + 1}</span>
                  </div>

                  {/* Avatar */}
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={entry.avatar_url} alt={entry.technician_name} />
                    <AvatarFallback className="text-xs">
                      {getInitials(entry.technician_name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{entry.technician_name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {entry.tickets_completed} completed
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {entry.avg_completion_hours.toFixed(1)}h avg
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <p className="font-semibold">{entry.tickets_completed}</p>
                    <p className="text-xs text-muted-foreground">tickets</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Achievement Badges */}
        {showStats && (
          <>
            <Separator className="my-4" />
            <div className="space-y-3">
              <h4 className="font-medium text-sm">This Month's Achievements</h4>
              <div className="grid grid-cols-2 gap-2">
                <Badge variant="secondary" className="justify-center py-2">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {leaderboard[0]?.monthly_points || 0} Top Score
                </Badge>
                <Badge variant="outline" className="justify-center py-2">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {leaderboard.reduce((sum, entry) => sum + entry.tickets_completed, 0)} Completed
                </Badge>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default LeaderboardWidget;