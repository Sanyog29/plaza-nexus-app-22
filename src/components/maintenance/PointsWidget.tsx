import React, { useState, useEffect } from 'react';
import { Trophy, Star, TrendingUp, Gift, Coins, Medal, Crown, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';

interface TechnicianPoints {
  id: string;
  technician_id: string;
  points_earned: number;
  points_spent: number;
  points_balance: number;
  current_tier: string;
  total_lifetime_points: number;
}

interface RecentTransaction {
  id: string;
  transaction_type: string;
  points: number;
  reason: string;
  created_at: string;
  metadata?: any;
}

interface PointsWidgetProps {
  compact?: boolean;
  showRewards?: boolean;
}

const PointsWidget: React.FC<PointsWidgetProps> = ({ 
  compact = false, 
  showRewards = true 
}) => {
  const { user } = useAuth();
  const [points, setPoints] = useState<TechnicianPoints | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPointsData();
    }
  }, [user]);

  const fetchPointsData = async () => {
    try {
      // Fetch points balance
      const { data: pointsData, error: pointsError } = await supabase
        .from('technician_points')
        .select('*')
        .eq('technician_id', user?.id)
        .single();

      if (pointsError && pointsError.code !== 'PGRST116') {
        throw pointsError;
      }

      setPoints(pointsData);

      // Fetch recent transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('technician_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (transactionsError) {
        throw transactionsError;
      }

      setRecentTransactions(transactionsData || []);

    } catch (error: any) {
      console.error('Error fetching points data:', error);
      if (error.code !== 'PGRST116') { // Don't show error for "not found"
        toast({
          title: "Error loading points",
          description: error.message,
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getTierInfo = (tier: string) => {
    const tiers = {
      bronze: { 
        label: 'Bronze', 
        icon: Medal, 
        color: 'bg-amber-600', 
        next: 'Silver',
        nextThreshold: 500,
        benefits: ['Basic rewards', '5% bonus points']
      },
      silver: { 
        label: 'Silver', 
        icon: Award, 
        color: 'bg-gray-400', 
        next: 'Gold',
        nextThreshold: 1000,
        benefits: ['Priority rewards', '10% bonus points', 'Monthly vouchers']
      },
      gold: { 
        label: 'Gold', 
        icon: Crown, 
        color: 'bg-yellow-500', 
        next: null,
        nextThreshold: null,
        benefits: ['Premium rewards', '15% bonus points', 'Exclusive perks', 'Priority support']
      }
    };
    return tiers[tier as keyof typeof tiers] || tiers.bronze;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earned': return TrendingUp;
      case 'spent': return Gift;
      case 'bonus': return Star;
      case 'penalty': return TrendingUp; // Could use a different icon
      default: return Coins;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <Card className={compact ? 'h-32' : ''}>
        <CardContent className="p-4 flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!points) {
    return (
      <Card className={compact ? 'h-32' : ''}>
        <CardContent className="p-4 flex items-center justify-center h-full">
          <div className="text-center">
            <Coins className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No points data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const tierInfo = getTierInfo(points.current_tier);
  const TierIcon = tierInfo.icon;
  
  // Calculate progress to next tier
  const progressToNext = tierInfo.nextThreshold 
    ? Math.min((points.total_lifetime_points / tierInfo.nextThreshold) * 100, 100)
    : 100;

  if (compact) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${tierInfo.color}`}>
                <TierIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-semibold">{points.points_balance.toLocaleString()} pts</p>
                <p className="text-xs text-muted-foreground">{tierInfo.label} Tier</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              Rank #{Math.floor(Math.random() * 50) + 1}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Loyalty Points
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Points Balance & Tier */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className={`p-3 rounded-full ${tierInfo.color}`}>
              <TierIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{points.points_balance.toLocaleString()}</h3>
              <p className="text-sm text-muted-foreground">Available Points</p>
            </div>
          </div>

          <Badge variant="secondary" className="text-sm px-3 py-1">
            {tierInfo.label} Tier
          </Badge>

          {/* Progress to Next Tier */}
          {tierInfo.next && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress to {tierInfo.next}</span>
                <span>{points.total_lifetime_points} / {tierInfo.nextThreshold}</span>
              </div>
              <Progress value={progressToNext} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {tierInfo.nextThreshold! - points.total_lifetime_points} points to {tierInfo.next}
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Tier Benefits */}
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Star className="w-4 h-4" />
            Your Benefits
          </h4>
          <div className="space-y-1">
            {tierInfo.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                <span className="text-muted-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        {recentTransactions.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-3">Recent Activity</h4>
              <div className="space-y-2">
                {recentTransactions.slice(0, 3).map((transaction) => {
                  const Icon = getTransactionIcon(transaction.transaction_type);
                  return (
                    <div key={transaction.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate">{transaction.reason}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${
                          transaction.transaction_type === 'earned' || transaction.transaction_type === 'bonus'
                            ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.transaction_type === 'spent' ? '-' : '+'}
                          {transaction.points}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(transaction.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-lg font-semibold text-green-600">
              +{points.points_earned.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Earned This Month</p>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-lg font-semibold">
              {points.total_lifetime_points.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Lifetime Points</p>
          </div>
        </div>

        {/* Rewards CTA */}
        {showRewards && (
          <>
            <Separator />
            <Button variant="outline" className="w-full">
              <Gift className="w-4 h-4 mr-2" />
              Browse Rewards
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PointsWidget;