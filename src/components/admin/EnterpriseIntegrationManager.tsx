import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { AdminPermissionCheck } from './AdminPermissionCheck';
import { 
  Building2, 
  Key, 
  Users, 
  Database, 
  Cloud, 
  Shield, 
  Webhook, 
  GitBranch,
  Monitor,
  Settings,
  CheckCircle,
  AlertTriangle,
  Plus,
  RefreshCw,
  Download
} from 'lucide-react';

interface SSOProvider {
  id: string;
  name: string;
  type: 'saml' | 'oauth' | 'ldap' | 'openid';
  status: 'active' | 'inactive' | 'testing' | 'error';
  configuration: Record<string, any>;
  userCount: number;
  lastSync: string;
  healthCheck: 'healthy' | 'warning' | 'error';
}

interface TenantConfiguration {
  id: string;
  name: string;
  domain: string;
  userLimit: number;
  currentUsers: number;
  features: string[];
  customization: {
    logo?: string;
    theme: string;
    branding: Record<string, string>;
  };
  status: 'active' | 'suspended' | 'trial';
  createdAt: string;
  expiresAt?: string;
}

interface BackupConfiguration {
  id: string;
  name: string;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  retentionDays: number;
  includedData: string[];
  storageLocation: string;
  encrypted: boolean;
  lastBackup: string;
  nextBackup: string;
  status: 'active' | 'paused' | 'error';
  size: string;
}

interface IntegrationEndpoint {
  id: string;
  name: string;
  type: 'webhook' | 'api' | 'sync';
  url: string;
  method: string;
  authentication: 'none' | 'bearer' | 'basic' | 'oauth';
  enabled: boolean;
  lastUsed: string;
  requestCount: number;
  errorRate: number;
  avgResponseTime: number;
}

export const EnterpriseIntegrationManager: React.FC = () => {
  const [ssoProviders, setSsoProviders] = useState<SSOProvider[]>([]);
  const [tenants, setTenants] = useState<TenantConfiguration[]>([]);
  const [backups, setBackups] = useState<BackupConfiguration[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationEndpoint[]>([]);
  const [showSSODialog, setShowSSODialog] = useState(false);
  const [showTenantDialog, setShowTenantDialog] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = () => {
    const defaultSSOProviders: SSOProvider[] = [
      {
        id: 'sso-1',
        name: 'Azure Active Directory',
        type: 'saml',
        status: 'active',
        configuration: {
          entityId: 'urn:example:company',
          ssoUrl: 'https://login.microsoftonline.com/tenant/saml2',
          certificate: '-----BEGIN CERTIFICATE-----...'
        },
        userCount: 1250,
        lastSync: '2024-01-20T18:00:00Z',
        healthCheck: 'healthy'
      },
      {
        id: 'sso-2',
        name: 'Google Workspace',
        type: 'oauth',
        status: 'active',
        configuration: {
          clientId: 'google-client-id',
          clientSecret: 'google-client-secret',
          domain: 'company.com'
        },
        userCount: 450,
        lastSync: '2024-01-20T17:30:00Z',
        healthCheck: 'healthy'
      },
      {
        id: 'sso-3',
        name: 'Internal LDAP',
        type: 'ldap',
        status: 'testing',
        configuration: {
          host: 'ldap.company.local',
          port: 389,
          baseDN: 'dc=company,dc=local'
        },
        userCount: 0,
        lastSync: '2024-01-20T16:00:00Z',
        healthCheck: 'warning'
      }
    ];

    const defaultTenants: TenantConfiguration[] = [
      {
        id: 'tenant-1',
        name: 'Main Organization',
        domain: 'company.com',
        userLimit: 2000,
        currentUsers: 1750,
        features: ['all_features'],
        customization: {
          theme: 'corporate',
          branding: {
            primaryColor: '#1a73e8',
            logo: '/company-logo.png'
          }
        },
        status: 'active',
        createdAt: '2023-01-01T00:00:00Z'
      },
      {
        id: 'tenant-2',
        name: 'Partner Organization',
        domain: 'partner.company.com',
        userLimit: 500,
        currentUsers: 320,
        features: ['basic_features', 'reporting'],
        customization: {
          theme: 'partner',
          branding: {
            primaryColor: '#34a853',
            logo: '/partner-logo.png'
          }
        },
        status: 'active',
        createdAt: '2023-06-15T00:00:00Z'
      },
      {
        id: 'tenant-3',
        name: 'Trial Customer',
        domain: 'trial.example.com',
        userLimit: 50,
        currentUsers: 25,
        features: ['basic_features'],
        customization: {
          theme: 'trial',
          branding: {
            primaryColor: '#ea4335'
          }
        },
        status: 'trial',
        createdAt: '2024-01-15T00:00:00Z',
        expiresAt: '2024-02-15T00:00:00Z'
      }
    ];

    const defaultBackups: BackupConfiguration[] = [
      {
        id: 'backup-1',
        name: 'Full System Backup',
        frequency: 'daily',
        retentionDays: 30,
        includedData: ['user_data', 'configurations', 'audit_logs', 'feature_settings'],
        storageLocation: 'AWS S3 - us-east-1',
        encrypted: true,
        lastBackup: '2024-01-20T02:00:00Z',
        nextBackup: '2024-01-21T02:00:00Z',
        status: 'active',
        size: '2.3 GB'
      },
      {
        id: 'backup-2',
        name: 'Configuration Snapshot',
        frequency: 'hourly',
        retentionDays: 7,
        includedData: ['configurations', 'feature_settings'],
        storageLocation: 'Local Storage',
        encrypted: true,
        lastBackup: '2024-01-20T17:00:00Z',
        nextBackup: '2024-01-20T18:00:00Z',
        status: 'active',
        size: '125 MB'
      }
    ];

    const defaultIntegrations: IntegrationEndpoint[] = [
      {
        id: 'int-1',
        name: 'HR System Sync',
        type: 'webhook',
        url: 'https://hr.company.com/api/webhooks/users',
        method: 'POST',
        authentication: 'bearer',
        enabled: true,
        lastUsed: '2024-01-20T16:45:00Z',
        requestCount: 1250,
        errorRate: 0.5,
        avgResponseTime: 145
      },
      {
        id: 'int-2',
        name: 'Compliance Reporting',
        type: 'api',
        url: 'https://compliance.company.com/api/v1/reports',
        method: 'GET',
        authentication: 'oauth',
        enabled: true,
        lastUsed: '2024-01-20T15:30:00Z',
        requestCount: 892,
        errorRate: 1.2,
        avgResponseTime: 320
      }
    ];

    setSsoProviders(defaultSSOProviders);
    setTenants(defaultTenants);
    setBackups(defaultBackups);
    setIntegrations(defaultIntegrations);
  };

  const testSSOConnection = async (providerId: string) => {
    setIsLoading(true);
    try {
      // Simulate SSO test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSsoProviders(prev => prev.map(provider => 
        provider.id === providerId 
          ? { ...provider, healthCheck: 'healthy' as const, lastSync: new Date().toISOString() }
          : provider
      ));
      
      toast.success('SSO connection test successful');
    } catch (error) {
      toast.error('SSO connection test failed');
    } finally {
      setIsLoading(false);
    }
  };

  const runBackup = async (backupId: string) => {
    setIsLoading(true);
    try {
      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setBackups(prev => prev.map(backup => 
        backup.id === backupId 
          ? { 
              ...backup, 
              lastBackup: new Date().toISOString(),
              nextBackup: new Date(Date.now() + getFrequencyMs(backup.frequency)).toISOString()
            }
          : backup
      ));
      
      toast.success('Backup completed successfully');
    } catch (error) {
      toast.error('Backup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getFrequencyMs = (frequency: string) => {
    switch (frequency) {
      case 'hourly': return 60 * 60 * 1000;
      case 'daily': return 24 * 60 * 60 * 1000;
      case 'weekly': return 7 * 24 * 60 * 60 * 1000;
      case 'monthly': return 30 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'healthy': return 'bg-green-500/20 text-green-400';
      case 'inactive': case 'paused': return 'bg-gray-500/20 text-gray-400';
      case 'testing': case 'trial': case 'warning': return 'bg-yellow-500/20 text-yellow-400';
      case 'error': case 'suspended': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <AdminPermissionCheck>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              Enterprise Integration
            </h2>
            <p className="text-muted-foreground">Manage SSO, multi-tenancy, backups, and integrations</p>
          </div>
        </div>

        <Tabs defaultValue="sso" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sso">SSO Providers</TabsTrigger>
            <TabsTrigger value="tenants">Multi-Tenancy</TabsTrigger>
            <TabsTrigger value="backups">Backup & Recovery</TabsTrigger>
            <TabsTrigger value="integrations">External APIs</TabsTrigger>
          </TabsList>

          <TabsContent value="sso" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Single Sign-On Providers</h3>
              <Dialog open={showSSODialog} onOpenChange={setShowSSODialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add SSO Provider
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add SSO Provider</DialogTitle>
                    <DialogDescription>Configure a new single sign-on integration</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="sso-name">Provider Name</Label>
                      <Input id="sso-name" placeholder="e.g., Company Active Directory" />
                    </div>
                    <div>
                      <Label htmlFor="sso-type">Provider Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select SSO type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="saml">SAML 2.0</SelectItem>
                          <SelectItem value="oauth">OAuth 2.0</SelectItem>
                          <SelectItem value="openid">OpenID Connect</SelectItem>
                          <SelectItem value="ldap">LDAP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowSSODialog(false)}>Cancel</Button>
                    <Button>Add Provider</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {ssoProviders.map((provider) => (
                <Card key={provider.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Key className="w-4 h-4" />
                          <h3 className="font-semibold">{provider.name}</h3>
                          <Badge className={getStatusColor(provider.status)}>
                            {provider.status}
                          </Badge>
                          <Badge className={getStatusColor(provider.healthCheck)}>
                            {provider.healthCheck}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Type: {provider.type.toUpperCase()} • Users: {provider.userCount.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Last sync: {new Date(provider.lastSync).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testSSOConnection(provider.id)}
                          disabled={isLoading}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Test Connection
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="tenants" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Tenant Organizations</h3>
              <Dialog open={showTenantDialog} onOpenChange={setShowTenantDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Tenant
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Tenant Organization</DialogTitle>
                    <DialogDescription>Create a new isolated tenant environment</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="tenant-name">Organization Name</Label>
                      <Input id="tenant-name" placeholder="e.g., Partner Company" />
                    </div>
                    <div>
                      <Label htmlFor="tenant-domain">Domain</Label>
                      <Input id="tenant-domain" placeholder="e.g., partner.company.com" />
                    </div>
                    <div>
                      <Label htmlFor="user-limit">User Limit</Label>
                      <Input id="user-limit" type="number" placeholder="100" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowTenantDialog(false)}>Cancel</Button>
                    <Button>Create Tenant</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {tenants.map((tenant) => (
                <Card key={tenant.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <h3 className="font-semibold">{tenant.name}</h3>
                          <Badge className={getStatusColor(tenant.status)}>
                            {tenant.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Domain: {tenant.domain}
                        </p>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">Users:</span>
                            <Progress 
                              value={(tenant.currentUsers / tenant.userLimit) * 100} 
                              className="w-24 h-2" 
                            />
                            <span className="text-sm">{tenant.currentUsers}/{tenant.userLimit}</span>
                          </div>
                          {tenant.expiresAt && (
                            <div className="text-sm text-muted-foreground">
                              Expires: {new Date(tenant.expiresAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {tenant.features.map((feature) => (
                            <Badge key={feature} variant="secondary" className="text-xs">
                              {feature.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Monitor className="w-4 h-4 mr-2" />
                          Manage
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="backups" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Backup Configurations</h3>
              <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Backup
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Backup Configuration</DialogTitle>
                    <DialogDescription>Set up automated backup schedule</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="backup-name">Backup Name</Label>
                      <Input id="backup-name" placeholder="e.g., Weekly Config Backup" />
                    </div>
                    <div>
                      <Label htmlFor="backup-frequency">Frequency</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowBackupDialog(false)}>Cancel</Button>
                    <Button>Create Backup</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {backups.map((backup) => (
                <Card key={backup.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4" />
                          <h3 className="font-semibold">{backup.name}</h3>
                          <Badge className={getStatusColor(backup.status)}>
                            {backup.status}
                          </Badge>
                          {backup.encrypted && (
                            <Badge variant="secondary">
                              <Shield className="w-3 h-3 mr-1" />
                              Encrypted
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Frequency: {backup.frequency} • Retention: {backup.retentionDays} days • Size: {backup.size}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Last: {new Date(backup.lastBackup).toLocaleString()} • 
                          Next: {new Date(backup.nextBackup).toLocaleString()}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {backup.includedData.map((data) => (
                            <Badge key={data} variant="outline" className="text-xs">
                              {data.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => runBackup(backup.id)}
                          disabled={isLoading}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Run Now
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">External API Integrations</h3>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Integration
              </Button>
            </div>

            <div className="grid gap-4">
              {integrations.map((integration) => (
                <Card key={integration.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Webhook className="w-4 h-4" />
                          <h3 className="font-semibold">{integration.name}</h3>
                          <Badge variant={integration.enabled ? 'default' : 'secondary'}>
                            {integration.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                          <Badge variant="outline">{integration.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground font-mono">
                          {integration.method} {integration.url}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Requests: {integration.requestCount.toLocaleString()}</span>
                          <span>Error Rate: {integration.errorRate}%</span>
                          <span>Avg Response: {integration.avgResponseTime}ms</span>
                          <span>Last Used: {new Date(integration.lastUsed).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Switch 
                          checked={integration.enabled}
                          onCheckedChange={(checked) => {
                            setIntegrations(prev => prev.map(int => 
                              int.id === integration.id ? { ...int, enabled: checked } : int
                            ));
                          }}
                        />
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
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