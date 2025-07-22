import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Users, 
  Star,
  Target,
  Award,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface BenchmarkData {
  metric: string;
  your_score: number;
  industry_avg: number;
  top_performers: number;
  percentile: number;
  trend: 'up' | 'down' | 'stable';
}

interface PerformanceBenchmarkingProps {
  vendorId: string;
}

const PerformanceBenchmarking: React.FC<PerformanceBenchmarkingProps> = ({ vendorId }) => {
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');

  useEffect(() => {
    fetchBenchmarkData();
  }, [vendorId, timeframe]);

  const fetchBenchmarkData = async () => {
    try {
      setLoading(true);
      
      // Fetch vendor performance data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      const { data: analyticsData, error: analyticsError } = await supabase
        .from('vendor_analytics')
        .select('*')
        .eq('vendor_id', vendorId)
        .gte('metric_date', startDate.toISOString().split('T')[0])
        .order('metric_date', { ascending: false });

      if (analyticsError) throw analyticsError;

      const { data: ordersData, error: ordersError } = await supabase
        .from('cafeteria_orders')
        .select(`
          id,
          total_amount,
          status,
          created_at,
          order_feedback (
            overall_rating,
            speed_rating,
            service_rating
          )
        `)
        .eq('vendor_id', vendorId)
        .gte('created_at', startDate.toISOString());

      if (ordersError) throw ordersError;

      // Generate benchmark comparisons
      const benchmarks = generateBenchmarks(analyticsData || [], ordersData || []);
      setBenchmarkData(benchmarks);
      
      // Calculate overall performance score
      const avgPercentile = benchmarks.reduce((sum, b) => sum + b.percentile, 0) / benchmarks.length;
      setOverallScore(avgPercentile);
      
    } catch (error: any) {
      console.error('Error fetching benchmark data:', error);
      toast({
        title: "Error fetching benchmark data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateBenchmarks = (analytics: any[], orders: any[]): BenchmarkData[] => {
    // Calculate vendor metrics
    const totalRevenue = analytics.reduce((sum, a) => sum + Number(a.total_revenue), 0);
    const totalOrders = analytics.reduce((sum, a) => sum + Number(a.total_orders), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    const ratings = orders.flatMap(order => 
      order.order_feedback?.map((feedback: any) => feedback.overall_rating) || []
    ).filter(Boolean);
    const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
    
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const fulfillmentRate = orders.length > 0 ? (completedOrders / orders.length) * 100 : 0;
    
    // Simulate industry benchmarks (in real app, this would come from aggregated data)
    const industryBenchmarks = {
      average_order_value: { avg: 22.50, top: 35.00 },
      customer_satisfaction: { avg: 4.2, top: 4.7 },
      order_fulfillment_rate: { avg: 92, top: 98 },
      revenue_growth: { avg: 15, top: 35 },
      customer_retention: { avg: 65, top: 85 },
      order_frequency: { avg: 2.3, top: 4.1 }
    };

    return [
      {
        metric: 'Average Order Value',
        your_score: avgOrderValue,
        industry_avg: industryBenchmarks.average_order_value.avg,
        top_performers: industryBenchmarks.average_order_value.top,
        percentile: calculatePercentile(avgOrderValue, 15, 45),
        trend: 'up'
      },
      {
        metric: 'Customer Satisfaction',
        your_score: avgRating,
        industry_avg: industryBenchmarks.customer_satisfaction.avg,
        top_performers: industryBenchmarks.customer_satisfaction.top,
        percentile: calculatePercentile(avgRating, 3.5, 5),
        trend: 'stable'
      },
      {
        metric: 'Order Fulfillment Rate',
        your_score: fulfillmentRate,
        industry_avg: industryBenchmarks.order_fulfillment_rate.avg,
        top_performers: industryBenchmarks.order_fulfillment_rate.top,
        percentile: calculatePercentile(fulfillmentRate, 80, 100),
        trend: 'up'
      },
      {
        metric: 'Revenue Growth',
        your_score: 18.5, // Mock calculation
        industry_avg: industryBenchmarks.revenue_growth.avg,
        top_performers: industryBenchmarks.revenue_growth.top,
        percentile: calculatePercentile(18.5, 0, 50),
        trend: 'up'
      },
      {
        metric: 'Customer Retention',
        your_score: 72, // Mock calculation
        industry_avg: industryBenchmarks.customer_retention.avg,
        top_performers: industryBenchmarks.customer_retention.top,
        percentile: calculatePercentile(72, 40, 90),
        trend: 'stable'
      }
    ];
  };

  const calculatePercentile = (value: number, min: number, max: number): number => {
    return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  };

  const getPerformanceLevel = (percentile: number) => {
    if (percentile >= 90) return { level: 'Elite', color: 'text-emerald-600', bg: 'bg-emerald-100' };
    if (percentile >= 75) return { level: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (percentile >= 50) return { level: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (percentile >= 25) return { level: 'Fair', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { level: 'Needs Improvement', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <BarChart3 className="h-4 w-4 text-gray-500" />;
    }
  };

  const radarData = benchmarkData.map(item => ({
    metric: item.metric.split(' ')[0], // Shortened for radar chart
    percentile: item.percentile
  }));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="h-32 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const performanceLevel = getPerformanceLevel(overallScore);

  return (
    <div className="space-y-6">
      {/* Overall Performance Score */}
      <Card className={`border-2 ${performanceLevel.bg.replace('bg-', 'border-').replace('-100', '-200')}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Overall Performance Score
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Your performance vs industry standards
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{overallScore.toFixed(0)}</div>
              <Badge className={`${performanceLevel.bg} ${performanceLevel.color} border-0`}>
                {performanceLevel.level}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={overallScore} className="h-3" />
        </CardContent>
      </Card>

      <Tabs defaultValue="metrics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
          <TabsTrigger value="comparison">Industry Comparison</TabsTrigger>
          <TabsTrigger value="insights">Performance Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benchmarkData.map((benchmark, index) => {
              const level = getPerformanceLevel(benchmark.percentile);
              
              return (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{benchmark.metric}</CardTitle>
                      {getTrendIcon(benchmark.trend)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-2xl font-bold">
                      {benchmark.metric.includes('Rate') || benchmark.metric.includes('Growth') 
                        ? `${benchmark.your_score.toFixed(1)}%`
                        : benchmark.metric.includes('Value')
                        ? `$${benchmark.your_score.toFixed(2)}`
                        : benchmark.your_score.toFixed(1)
                      }
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Your Position</span>
                        <span className={level.color}>{benchmark.percentile.toFixed(0)}th percentile</span>
                      </div>
                      <Progress value={benchmark.percentile} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Industry Avg</p>
                        <p className="font-medium">
                          {benchmark.metric.includes('Rate') || benchmark.metric.includes('Growth') 
                            ? `${benchmark.industry_avg.toFixed(1)}%`
                            : benchmark.metric.includes('Value')
                            ? `$${benchmark.industry_avg.toFixed(2)}`
                            : benchmark.industry_avg.toFixed(1)
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Top 10%</p>
                        <p className="font-medium">
                          {benchmark.metric.includes('Rate') || benchmark.metric.includes('Growth') 
                            ? `${benchmark.top_performers.toFixed(1)}%`
                            : benchmark.metric.includes('Value')
                            ? `$${benchmark.top_performers.toFixed(2)}`
                            : benchmark.top_performers.toFixed(1)
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          {/* Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Radar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 100]} 
                      tick={false}
                    />
                    <Radar
                      name="Your Performance"
                      dataKey="percentile"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Metric</th>
                      <th className="text-right p-2">Your Score</th>
                      <th className="text-right p-2">Industry Avg</th>
                      <th className="text-right p-2">Top 10%</th>
                      <th className="text-right p-2">Percentile</th>
                    </tr>
                  </thead>
                  <tbody>
                    {benchmarkData.map((benchmark, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">{benchmark.metric}</td>
                        <td className="p-2 text-right font-medium">
                          {benchmark.metric.includes('Rate') || benchmark.metric.includes('Growth') 
                            ? `${benchmark.your_score.toFixed(1)}%`
                            : benchmark.metric.includes('Value')
                            ? `$${benchmark.your_score.toFixed(2)}`
                            : benchmark.your_score.toFixed(1)
                          }
                        </td>
                        <td className="p-2 text-right text-muted-foreground">
                          {benchmark.metric.includes('Rate') || benchmark.metric.includes('Growth') 
                            ? `${benchmark.industry_avg.toFixed(1)}%`
                            : benchmark.metric.includes('Value')
                            ? `$${benchmark.industry_avg.toFixed(2)}`
                            : benchmark.industry_avg.toFixed(1)
                          }
                        </td>
                        <td className="p-2 text-right text-muted-foreground">
                          {benchmark.metric.includes('Rate') || benchmark.metric.includes('Growth') 
                            ? `${benchmark.top_performers.toFixed(1)}%`
                            : benchmark.metric.includes('Value')
                            ? `$${benchmark.top_performers.toFixed(2)}`
                            : benchmark.top_performers.toFixed(1)
                          }
                        </td>
                        <td className="p-2 text-right">
                          <Badge variant={getPerformanceLevel(benchmark.percentile).level === 'Elite' ? 'default' : 'secondary'}>
                            {benchmark.percentile.toFixed(0)}th
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Star className="h-5 w-5" />
                  Your Strengths
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {benchmarkData
                  .filter(b => b.percentile >= 75)
                  .map((benchmark, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="font-medium">{benchmark.metric}</span>
                      <Badge className="bg-green-100 text-green-700">
                        {benchmark.percentile.toFixed(0)}th percentile
                      </Badge>
                    </div>
                  ))
                }
                {benchmarkData.filter(b => b.percentile >= 75).length === 0 && (
                  <p className="text-muted-foreground">Focus on improving your key metrics to identify strengths.</p>
                )}
              </CardContent>
            </Card>

            {/* Improvement Areas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <Target className="h-5 w-5" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {benchmarkData
                  .filter(b => b.percentile < 50)
                  .map((benchmark, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <span className="font-medium">{benchmark.metric}</span>
                      <Badge className="bg-orange-100 text-orange-700">
                        {benchmark.percentile.toFixed(0)}th percentile
                      </Badge>
                    </div>
                  ))
                }
                {benchmarkData.filter(b => b.percentile < 50).length === 0 && (
                  <p className="text-muted-foreground">Great job! All your metrics are performing well.</p>
                )}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Quick Wins</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Optimize menu pricing to increase average order value</li>
                      <li>• Implement loyalty program to boost retention</li>
                      <li>• Reduce order preparation time by 2-3 minutes</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Long-term Strategies</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Expand popular menu categories</li>
                      <li>• Invest in staff training for better service</li>
                      <li>• Implement quality control processes</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceBenchmarking;