import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Award, 
  TrendingUp, 
  Target, 
  Clock, 
  CheckCircle, 
  BarChart3,
  Star,
  Calendar,
  Users
} from 'lucide-react';

const StaffPerformancePage = () => {
  const [performanceData] = useState({
    overallScore: 92,
    efficiency: 94,
    quality: 89,
    reliability: 96,
    customerSatisfaction: 88,
    tasksCompleted: 147,
    avgResponseTime: 2.1,
    slaCompliance: 98.5
  });

  const [achievements] = useState([
    {
      title: 'Perfect Week',
      description: 'Completed all tasks without SLA breach',
      date: '2024-01-15',
      type: 'quality',
      icon: Star
    },
    {
      title: 'Speed Demon',
      description: 'Fastest response time this month',
      date: '2024-01-10',
      type: 'efficiency',
      icon: Clock
    },
    {
      title: 'Customer Champion',
      description: 'Received 5-star customer feedback',
      date: '2024-01-08',
      type: 'satisfaction',
      icon: Award
    }
  ]);

  const [monthlyMetrics] = useState([
    { month: 'Jan', score: 92, tasks: 147 },
    { month: 'Feb', score: 89, tasks: 134 },
    { month: 'Mar', score: 94, tasks: 156 },
    { month: 'Apr', score: 91, tasks: 142 },
    { month: 'May', score: 96, tasks: 168 },
    { month: 'Jun', score: 93, tasks: 151 }
  ]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getAchievementColor = (type: string) => {
    switch (type) {
      case 'quality': return 'bg-blue-500';
      case 'efficiency': return 'bg-green-500';
      case 'satisfaction': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Award className="h-8 w-8 text-primary" />
            Performance Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track your performance metrics and achievements
          </p>
        </div>
        <Badge variant="outline" className="text-primary border-primary">
          Current Month: {monthlyMetrics[monthlyMetrics.length - 1].score}% Score
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-card/50">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Metrics
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card className="bg-card/50 backdrop-blur">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">{performanceData.overallScore}%</div>
                <div className="text-sm text-muted-foreground">Overall Score</div>
                <Progress value={performanceData.overallScore} className="mt-2" />
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">{performanceData.tasksCompleted}</div>
                <div className="text-sm text-muted-foreground">Tasks Completed</div>
                <div className="text-xs text-green-400 mt-1">+12% from last month</div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">{performanceData.avgResponseTime}h</div>
                <div className="text-sm text-muted-foreground">Avg Response Time</div>
                <div className="text-xs text-blue-400 mt-1">15% faster than target</div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">{performanceData.slaCompliance}%</div>
                <div className="text-sm text-muted-foreground">SLA Compliance</div>
                <div className="text-xs text-purple-400 mt-1">Above target</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Performance Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Efficiency</span>
                    <span className={getScoreColor(performanceData.efficiency)}>{performanceData.efficiency}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getScoreBg(performanceData.efficiency)}`}
                      style={{ width: `${performanceData.efficiency}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Quality</span>
                    <span className={getScoreColor(performanceData.quality)}>{performanceData.quality}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getScoreBg(performanceData.quality)}`}
                      style={{ width: `${performanceData.quality}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Reliability</span>
                    <span className={getScoreColor(performanceData.reliability)}>{performanceData.reliability}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getScoreBg(performanceData.reliability)}`}
                      style={{ width: `${performanceData.reliability}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Customer Satisfaction</span>
                    <span className={getScoreColor(performanceData.customerSatisfaction)}>{performanceData.customerSatisfaction}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getScoreBg(performanceData.customerSatisfaction)}`}
                      style={{ width: `${performanceData.customerSatisfaction}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Recent Achievements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {achievements.slice(0, 3).map((achievement, index) => {
                  const IconComponent = achievement.icon;
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 bg-card/30 rounded-lg">
                      <div className={`p-2 rounded-full ${getAchievementColor(achievement.type)}`}>
                        <IconComponent className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">{achievement.title}</div>
                        <div className="text-sm text-muted-foreground">{achievement.description}</div>
                        <div className="text-xs text-muted-foreground">{achievement.date}</div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metrics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Task Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <div className="text-2xl font-bold text-white">147</div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <div className="text-2xl font-bold text-white">3</div>
                    <div className="text-sm text-muted-foreground">Pending</div>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">144</div>
                    <div className="text-sm text-muted-foreground">On Time</div>
                  </div>
                  <div className="p-4 bg-red-500/10 rounded-lg">
                    <div className="text-2xl font-bold text-red-400">3</div>
                    <div className="text-sm text-muted-foreground">Late</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Response Time Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Response</span>
                    <span className="text-sm font-medium text-white">2.1 hours</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Fastest Response</span>
                    <span className="text-sm font-medium text-green-400">15 minutes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Target Time</span>
                    <span className="text-sm font-medium text-blue-400">4 hours</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Improvement</span>
                    <span className="text-sm font-medium text-purple-400">-30 minutes</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements">
          <div className="grid gap-4">
            {achievements.map((achievement, index) => {
              const IconComponent = achievement.icon;
              return (
                <Card key={index} className="bg-card/50 backdrop-blur">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${getAchievementColor(achievement.type)}`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{achievement.title}</h3>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{achievement.date}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {achievement.type}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="trends">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-6 gap-4">
                  {monthlyMetrics.map((metric, index) => (
                    <div key={index} className="text-center">
                      <div className="p-4 bg-card/30 rounded-lg mb-2">
                        <div className={`text-lg font-bold ${getScoreColor(metric.score)}`}>
                          {metric.score}%
                        </div>
                        <div className="text-xs text-muted-foreground">{metric.tasks} tasks</div>
                      </div>
                      <div className="text-sm text-muted-foreground">{metric.month}</div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-border pt-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-400">+8%</div>
                      <div className="text-sm text-muted-foreground">Performance Improvement</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-400">+23</div>
                      <div className="text-sm text-muted-foreground">More Tasks Completed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-400">-15min</div>
                      <div className="text-sm text-muted-foreground">Faster Response Time</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StaffPerformancePage;