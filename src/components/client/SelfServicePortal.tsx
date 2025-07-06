import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, BookOpen, Wrench, Lightbulb, Play,
  CheckCircle, HelpCircle, Video, FileText, Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface SelfHelpArticle {
  id: string;
  title: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number;
  steps: string[];
  videoUrl?: string;
  tools: string[];
  safety: string[];
  successRate: number;
  timesUsed: number;
}

interface CommonIssue {
  id: string;
  title: string;
  description: string;
  category: string;
  quickFix: string;
  preventionTips: string[];
  escalateIf: string[];
}

interface TroubleshootingResult {
  canSelfResolve: boolean;
  confidence: number;
  recommendedSteps: string[];
  estimatedTime: number;
  escalationReasons?: string[];
}

export const SelfServicePortal: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [articles, setArticles] = useState<SelfHelpArticle[]>([]);
  const [commonIssues, setCommonIssues] = useState<CommonIssue[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<SelfHelpArticle | null>(null);
  const [troubleshootingResult, setTroubleshootingResult] = useState<TroubleshootingResult | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadSelfHelpContent();
  }, []);

  const loadSelfHelpContent = async () => {
    // Mock self-help articles - in real implementation, these would come from a knowledge base
    const mockArticles: SelfHelpArticle[] = [
      {
        id: '1',
        title: 'Fix a Flickering Light Bulb',
        category: 'Electrical',
        difficulty: 'easy',
        estimatedTime: 5,
        steps: [
          'Turn off the light switch',
          'Wait for the bulb to cool down (2-3 minutes)',
          'Gently unscrew the bulb counterclockwise',
          'Check if the bulb is loose in the socket',
          'Screw the bulb back in firmly (but not too tight)',
          'Turn the light switch back on'
        ],
        tools: ['None required'],
        safety: ['Always turn off power first', 'Let bulb cool before handling'],
        successRate: 85,
        timesUsed: 247
      },
      {
        id: '2',
        title: 'Unclog a Slow Drain',
        category: 'Plumbing',
        difficulty: 'easy',
        estimatedTime: 10,
        steps: [
          'Remove visible debris from drain opening',
          'Pour hot water down the drain',
          'Mix 1/2 cup baking soda with 1/2 cup vinegar',
          'Pour mixture down drain and cover with drain plug',
          'Wait 15 minutes',
          'Flush with hot water',
          'Test drain flow'
        ],
        tools: ['Baking soda', 'Vinegar', 'Hot water', 'Drain plug'],
        safety: ['Avoid mixing chemicals', 'Use gloves when handling drain'],
        successRate: 78,
        timesUsed: 189
      },
      {
        id: '3',
        title: 'Reset a Tripped Circuit Breaker',
        category: 'Electrical',
        difficulty: 'medium',
        estimatedTime: 3,
        steps: [
          'Locate your electrical panel/breaker box',
          'Identify the tripped breaker (switch in middle position)',
          'Turn the breaker fully OFF first',
          'Then turn it fully ON',
          'Check if power is restored',
          'If it trips again, contact maintenance immediately'
        ],
        tools: ['Flashlight (if needed)'],
        safety: ['Never touch breakers with wet hands', 'Do not force switches'],
        successRate: 92,
        timesUsed: 156
      }
    ];

    const mockCommonIssues: CommonIssue[] = [
      {
        id: '1',
        title: 'Air Conditioning Not Cooling',
        description: 'Room temperature not decreasing despite AC running',
        category: 'HVAC',
        quickFix: 'Check and replace air filter if dirty, ensure vents are not blocked',
        preventionTips: [
          'Replace filters monthly',
          'Keep vents clear of furniture',
          'Schedule regular maintenance'
        ],
        escalateIf: [
          'No cold air after filter replacement',
          'Strange noises from unit',
          'Ice formation on unit'
        ]
      },
      {
        id: '2',
        title: 'WiFi Connection Issues',
        description: 'Internet connectivity problems or slow speeds',
        category: 'IT',
        quickFix: 'Unplug router for 30 seconds, then plug back in. Restart device.',
        preventionTips: [
          'Keep router in open area',
          'Update device drivers regularly',
          'Avoid interference from other devices'
        ],
        escalateIf: [
          'No improvement after router reset',
          'Multiple devices affected',
          'Complete signal loss'
        ]
      }
    ];

    setArticles(mockArticles);
    setCommonIssues(mockCommonIssues);
  };

  const analyzeTroubleshooting = async (query: string) => {
    setIsAnalyzing(true);
    try {
      // Mock AI analysis - in real implementation, this would use ML/NLP
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate analysis time

      const lowerQuery = query.toLowerCase();
      let result: TroubleshootingResult;

      if (lowerQuery.includes('light') || lowerQuery.includes('bulb')) {
        result = {
          canSelfResolve: true,
          confidence: 85,
          recommendedSteps: [
            'Check if bulb is properly screwed in',
            'Try replacing the bulb',
            'Check the light switch',
            'Verify circuit breaker is not tripped'
          ],
          estimatedTime: 10
        };
      } else if (lowerQuery.includes('drain') || lowerQuery.includes('clog')) {
        result = {
          canSelfResolve: true,
          confidence: 78,
          recommendedSteps: [
            'Remove visible debris',
            'Try hot water flush',
            'Use baking soda and vinegar method',
            'Check for hair or soap buildup'
          ],
          estimatedTime: 15
        };
      } else if (lowerQuery.includes('air') || lowerQuery.includes('cooling')) {
        result = {
          canSelfResolve: false,
          confidence: 35,
          recommendedSteps: [
            'Check air filter condition',
            'Ensure vents are not blocked',
            'Verify thermostat settings'
          ],
          estimatedTime: 5,
          escalationReasons: [
            'Requires professional HVAC expertise',
            'Potential refrigerant issues',
            'Complex system diagnostics needed'
          ]
        };
      } else {
        result = {
          canSelfResolve: false,
          confidence: 20,
          recommendedSteps: [
            'Document the issue with photos if safe',
            'Note when the problem started',
            'Identify any recent changes'
          ],
          estimatedTime: 5,
          escalationReasons: [
            'Issue requires professional assessment',
            'Safety concerns identified',
            'Specialized tools needed'
          ]
        };
      }

      setTroubleshootingResult(result);
    } catch (error) {
      console.error('Error analyzing troubleshooting:', error);
      toast.error('Failed to analyze issue');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const markStepComplete = () => {
    if (selectedArticle && currentStep < selectedArticle.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      toast.success('Congratulations! You\'ve completed all steps.');
      // In real implementation, track completion and update success rates
    }
  };

  const escalateToMaintenance = async () => {
    try {
      // Create maintenance request
      const { error } = await supabase
        .from('maintenance_requests')
        .insert({
          title: `Self-service escalation: ${searchQuery}`,
          description: `User attempted self-resolution but needs professional assistance. Troubleshooting attempted: ${troubleshootingResult?.recommendedSteps.join(', ')}`,
          location: 'To be specified',
          priority: 'medium',
          reported_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast.success('Request escalated to maintenance team');
      setTroubleshootingResult(null);
      setSearchQuery('');
    } catch (error) {
      console.error('Error escalating to maintenance:', error);
      toast.error('Failed to escalate request');
    }
  };

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 border-green-400';
      case 'medium': return 'text-yellow-400 border-yellow-400';
      case 'hard': return 'text-red-400 border-red-400';
      default: return 'text-blue-400 border-blue-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Wrench className="h-6 w-6 text-primary" />
            Self-Service Portal
          </h3>
          <p className="text-sm text-muted-foreground">
            Resolve common issues instantly with guided troubleshooting
          </p>
        </div>
        <Badge className="bg-green-500/20 text-green-400">
          {articles.length} Solutions Available
        </Badge>
      </div>

      {/* Smart Search and Analysis */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            AI-Powered Issue Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Describe your issue... (e.g., 'light flickering', 'drain slow')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={() => analyzeTroubleshooting(searchQuery)}
              disabled={!searchQuery.trim() || isAnalyzing}
            >
              {isAnalyzing ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Analyze
            </Button>
          </div>

          {troubleshootingResult && (
            <Alert className={`border-l-4 ${troubleshootingResult.canSelfResolve ? 'border-l-green-500' : 'border-l-orange-500'}`}>
              <AlertDescription>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-white">
                      {troubleshootingResult.canSelfResolve ? 'Self-Resolution Possible' : 'Professional Assistance Recommended'}
                    </h4>
                    <Badge className={troubleshootingResult.canSelfResolve ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}>
                      {troubleshootingResult.confidence}% Confidence
                    </Badge>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-white mb-2">Recommended Steps:</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {troubleshootingResult.recommendedSteps.map((step, idx) => (
                        <li key={idx}>• {step}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">
                      Estimated time: {troubleshootingResult.estimatedTime} minutes
                    </span>
                    <div className="flex gap-2">
                      {troubleshootingResult.canSelfResolve ? (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <Play className="h-4 w-4 mr-2" />
                          Start Guide
                        </Button>
                      ) : (
                        <Button size="sm" onClick={escalateToMaintenance} className="bg-orange-600 hover:bg-orange-700">
                          <Zap className="h-4 w-4 mr-2" />
                          Request Service
                        </Button>
                      )}
                    </div>
                  </div>

                  {troubleshootingResult.escalationReasons && (
                    <div className="mt-3 p-2 bg-background/20 rounded">
                      <h5 className="text-xs font-medium text-white mb-1">Why professional help is needed:</h5>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {troubleshootingResult.escalationReasons.map((reason, idx) => (
                          <li key={idx}>• {reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="guides" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-card/50">
          <TabsTrigger value="guides">Step-by-Step Guides</TabsTrigger>
          <TabsTrigger value="common">Common Issues</TabsTrigger>
          <TabsTrigger value="videos">Video Tutorials</TabsTrigger>
        </TabsList>

        <TabsContent value="guides" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredArticles.map((article) => (
              <Card key={article.id} className="bg-card/50 backdrop-blur cursor-pointer hover:bg-card/70 transition-colors" onClick={() => setSelectedArticle(article)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-white">{article.title}</h4>
                    <Badge variant="outline" className={getDifficultyColor(article.difficulty)}>
                      {article.difficulty}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>{article.category}</span>
                      <span>{article.estimatedTime} min</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Success Rate: {article.successRate}%</span>
                      <span>{article.timesUsed} uses</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {article.tools.slice(0, 2).map((tool, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tool}
                      </Badge>
                    ))}
                    {article.tools.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{article.tools.length - 2} more
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="common" className="space-y-4">
          {commonIssues.map((issue) => (
            <Card key={issue.id} className="bg-card/50 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-white mb-1">{issue.title}</h4>
                    <p className="text-sm text-muted-foreground">{issue.description}</p>
                  </div>
                  <Badge variant="outline">{issue.category}</Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <h5 className="text-sm font-medium text-white mb-1">Quick Fix:</h5>
                    <p className="text-sm text-muted-foreground">{issue.quickFix}</p>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-white mb-1">Prevention Tips:</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {issue.preventionTips.map((tip, idx) => (
                        <li key={idx}>• {tip}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-white mb-1">Contact Maintenance If:</h5>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {issue.escalateIf.map((condition, idx) => (
                        <li key={idx}>• {condition}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="videos" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {articles.filter(a => a.videoUrl).map((article) => (
              <Card key={article.id} className="bg-card/50 backdrop-blur">
                <CardContent className="p-4">
                  <div className="aspect-video bg-background/20 rounded-lg flex items-center justify-center mb-3">
                    <Video className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h4 className="font-medium text-white mb-2">{article.title}</h4>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{article.estimatedTime} min</span>
                    <Badge variant="outline" className={getDifficultyColor(article.difficulty)}>
                      {article.difficulty}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Step-by-Step Guide Modal */}
      {selectedArticle && (
        <Card className="bg-card/50 backdrop-blur border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {selectedArticle.title}
              </CardTitle>
              <Button variant="outline" onClick={() => setSelectedArticle(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <Badge variant="outline" className={getDifficultyColor(selectedArticle.difficulty)}>
                  {selectedArticle.difficulty}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Difficulty</p>
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-white">{selectedArticle.estimatedTime}m</span>
                <p className="text-xs text-muted-foreground">Estimated Time</p>
              </div>
              <div className="text-center">
                <span className="text-lg font-bold text-green-400">{selectedArticle.successRate}%</span>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h5 className="font-medium text-white mb-2">Tools Needed:</h5>
                <div className="flex flex-wrap gap-1">
                  {selectedArticle.tools.map((tool, idx) => (
                    <Badge key={idx} variant="secondary">{tool}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="font-medium text-white mb-2">Safety Notes:</h5>
                <ul className="text-sm text-orange-400 space-y-1">
                  {selectedArticle.safety.map((note, idx) => (
                    <li key={idx}>⚠️ {note}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h5 className="font-medium text-white mb-2">
                  Steps ({currentStep + 1} of {selectedArticle.steps.length}):
                </h5>
                <div className="space-y-2">
                  {selectedArticle.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg ${
                        idx === currentStep
                          ? 'bg-primary/20 border border-primary'
                          : idx < currentStep
                          ? 'bg-green-500/20 border border-green-500'
                          : 'bg-background/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx < currentStep
                            ? 'bg-green-500 text-white'
                            : idx === currentStep
                            ? 'bg-primary text-white'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {idx < currentStep ? <CheckCircle className="h-4 w-4" /> : idx + 1}
                        </div>
                        <span className={`text-sm ${
                          idx <= currentStep ? 'text-white' : 'text-muted-foreground'
                        }`}>
                          {step}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                >
                  Previous Step
                </Button>
                <Button
                  onClick={markStepComplete}
                  disabled={currentStep >= selectedArticle.steps.length - 1}
                >
                  {currentStep >= selectedArticle.steps.length - 1 ? 'Complete' : 'Next Step'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};