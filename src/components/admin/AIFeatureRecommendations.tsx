import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AdminPermissionCheck } from './AdminPermissionCheck';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  Target, 
  Zap, 
  Shield, 
  BarChart3,
  Lightbulb,
  Clock,
  Star
} from 'lucide-react';

interface FeatureRecommendation {
  id: string;
  featureName: string;
  targetUser: string;
  targetDepartment: string;
  recommendationType: 'access_grant' | 'feature_upgrade' | 'training_needed' | 'deprecation_warning';
  confidence: number;
  reasoning: string[];
  expectedBenefit: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  basedOn: string[];
  potentialRisk?: string;
  estimatedImpact: number;
  createdAt: string;
}

interface UsagePattern {
  userId: string;
  userName: string;
  department: string;
  role: string;
  featuresUsed: string[];
  usageFrequency: Record<string, number>;
  timePatterns: Record<string, number>;
  deviceTypes: string[];
  lastActive: string;
  productivityScore: number;
}

interface AnomalyDetection {
  id: string;
  type: 'unusual_access' | 'suspicious_pattern' | 'policy_violation' | 'security_risk';
  userId: string;
  userName: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: string;
  evidence: string[];
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
  automatedResponse?: string;
}

interface LearningModel {
  name: string;
  type: 'recommendation' | 'anomaly_detection' | 'optimization';
  accuracy: number;
  lastTrained: string;
  dataPoints: number;
  version: string;
  status: 'active' | 'training' | 'updating';
}

export const AIFeatureRecommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<FeatureRecommendation[]>([]);
  const [usagePatterns, setUsagePatterns] = useState<UsagePattern[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
  const [learningModels, setLearningModels] = useState<LearningModel[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [aiEnabled, setAiEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    initializeData();
    if (aiEnabled) {
      startAIAnalysis();
    }
  }, [aiEnabled]);

  const initializeData = () => {
    const defaultRecommendations: FeatureRecommendation[] = [
      {
        id: 'rec-1',
        featureName: 'Advanced Analytics',
        targetUser: 'john.analyst@company.com',
        targetDepartment: 'Sales',
        recommendationType: 'access_grant',
        confidence: 92,
        reasoning: [
          'User frequently exports basic reports',
          'Department colleagues already use advanced features',
          'Usage pattern suggests readiness for complex analytics'
        ],
        expectedBenefit: 'Estimated 30% improvement in report generation efficiency',
        urgency: 'medium',
        basedOn: ['usage_frequency', 'peer_comparison', 'role_analysis'],
        estimatedImpact: 85,
        createdAt: '2024-01-20T10:00:00Z'
      },
      {
        id: 'rec-2',
        featureName: 'Financial Management',
        targetUser: 'manager@company.com',
        targetDepartment: 'Finance',
        recommendationType: 'training_needed',
        confidence: 78,
        reasoning: [
          'User has access but low utilization rate',
          'Feature usage below department average',
          'Previous training completion rate high'
        ],
        expectedBenefit: 'Improved compliance and efficiency in financial processes',
        urgency: 'high',
        basedOn: ['low_utilization', 'training_history', 'compliance_needs'],
        estimatedImpact: 70,
        createdAt: '2024-01-20T11:30:00Z'
      },
      {
        id: 'rec-3',
        featureName: 'Legacy Report Builder',
        targetUser: 'all_users',
        targetDepartment: 'All',
        recommendationType: 'deprecation_warning',
        confidence: 95,
        reasoning: [
          'Feature scheduled for deprecation',
          'Modern alternative available',
          'Security vulnerabilities identified'
        ],
        expectedBenefit: 'Migration to secure, modern reporting tools',
        urgency: 'critical',
        basedOn: ['deprecation_schedule', 'security_assessment', 'alternative_availability'],
        potentialRisk: 'Business continuity risk if not migrated',
        estimatedImpact: 90,
        createdAt: '2024-01-20T09:00:00Z'
      }
    ];

    const defaultUsagePatterns: UsagePattern[] = [
      {
        userId: 'u-1',
        userName: 'John Analyst',
        department: 'Sales',
        role: 'Senior Analyst',
        featuresUsed: ['basic_reporting', 'data_export', 'dashboard_view'],
        usageFrequency: {
          'basic_reporting': 45,
          'data_export': 30,
          'dashboard_view': 20
        },
        timePatterns: {
          'morning': 60,
          'afternoon': 30,
          'evening': 10
        },
        deviceTypes: ['desktop', 'mobile'],
        lastActive: '2024-01-20T16:30:00Z',
        productivityScore: 85
      },
      {
        userId: 'u-2',
        userName: 'Finance Manager',
        department: 'Finance',
        role: 'Department Manager',
        featuresUsed: ['financial_management', 'approval_workflows', 'compliance_tools'],
        usageFrequency: {
          'financial_management': 15,
          'approval_workflows': 25,
          'compliance_tools': 5
        },
        timePatterns: {
          'morning': 40,
          'afternoon': 50,
          'evening': 10
        },
        deviceTypes: ['desktop'],
        lastActive: '2024-01-20T17:45:00Z',
        productivityScore: 65
      }
    ];

    const defaultAnomalies: AnomalyDetection[] = [
      {
        id: 'anom-1',
        type: 'unusual_access',
        userId: 'u-3',
        userName: 'External Contractor',
        description: 'Access to sensitive features outside normal business hours',
        severity: 'high',
        detectedAt: '2024-01-20T02:15:00Z',
        evidence: [
          'Login at 2:15 AM on weekend',
          'Accessed financial data for first time',
          'Multiple failed authentication attempts'
        ],
        status: 'investigating',
        automatedResponse: 'Temporary access suspension applied'
      },
      {
        id: 'anom-2',
        type: 'suspicious_pattern',
        userId: 'u-4',
        userName: 'Data Analyst',
        description: 'Unusual data export volume detected',
        severity: 'medium',
        detectedAt: '2024-01-20T14:30:00Z',
        evidence: [
          'Exported 10x normal data volume',
          'Multiple different data types accessed',
          'Pattern differs from historical behavior'
        ],
        status: 'active'
      }
    ];

    const defaultLearningModels: LearningModel[] = [
      {
        name: 'Feature Recommendation Engine',
        type: 'recommendation',
        accuracy: 87.5,
        lastTrained: '2024-01-19T00:00:00Z',
        dataPoints: 50000,
        version: 'v2.1.3',
        status: 'active'
      },
      {
        name: 'Anomaly Detection Model',
        type: 'anomaly_detection',
        accuracy: 94.2,
        lastTrained: '2024-01-18T00:00:00Z',
        dataPoints: 25000,
        version: 'v1.8.7',
        status: 'active'
      },
      {
        name: 'Usage Optimization Engine',
        type: 'optimization',
        accuracy: 82.1,
        lastTrained: '2024-01-20T00:00:00Z',
        dataPoints: 75000,
        version: 'v3.0.1',
        status: 'training'
      }
    ];

    setRecommendations(defaultRecommendations);
    setUsagePatterns(defaultUsagePatterns);
    setAnomalies(defaultAnomalies);
    setLearningModels(defaultLearningModels);
  };

  const startAIAnalysis = async () => {
    setIsLoading(true);
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('AI analysis completed - new recommendations generated');
    } catch (error) {
      toast.error('AI analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecommendationAction = async (recommendationId: string, action: 'approve' | 'reject' | 'defer') => {
    try {
      setRecommendations(prev => prev.filter(rec => rec.id !== recommendationId));
      toast.success(`Recommendation ${action}ed successfully`);
    } catch (error) {
      toast.error('Failed to process recommendation');
    }
  };

  const handleAnomalyAction = async (anomalyId: string, action: 'investigate' | 'resolve' | 'false_positive') => {
    try {
      setAnomalies(prev => prev.map(anom => 
        anom.id === anomalyId 
          ? { ...anom, status: action === 'investigate' ? 'investigating' : action as any }
          : anom
      ));
      toast.success(`Anomaly marked as ${action.replace('_', ' ')}`);
    } catch (error) {
      toast.error('Failed to update anomaly status');
    }
  };

  const retrainModel = async (modelName: string) => {
    setIsLoading(true);
    try {
      setLearningModels(prev => prev.map(model => 
        model.name === modelName 
          ? { ...model, status: 'training' as const }
          : model
      ));
      
      // Simulate training
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setLearningModels(prev => prev.map(model => 
        model.name === modelName 
          ? { 
              ...model, 
              status: 'active' as const,
              accuracy: Math.min(100, model.accuracy + Math.random() * 5),
              lastTrained: new Date().toISOString()
            }
          : model
      ));
      
      toast.success(`${modelName} retrained successfully`);
    } catch (error) {
      toast.error('Failed to retrain model');
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'access_grant': return <Target className="w-4 h-4" />;
      case 'feature_upgrade': return <TrendingUp className="w-4 h-4" />;
      case 'training_needed': return <Lightbulb className="w-4 h-4" />;
      case 'deprecation_warning': return <AlertTriangle className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'low': return 'bg-blue-500/20 text-blue-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'high': return 'bg-orange-500/20 text-orange-400';
      case 'critical': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-500/20 text-green-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'high': return 'bg-orange-500/20 text-orange-400';
      case 'critical': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <AdminPermissionCheck>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Brain className="w-6 h-6" />
              AI Feature Management
            </h2>
            <p className="text-muted-foreground">Intelligent recommendations and anomaly detection</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="ai-enabled"
                checked={aiEnabled}
                onCheckedChange={setAiEnabled}
              />
              <Label htmlFor="ai-enabled">AI Analysis Enabled</Label>
            </div>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="hr">Human Resources</SelectItem>
                <SelectItem value="it">IT</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="recommendations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="recommendations">Smart Recommendations</TabsTrigger>
            <TabsTrigger value="patterns">Usage Patterns</TabsTrigger>
            <TabsTrigger value="anomalies">Anomaly Detection</TabsTrigger>
            <TabsTrigger value="models">AI Models</TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="space-y-4">
            <div className="grid gap-4">
              {recommendations.map((rec) => (
                <Card key={rec.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2">
                          {getRecommendationIcon(rec.recommendationType)}
                          <h3 className="font-semibold">{rec.featureName}</h3>
                          <Badge className={getUrgencyColor(rec.urgency)}>
                            {rec.urgency} urgency
                          </Badge>
                          <Badge variant="secondary">
                            {rec.confidence}% confidence
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {rec.targetUser} • {rec.targetDepartment} Department
                        </p>
                        <div className="space-y-2">
                          <p className="text-sm"><strong>Expected Benefit:</strong> {rec.expectedBenefit}</p>
                          <div>
                            <p className="text-sm font-medium mb-1">AI Reasoning:</p>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {rec.reasoning.map((reason, index) => (
                                <li key={index} className="flex items-center gap-2">
                                  <div className="w-1 h-1 bg-current rounded-full" />
                                  {reason}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <BarChart3 className="w-4 h-4" />
                              <span className="text-sm">Impact Score: {rec.estimatedImpact}/100</span>
                            </div>
                            <Progress value={rec.estimatedImpact} className="w-24 h-2" />
                          </div>
                        </div>
                        {rec.potentialRisk && (
                          <div className="flex items-center gap-2 p-3 bg-red-500/10 rounded-lg">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            <span className="text-sm text-red-400">{rec.potentialRisk}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleRecommendationAction(rec.id, 'approve')}
                        >
                          Apply
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRecommendationAction(rec.id, 'defer')}
                        >
                          Defer
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRecommendationAction(rec.id, 'reject')}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4">
            <div className="grid gap-4">
              {usagePatterns.map((pattern) => (
                <Card key={pattern.userId}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <h3 className="font-semibold">{pattern.userName}</h3>
                          <Badge variant="secondary">{pattern.role}</Badge>
                          <Badge variant="outline">{pattern.department}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium mb-2">Feature Usage (weekly)</p>
                            <div className="space-y-1">
                              {Object.entries(pattern.usageFrequency).map(([feature, count]) => (
                                <div key={feature} className="flex justify-between text-sm">
                                  <span>{feature.replace('_', ' ')}</span>
                                  <span className="font-medium">{count} times</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-2">Activity Patterns</p>
                            <div className="space-y-1">
                              {Object.entries(pattern.timePatterns).map(([time, percentage]) => (
                                <div key={time} className="flex justify-between text-sm">
                                  <span>{time}</span>
                                  <span className="font-medium">{percentage}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-sm">Productivity Score</span>
                        </div>
                        <div className="text-2xl font-bold">{pattern.productivityScore}/100</div>
                        <Progress value={pattern.productivityScore} className="w-24" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="anomalies" className="space-y-4">
            <div className="grid gap-4">
              {anomalies.map((anomaly) => (
                <Card key={anomaly.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          <h3 className="font-semibold">{anomaly.description}</h3>
                          <Badge className={getSeverityColor(anomaly.severity)}>
                            {anomaly.severity}
                          </Badge>
                          <Badge variant="outline">
                            {anomaly.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          User: {anomaly.userName} • Detected: {new Date(anomaly.detectedAt).toLocaleString()}
                        </p>
                        <div>
                          <p className="text-sm font-medium mb-2">Evidence:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {anomaly.evidence.map((evidence, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-current rounded-full" />
                                {evidence}
                              </li>
                            ))}
                          </ul>
                        </div>
                        {anomaly.automatedResponse && (
                          <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-lg">
                            <Zap className="w-4 h-4 text-blue-400" />
                            <span className="text-sm text-blue-400">
                              Automated Response: {anomaly.automatedResponse}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        {anomaly.status === 'active' && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleAnomalyAction(anomaly.id, 'investigate')}
                            >
                              Investigate
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAnomalyAction(anomaly.id, 'false_positive')}
                            >
                              False Positive
                            </Button>
                          </>
                        )}
                        {anomaly.status === 'investigating' && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleAnomalyAction(anomaly.id, 'resolve')}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="models" className="space-y-4">
            <div className="grid gap-4">
              {learningModels.map((model) => (
                <Card key={model.name}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Brain className="w-5 h-5" />
                          {model.name}
                          <Badge variant={model.status === 'active' ? 'default' : 'secondary'}>
                            {model.status}
                          </Badge>
                        </CardTitle>
                        <CardDescription>{model.type.replace('_', ' ')} model</CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => retrainModel(model.name)}
                        disabled={model.status === 'training' || isLoading}
                      >
                        {model.status === 'training' ? 'Training...' : 'Retrain Model'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Accuracy:</span>
                          <span className="font-medium">{model.accuracy.toFixed(1)}%</span>
                        </div>
                        <Progress value={model.accuracy} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Data Points:</span>
                          <span className="font-medium">{model.dataPoints.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Version:</span>
                          <span className="font-medium">{model.version}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Last Trained:</span>
                          <span className="font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(model.lastTrained).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminPermissionCheck>
  );
};