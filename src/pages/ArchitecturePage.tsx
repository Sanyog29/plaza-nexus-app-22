import React from 'react';
import { SEOHead } from '@/components/seo/SEOHead';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MermaidDiagram } from '@/components/diagrams/MermaidDiagram';
import { useAuth } from '@/components/AuthProvider';
import { AlertTriangle, Shield, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ArchitecturePage = () => {
  const { user, isAdmin, isSiteManager, isOpsSupervisor, userRole } = useAuth();

  // Check if user has access to architecture diagrams (management roles)
  const hasAccess = isAdmin || isSiteManager || isOpsSupervisor || 
    ['fin_analyst', 'sustain_mgr'].includes(userRole || '');

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Authentication Required</h3>
            <p className="text-gray-400 mb-4">Please log in to access system architecture.</p>
            <Button variant="outline" onClick={() => window.location.href = '/auth'}>
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Management Access Required</h3>
            <p className="text-gray-400 mb-4">
              System architecture diagrams are restricted to management roles for security purposes.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Current role: <span className="font-medium text-white">{userRole || 'User'}</span>
              </p>
              <p className="text-xs text-gray-600">
                Access granted to: Admin, Site Manager, Operations Supervisor, Finance Analyst, Sustainability Manager
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // System Architecture Diagrams
  const systemOverviewDiagram = `
graph TB
    subgraph "Frontend Layer"
        A[React App] --> B[Auth Provider]
        A --> C[Route Guards]
        A --> D[Real-time Updates]
    end
    
    subgraph "Supabase Backend"
        E[Authentication] --> F[Row Level Security]
        G[PostgreSQL Database] --> H[Real-time Subscriptions]
        I[Edge Functions] --> J[Scheduled Jobs]
        K[File Storage] --> L[CDN]
    end
    
    subgraph "External Integrations"
        M[Email Service] --> N[SMS Gateway]
        O[Push Notifications] --> P[QR Code Generator]
        Q[Analytics Service] --> R[Backup Systems]
    end
    
    A --> E
    D --> H
    I --> M
    I --> N
    I --> O
    
    style A fill:#6366f1,stroke:#4f46e5,color:#fff
    style G fill:#059669,stroke:#047857,color:#fff
    style I fill:#dc2626,stroke:#b91c1c,color:#fff
`;

  const ticketingFlowDiagram = `
graph TD
    A[User Creates Request] --> B{Auth Check}
    B -->|Authenticated| C[Validate Input]
    B -->|Not Auth| D[Redirect to Login]
    
    C --> E[Create Record in DB]
    E --> F[Trigger RLS Policies]
    F --> G[Auto-assign Logic]
    
    G --> H{Assignment Rules}
    H -->|By Location| I[Assign to Zone Staff]
    H -->|By Type| J[Assign to Specialist]
    H -->|By Priority| K[Assign to Senior Staff]
    
    I --> L[Send Notifications]
    J --> L
    K --> L
    
    L --> M[Real-time Updates]
    L --> N[Email Notifications]
    L --> O[SMS Alerts]
    
    M --> P[Update UI Components]
    N --> Q[Staff Email]
    O --> R[Manager SMS]
    
    style A fill:#3b82f6,stroke:#2563eb,color:#fff
    style E fill:#059669,stroke:#047857,color:#fff
    style L fill:#dc2626,stroke:#b91c1c,color:#fff
`;

  const bookingSystemDiagram = `
graph LR
    subgraph "Booking Request"
        A[User Request] --> B[Date/Time Selection]
        B --> C[Resource Check]
        C --> D[Conflict Detection]
    end
    
    subgraph "Validation & Processing"
        D --> E{Available?}
        E -->|Yes| F[Create Booking]
        E -->|No| G[Suggest Alternatives]
        F --> H[Send Confirmations]
        G --> I[Return to Selection]
    end
    
    subgraph "Management & Updates"
        H --> J[Calendar Updates]
        J --> K[Real-time Sync]
        K --> L[Notification System]
        L --> M[Email/SMS/Push]
    end
    
    style F fill:#059669,stroke:#047857,color:#fff
    style G fill:#dc2626,stroke:#b91c1c,color:#fff
    style K fill:#6366f1,stroke:#4f46e5,color:#fff
`;

  const posIntegrationDiagram = `
graph TB
    subgraph "POS Frontend"
        A[Order Interface] --> B[Menu Management]
        B --> C[Cart System]
        C --> D[Checkout Process]
    end
    
    subgraph "Payment Processing"
        D --> E[Payment Gateway]
        E --> F[Transaction Validation]
        F --> G{Payment Success?}
        G -->|Yes| H[Order Confirmation]
        G -->|No| I[Retry/Cancel]
    end
    
    subgraph "Order Management"
        H --> J[Kitchen Display]
        J --> K[Order Tracking]
        K --> L[Delivery Status]
        L --> M[Customer Updates]
    end
    
    subgraph "Analytics & Reporting"
        H --> N[Sales Analytics]
        N --> O[Revenue Reports]
        O --> P[Dashboard Updates]
    end
    
    style E fill:#f59e0b,stroke:#d97706,color:#fff
    style J fill:#059669,stroke:#047857,color:#fff
    style N fill:#8b5cf6,stroke:#7c3aed,color:#fff
`;

  const dashboardAnalyticsDiagram = `
graph TD
    subgraph "Data Sources"
        A[Request Tickets] --> D[Analytics Engine]
        B[Booking Records] --> D
        C[POS Transactions] --> D
        E[User Activities] --> D
        F[System Metrics] --> D
    end
    
    subgraph "Processing Layer"
        D --> G[Real-time Aggregation]
        G --> H[KPI Calculations]
        H --> I[Trend Analysis]
        I --> J[Predictive Models]
    end
    
    subgraph "Visualization"
        J --> K[Executive Dashboard]
        J --> L[Operational Metrics]
        J --> M[Financial Reports]
        J --> N[Performance Analytics]
    end
    
    subgraph "Role-based Views"
        K --> O[Admin View]
        L --> P[Manager View]
        M --> Q[Finance View]
        N --> R[Staff View]
    end
    
    style D fill:#6366f1,stroke:#4f46e5,color:#fff
    style G fill:#059669,stroke:#047857,color:#fff
    style K fill:#dc2626,stroke:#b91c1c,color:#fff
`;

  const escalationProcessDiagram = `
graph TD
    A[Request Created] --> B[Initial Assignment]
    B --> C[Start SLA Timer]
    C --> D{Response Time OK?}
    
    D -->|Yes| E[Normal Processing]
    D -->|No| F[Level 1 Escalation]
    
    F --> G[Notify Supervisor]
    G --> H{Resolution Time OK?}
    
    H -->|Yes| I[Complete Request]
    H -->|No| J[Level 2 Escalation]
    
    J --> K[Notify Manager]
    K --> L{Still Unresolved?}
    
    L -->|Yes| M[Level 3 Escalation]
    L -->|No| I
    
    M --> N[Executive Alert]
    N --> O[Emergency Protocol]
    
    E --> P[Regular Updates]
    P --> Q[Completion Check]
    Q --> I
    
    style F fill:#f59e0b,stroke:#d97706,color:#fff
    style J fill:#dc2626,stroke:#b91c1c,color:#fff
    style M fill:#7c2d12,stroke:#991b1b,color:#fff
`;

  return (
    <>
      <SEOHead
        title="System Architecture | SS Plaza"
        description="Technical architecture diagrams and system flow documentation for SS Plaza management platform."
        url={`${window.location.origin}/architecture`}
        type="website"
        noindex
      />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Network className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-white">System Architecture</h1>
            <p className="text-gray-400 mt-1">
              Comprehensive technical diagrams and system flows for SS Plaza enterprise platform
            </p>
          </div>
        </div>

        {/* Access Level Info */}
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-white">
                  Management Access Level: {userRole}
                </p>
                <p className="text-xs text-gray-400">
                  These diagrams contain sensitive system information and are restricted to management roles.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Architecture Diagrams */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-card/50 border border-border/50">
            <TabsTrigger value="overview">System Overview</TabsTrigger>
            <TabsTrigger value="ticketing">Ticketing Flow</TabsTrigger>
            <TabsTrigger value="bookings">Booking System</TabsTrigger>
            <TabsTrigger value="pos">POS Integration</TabsTrigger>
            <TabsTrigger value="analytics">Analytics & Dashboards</TabsTrigger>
            <TabsTrigger value="escalations">Escalation Process</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <MermaidDiagram
              title="System Overview Architecture"
              description="High-level view of the SS Plaza platform architecture showing frontend, backend, and external integrations."
              diagram={systemOverviewDiagram}
            />
          </TabsContent>

          <TabsContent value="ticketing" className="space-y-6">
            <MermaidDiagram
              title="Ticketing System Flow"
              description="Complete workflow from request creation to assignment and notifications."
              diagram={ticketingFlowDiagram}
            />
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <MermaidDiagram
              title="Booking System Process"
              description="Resource booking workflow with conflict detection and real-time updates."
              diagram={bookingSystemDiagram}
            />
          </TabsContent>

          <TabsContent value="pos" className="space-y-6">
            <MermaidDiagram
              title="POS Integration Flow"
              description="Point of Sale system integration with order management and analytics."
              diagram={posIntegrationDiagram}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <MermaidDiagram
              title="Dashboard & Analytics System"
              description="Data flow from various sources to role-based dashboard views."
              diagram={dashboardAnalyticsDiagram}
            />
          </TabsContent>

          <TabsContent value="escalations" className="space-y-6">
            <MermaidDiagram
              title="Escalation Process Flow"
              description="SLA-driven escalation workflow with multiple alert levels."
              diagram={escalationProcessDiagram}
            />
          </TabsContent>
        </Tabs>

        {/* Technical Notes */}
        <Card className="bg-card/30 backdrop-blur border-border/30">
          <CardHeader>
            <CardTitle className="text-lg text-white">Technical Implementation Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-white">Security Implementation</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Row Level Security (RLS) enforced at database level</li>
                  <li>• Role-based access control with hierarchical permissions</li>
                  <li>• JWT tokens with automatic refresh</li>
                  <li>• Encrypted data storage and transmission</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-white">Real-time Features</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• WebSocket connections for live updates</li>
                  <li>• Optimistic UI updates with rollback</li>
                  <li>• Multi-channel notifications (Email/SMS/Push)</li>
                  <li>• Event-driven architecture with triggers</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ArchitecturePage;