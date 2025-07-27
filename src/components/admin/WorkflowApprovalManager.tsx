import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { AdminPermissionCheck } from './AdminPermissionCheck';
import { GitBranch, Users, Clock, CheckCircle, XCircle, AlertTriangle, Plus, Eye } from 'lucide-react';

interface ApprovalStep {
  id: string;
  name: string;
  approverRole: string;
  approverDepartment?: string;
  required: boolean;
  order: number;
  conditions?: string[];
}

interface ApprovalWorkflow {
  id: string;
  name: string;
  description: string;
  featureTypes: string[];
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  steps: ApprovalStep[];
  isParallel: boolean;
  active: boolean;
  createdAt: string;
}

interface PendingApproval {
  id: string;
  workflowId: string;
  featureName: string;
  requestedBy: string;
  requestedFor: string;
  currentStep: number;
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  approvalHistory: ApprovalAction[];
  createdAt: string;
  dueDate: string;
}

interface ApprovalAction {
  stepId: string;
  approver: string;
  action: 'approved' | 'rejected' | 'delegated';
  timestamp: string;
  comments?: string;
}

export const WorkflowApprovalManager: React.FC = () => {
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<ApprovalWorkflow | null>(null);
  const [showWorkflowEditor, setShowWorkflowEditor] = useState(false);
  const [showApprovalDetails, setShowApprovalDetails] = useState<PendingApproval | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = () => {
    const defaultWorkflows: ApprovalWorkflow[] = [
      {
        id: 'wf-1',
        name: 'High Impact Feature Access',
        description: 'Multi-level approval for features with high business impact',
        featureTypes: ['financial_management', 'user_administration', 'system_configuration'],
        impactLevel: 'high',
        isParallel: false,
        active: true,
        createdAt: '2024-01-15T10:00:00Z',
        steps: [
          {
            id: 'step-1',
            name: 'Department Manager Review',
            approverRole: 'department_manager',
            required: true,
            order: 1,
            conditions: ['business_justification_required']
          },
          {
            id: 'step-2',
            name: 'Security Team Approval',
            approverRole: 'security_officer',
            approverDepartment: 'security',
            required: true,
            order: 2,
            conditions: ['security_assessment_required']
          },
          {
            id: 'step-3',
            name: 'Executive Approval',
            approverRole: 'executive',
            required: true,
            order: 3,
            conditions: ['executive_sign_off']
          }
        ]
      },
      {
        id: 'wf-2',
        name: 'Standard Feature Request',
        description: 'Standard approval process for routine feature access',
        featureTypes: ['reporting', 'basic_tools', 'communication'],
        impactLevel: 'medium',
        isParallel: true,
        active: true,
        createdAt: '2024-01-15T10:00:00Z',
        steps: [
          {
            id: 'step-1',
            name: 'Direct Manager Approval',
            approverRole: 'manager',
            required: true,
            order: 1
          },
          {
            id: 'step-2',
            name: 'HR Compliance Check',
            approverRole: 'hr_representative',
            approverDepartment: 'human_resources',
            required: false,
            order: 1
          }
        ]
      }
    ];

    const defaultPendingApprovals: PendingApproval[] = [
      {
        id: 'pa-1',
        workflowId: 'wf-1',
        featureName: 'Financial Management Access',
        requestedBy: 'john.doe@company.com',
        requestedFor: 'jane.smith@company.com',
        currentStep: 1,
        status: 'pending',
        createdAt: '2024-01-20T09:00:00Z',
        dueDate: '2024-01-22T17:00:00Z',
        approvalHistory: []
      },
      {
        id: 'pa-2',
        workflowId: 'wf-2',
        featureName: 'Advanced Reporting Tools',
        requestedBy: 'manager@company.com',
        requestedFor: 'analyst@company.com',
        currentStep: 2,
        status: 'pending',
        createdAt: '2024-01-19T14:30:00Z',
        dueDate: '2024-01-21T17:00:00Z',
        approvalHistory: [
          {
            stepId: 'step-1',
            approver: 'manager@company.com',
            action: 'approved',
            timestamp: '2024-01-19T15:00:00Z',
            comments: 'Approved for business analytics needs'
          }
        ]
      }
    ];

    setWorkflows(defaultWorkflows);
    setPendingApprovals(defaultPendingApprovals);
  };

  const handleApprovalAction = async (approvalId: string, action: 'approve' | 'reject', comments?: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPendingApprovals(prev => prev.map(approval => {
        if (approval.id === approvalId) {
          const newHistory = [...approval.approvalHistory, {
            stepId: `step-${approval.currentStep}`,
            approver: 'current.user@company.com',
            action: action === 'approve' ? 'approved' as const : 'rejected' as const,
            timestamp: new Date().toISOString(),
            comments
          }];

          return {
            ...approval,
            status: action === 'approve' ? (approval.currentStep === 3 ? 'approved' : 'pending') : 'rejected',
            currentStep: action === 'approve' ? approval.currentStep + 1 : approval.currentStep,
            approvalHistory: newHistory
          };
        }
        return approval;
      }));

      toast.success(`Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
    } catch (error) {
      toast.error('Failed to process approval action');
    } finally {
      setIsLoading(false);
      setShowApprovalDetails(null);
    }
  };

  const createWorkflow = async (workflowData: Partial<ApprovalWorkflow>) => {
    setIsLoading(true);
    try {
      const newWorkflow: ApprovalWorkflow = {
        id: `wf-${Date.now()}`,
        name: workflowData.name || 'New Workflow',
        description: workflowData.description || '',
        featureTypes: workflowData.featureTypes || [],
        impactLevel: workflowData.impactLevel || 'medium',
        steps: workflowData.steps || [],
        isParallel: workflowData.isParallel || false,
        active: true,
        createdAt: new Date().toISOString()
      };

      setWorkflows(prev => [...prev, newWorkflow]);
      toast.success('Workflow created successfully');
      setShowWorkflowEditor(false);
    } catch (error) {
      toast.error('Failed to create workflow');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'approved': return 'bg-green-500/20 text-green-400';
      case 'rejected': return 'bg-red-500/20 text-red-400';
      case 'escalated': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'low': return 'bg-blue-500/20 text-blue-400';
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
            <h2 className="text-2xl font-bold text-foreground">Workflow Approval Manager</h2>
            <p className="text-muted-foreground">Manage multi-step approval workflows and pending requests</p>
          </div>
          <Dialog open={showWorkflowEditor} onOpenChange={setShowWorkflowEditor}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Workflow
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Approval Workflow</DialogTitle>
                <DialogDescription>Define a new multi-step approval process</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="workflow-name">Workflow Name</Label>
                    <Input id="workflow-name" placeholder="e.g., Executive Feature Access" />
                  </div>
                  <div>
                    <Label htmlFor="impact-level">Impact Level</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select impact level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Describe the workflow purpose and requirements" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowWorkflowEditor(false)}>Cancel</Button>
                <Button onClick={() => createWorkflow({ name: 'New Workflow' })}>Create Workflow</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
            <TabsTrigger value="workflows">Approval Workflows</TabsTrigger>
            <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            <div className="grid gap-4">
              {pendingApprovals.map((approval) => (
                <Card key={approval.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{approval.featureName}</h3>
                          <Badge className={getStatusColor(approval.status)}>
                            {approval.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Requested by {approval.requestedBy} for {approval.requestedFor}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Due: {new Date(approval.dueDate).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <GitBranch className="w-4 h-4" />
                            Step {approval.currentStep} of {workflows.find(w => w.id === approval.workflowId)?.steps.length || 0}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowApprovalDetails(approval)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        {approval.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprovalAction(approval.id, 'approve')}
                              disabled={isLoading}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleApprovalAction(approval.id, 'reject')}
                              disabled={isLoading}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="workflows" className="space-y-4">
            <div className="grid gap-4">
              {workflows.map((workflow) => (
                <Card key={workflow.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {workflow.name}
                          <Badge className={getImpactColor(workflow.impactLevel)}>
                            {workflow.impactLevel}
                          </Badge>
                          {workflow.active && (
                            <Badge variant="default">Active</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{workflow.description}</CardDescription>
                      </div>
                      <Button variant="outline" size="sm">
                        Edit Workflow
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Approval Steps ({workflow.isParallel ? 'Parallel' : 'Sequential'})</h4>
                        <div className="space-y-2">
                          {workflow.steps.map((step, index) => (
                            <div key={step.id} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{step.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Role: {step.approverRole}
                                  {step.approverDepartment && ` (${step.approverDepartment})`}
                                  {step.required && ' - Required'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Applicable Feature Types</h4>
                        <div className="flex flex-wrap gap-2">
                          {workflow.featureTypes.map((type) => (
                            <Badge key={type} variant="secondary">
                              {type.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Approval Audit Trail
                </CardTitle>
                <CardDescription>Complete history of approval actions and decisions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingApprovals.flatMap(approval => 
                    approval.approvalHistory.map((action, index) => (
                      <div key={`${approval.id}-${index}`} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{approval.featureName}</p>
                          <p className="text-sm text-muted-foreground">
                            {action.action} by {action.approver} on {new Date(action.timestamp).toLocaleString()}
                          </p>
                          {action.comments && (
                            <p className="text-sm text-muted-foreground mt-1">"{action.comments}"</p>
                          )}
                        </div>
                        <Badge className={action.action === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                          {action.action}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Approval Details Dialog */}
        {showApprovalDetails && (
          <Dialog open={!!showApprovalDetails} onOpenChange={() => setShowApprovalDetails(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Approval Request Details</DialogTitle>
                <DialogDescription>Review and process feature access request</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Feature Name</Label>
                    <p className="font-medium">{showApprovalDetails.featureName}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge className={getStatusColor(showApprovalDetails.status)}>
                      {showApprovalDetails.status}
                    </Badge>
                  </div>
                  <div>
                    <Label>Requested By</Label>
                    <p>{showApprovalDetails.requestedBy}</p>
                  </div>
                  <div>
                    <Label>Requested For</Label>
                    <p>{showApprovalDetails.requestedFor}</p>
                  </div>
                </div>
                {showApprovalDetails.approvalHistory.length > 0 && (
                  <div>
                    <Label>Approval History</Label>
                    <div className="space-y-2 mt-2">
                      {showApprovalDetails.approvalHistory.map((action, index) => (
                        <div key={index} className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{action.approver}</span>
                            <Badge className={action.action === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                              {action.action}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(action.timestamp).toLocaleString()}
                          </p>
                          {action.comments && (
                            <p className="text-sm mt-1">"{action.comments}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowApprovalDetails(null)}>
                  Close
                </Button>
                {showApprovalDetails.status === 'pending' && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => handleApprovalAction(showApprovalDetails.id, 'reject', 'Rejected via details view')}
                      disabled={isLoading}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleApprovalAction(showApprovalDetails.id, 'approve', 'Approved via details view')}
                      disabled={isLoading}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminPermissionCheck>
  );
};