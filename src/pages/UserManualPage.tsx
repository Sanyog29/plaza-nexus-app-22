import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Book, 
  Users, 
  UserCheck, 
  Crown, 
  Search, 
  ChevronRight,
  Settings,
  HelpCircle,
  FileText,
  Wrench,
  Shield,
  QrCode,
  Calendar,
  BarChart3,
  Database,
  Zap,
  Camera,
  MessageSquare,
  AlertTriangle,
  MapPin,
  Clock,
  DollarSign,
  Headphones,
  Car,
  Coffee,
  Smartphone,
  Wifi,
  Star,
  Archive,
  Eye,
  FileCheck,
  Bell,
  Lock,
  Activity
} from 'lucide-react';

const UserManualPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('tenant');

  const manualSections = {
    tenant: [
      {
        title: "Getting Started",
        icon: Book,
        items: [
          "Creating your first maintenance request",
          "Setting up your profile and notification preferences",
          "Understanding request statuses and SLA timers",
          "Using the mobile PWA app",
          "Exploring the self-service knowledge base",
          "Basic dashboard navigation"
        ]
      },
      {
        title: "Maintenance & Services",
        icon: Wrench,
        items: [
          "Submitting maintenance requests (10+ categories)",
          "Attaching photos and files to requests",
          "Tracking request progress and SLA compliance",
          "Using quick templates for common issues",
          "Providing feedback and ratings",
          "Emergency request procedures"
        ]
      },
      {
        title: "Bookings & Reservations", 
        icon: Calendar,
        items: [
          "Booking meeting rooms (6 rooms available)",
          "Scheduling service appointments",
          "Managing recurring bookings",
          "Cancellation and modification policies",
          "Room availability checking",
          "Integration with calendar systems"
        ]
      },
      {
        title: "Cafeteria & Loyalty",
        icon: Coffee,
        items: [
          "Browsing menu categories and items",
          "Placing and tracking food orders",
          "Earning and redeeming loyalty points",
          "Setting dietary preferences",
          "Order scheduling and pickup",
          "Payment and loyalty transactions"
        ]
      },
      {
        title: "Visitor Management",
        icon: QrCode,
        items: [
          "Registering visitors with QR codes",
          "Setting visitor categories and access levels",
          "Managing visitor timers and notifications",
          "Parking request integration",
          "Emergency visitor procedures",
          "Host responsibilities and protocols"
        ]
      },
      {
        title: "Mobile Features",
        icon: Smartphone,
        items: [
          "Installing the PWA app",
          "Offline functionality usage",
          "Push notification setup",
          "QR code scanning for zones",
          "Photo capture for requests",
          "Voice input for accessibility"
        ]
      }
    ],
    staff: [
      {
        title: "Request Management",
        icon: Wrench,
        items: [
          "Processing and assigning maintenance requests",
          "Setting priority levels and SLA timers",
          "Updating request status and progress",
          "Managing workload and queue optimization",
          "Escalation procedures and penalty tracking",
          "Bulk operations and batch processing"
        ]
      },
      {
        title: "Asset & Equipment Management",
        icon: Database,
        items: [
          "Tracking asset lifecycles and AMC contracts",
          "Recording service history and maintenance logs",
          "Managing equipment warranties and renewals", 
          "Creating AMC alerts and notifications",
          "Photo documentation and file attachments",
          "Vendor management and coordination"
        ]
      },
      {
        title: "Zone & Attendance Management",
        icon: MapPin,
        items: [
          "QR code zone check-ins and tracking",
          "Managing daily checklists by zone",
          "Recording attendance and shift logs",
          "Security shift handover procedures",
          "Performance score tracking",
          "Skill verification and management"
        ]
      },
      {
        title: "Visitor & Security Operations",
        icon: Shield,
        items: [
          "Processing visitor registrations and QR codes",
          "Managing security shifts and handovers",
          "Emergency procedure activation",
          "Access control and monitoring",
          "Incident reporting and documentation",
          "Parking management integration"
        ]
      },
      {
        title: "Knowledge Base Management",
        icon: FileCheck,
        items: [
          "Creating and updating help articles",
          "Managing troubleshooting guides",
          "Tracking article usage and success rates",
          "Escalating DIY failures to maintenance",
          "Content categorization and tagging",
          "Video and image content management"
        ]
      },
      {
        title: "Performance & Analytics",
        icon: BarChart3,
        items: [
          "Daily performance metrics tracking",
          "SLA compliance monitoring",
          "Individual and team scorecards",
          "Efficiency and quality scoring",
          "Customer satisfaction tracking",
          "Continuous improvement identification"
        ]
      }
    ],
    admin: [
      {
        title: "System Configuration",
        icon: Settings,
        items: [
          "User role management and permissions",
          "SLA configuration and escalation rules",
          "Category and service type setup",
          "System settings and preferences",
          "Integration configuration",
          "Backup and maintenance procedures"
        ]
      },
      {
        title: "Advanced Analytics",
        icon: BarChart3,
        items: [
          "Executive dashboard and KPI monitoring",
          "Custom report generation and scheduling",
          "Data export and integration",
          "Trend analysis and forecasting",
          "ROI and cost analysis",
          "Compliance and audit reporting"
        ]
      },
      {
        title: "User & Access Management",
        icon: Crown,
        items: [
          "Adding and managing user accounts",
          "Role assignments and approvals",
          "Access control and permissions",
          "User profile management",
          "Account activation and deactivation",
          "Security audit and monitoring"
        ]
      },
      {
        title: "Asset & Financial Management",
        icon: DollarSign,
        items: [
          "Budget allocation and tracking",
          "Cost center management",
          "Vendor and contract management",
          "AMC renewal and cost optimization",
          "Financial reporting and analysis",
          "Procurement workflow management"
        ]
      },
      {
        title: "Utility & Infrastructure",
        icon: Zap,
        items: [
          "Utility meter management and readings",
          "Consumption tracking and analysis",
          "Budget monitoring and alerts",
          "Supplier contract management",
          "Energy efficiency reporting",
          "Infrastructure planning and optimization"
        ]
      },
      {
        title: "Emergency & Compliance",
        icon: AlertTriangle,
        items: [
          "Emergency procedure configuration",
          "Compliance monitoring and reporting",
          "Audit log management and review",
          "Security incident response",
          "Business continuity planning",
          "Regulatory compliance tracking"
        ]
      }
    ]
  };

  const troubleshootingGuide = [
    {
      issue: "Cannot submit maintenance request",
      solutions: [
        "Verify all required fields (title, description, location) are completed",
        "Ensure your user profile is complete and approved",
        "Check if you have selected a valid category from the dropdown",
        "Try uploading photos in supported formats (JPG, PNG, PDF)",
        "Clear browser cache and refresh the page",
        "Disable browser extensions that might interfere",
        "Contact support with specific error messages"
      ]
    },
    {
      issue: "QR Code not scanning properly",
      solutions: [
        "Ensure adequate lighting when scanning QR codes",
        "Clean your camera lens for better image quality",
        "Hold device steady and at proper distance (6-12 inches)",
        "Allow camera permissions in browser settings",
        "Try using the manual visitor ID entry option",
        "Refresh the QR code if it appears expired",
        "Use a different device or browser if issues persist"
      ]
    },
    {
      issue: "Not receiving notifications",
      solutions: [
        "Enable browser notifications in site settings",
        "Verify email address in your profile settings",
        "Check spam/junk folder for system emails",
        "Update notification preferences in profile",
        "Ensure your browser supports push notifications",
        "Try logging out and back in to refresh settings",
        "Contact admin if notifications are disabled system-wide"
      ]
    },
    {
      issue: "Unable to access admin features",
      solutions: [
        "Verify your account has admin role assignment",
        "Check if account approval status is 'approved'",
        "Clear browser cache and cookies",
        "Try incognito/private browsing mode",
        "Log out completely and log back in",
        "Verify you're accessing the correct subdomain/URL",
        "Contact system administrator for role verification"
      ]
    },
    {
      issue: "Room booking conflicts or errors",
      solutions: [
        "Check room availability calendar before booking",
        "Ensure booking times don't overlap existing reservations",
        "Verify you have permission to book the selected room",
        "Try selecting different time slots if conflicts occur",
        "Contact facility manager for room-specific restrictions",
        "Cancel conflicting bookings before creating new ones",
        "Refresh the calendar view to see latest availability"
      ]
    },
    {
      issue: "Cafeteria order placement failures",
      solutions: [
        "Verify menu items are available and in stock",
        "Check if ordering is within allowed time windows",
        "Ensure pickup time is valid and within operating hours",
        "Review order total and loyalty points balance",
        "Try reducing order quantity if limits are exceeded",
        "Clear cart and rebuild order if persistent errors",
        "Contact cafeteria staff for special requirements"
      ]
    },
    {
      issue: "Knowledge base articles not loading",
      solutions: [
        "Check internet connection stability",
        "Clear browser cache for the knowledge base section",
        "Try different search terms or browse by category",
        "Ensure you have permission to access knowledge base",
        "Report broken article links to system administrator",
        "Use alternative browsers if content doesn't display",
        "Try accessing articles directly via URL if available"
      ]
    },
    {
      issue: "Performance metrics not updating",
      solutions: [
        "Verify you have appropriate permissions for analytics",
        "Check if data sync is in progress (may take 5-10 minutes)",
        "Refresh the dashboard to trigger data reload",
        "Try accessing different date ranges for data",
        "Clear cache and reload the analytics section",
        "Report persistent data issues to system administrator",
        "Verify system maintenance isn't affecting data processing"
      ]
    },
    {
      issue: "File upload failures",
      solutions: [
        "Check file size limits (typically 10MB maximum)",
        "Ensure file formats are supported (JPG, PNG, PDF, DOC)",
        "Verify stable internet connection during upload",
        "Try compressing large files before uploading",
        "Use different file names if special characters cause issues",
        "Clear browser cache and try upload again",
        "Contact support for file format or size limit increases"
      ]
    },
    {
      issue: "Mobile app installation problems",
      solutions: [
        "Ensure you're using a compatible browser (Chrome, Safari, Edge)",
        "Look for 'Add to Home Screen' prompt when visiting the site",
        "Access site via HTTPS (secure connection required for PWA)",
        "Clear browser data and revisit the application",
        "Enable app installation permissions in browser settings",
        "Try installation from different pages within the app",
        "Use desktop mode if mobile installation fails"
      ]
    }
  ];

  const workflows = {
    "Submit Maintenance Request": [
      "Navigate to Requests → New Request from main menu",
      "Select appropriate category from 10+ available options",
      "Fill in descriptive title and detailed description",
      "Choose location from standardized dropdown menu",
      "Set priority level (Urgent/High/Medium/Low) based on impact",
      "Attach photos, documents, or files up to 10MB",
      "Review SLA timeline expectations before submitting",
      "Submit request and note the tracking ID provided",
      "Monitor progress in My Requests with real-time updates",
      "Provide feedback and rating upon completion"
    ],
    "Register Visitor with QR Code": [
      "Navigate to Security → Visitor Management",
      "Click 'Add New Visitor' button",
      "Enter visitor details (name, company, contact)",
      "Select visitor category (Business, Vendor, Interview, etc.)",
      "Set visit date, time, and expected duration",
      "Choose host from directory and notify them",
      "Set access level and parking requirements if needed",
      "Generate unique QR code with expiration time",
      "Share QR code via email or print physical copy",
      "Monitor visitor check-in/out status in real-time",
      "Review visit logs and update records if needed"
    ],
    "Book Meeting Room": [
      "Access Room Booking from main dashboard",
      "Select desired date and view availability calendar",
      "Choose from 6 available rooms (Conference A/B, Meeting 1/2, Training, Boardroom)",
      "Check room capacity and available facilities",
      "Set start and end times ensuring no conflicts",
      "Add meeting title and description",
      "Invite attendees and set recurring booking if needed",
      "Confirm booking details and submit reservation",
      "Receive confirmation email with booking details",
      "Modify or cancel booking through 'My Bookings' section"
    ],
    "Process AMC Alert (Staff)": [
      "Receive AMC alert notification 30 days before renewal",
      "Navigate to Asset Management → AMC Alerts",
      "Review asset details and current AMC status",
      "Check service history and performance records",
      "Contact vendor for renewal quotes and terms",
      "Update AMC details with new contract information",
      "Schedule service appointments for contract transition",
      "Mark alert as resolved with resolution notes",
      "Update asset record with new AMC dates and costs",
      "Set reminder for next renewal cycle"
    ],
    "Manage User Roles (Admin)": [
      "Access Admin → User Management from navigation",
      "Review user list with current roles and approval status",
      "Find specific user using search or filter options",
      "Click on user row to open detailed profile",
      "Select new role from dropdown (Admin/Staff/Field Staff/Tenant)",
      "Set approval status if account needs activation",
      "Add department, floor, and zone information",
      "Save changes and confirm role assignment",
      "User receives automatic notification of role change",
      "Monitor user activity logs for compliance"
    ],
    "Handle Emergency Incident": [
      "Access Emergency Procedures from security dashboard",
      "Select incident type (Fire, Medical, Security, Evacuation)",
      "Activate appropriate emergency protocol immediately",
      "Use voice-to-text for rapid incident documentation",
      "Notify all relevant authorities using pre-configured contacts",
      "Initiate evacuation procedures if required",
      "Generate visitor evacuation list from current check-ins",
      "Send emergency notifications to all building occupants",
      "Document all actions taken and timeline of events",
      "Submit incident report with photos and witness statements",
      "Follow up with post-incident analysis and improvements"
    ],
    "Track Utility Consumption": [
      "Navigate to Utilities → Meter Readings",
      "Select utility type (Electricity, Water, Gas) and meter",
      "Enter current reading value and capture photo",
      "System automatically calculates consumption since last reading",
      "Review consumption trends and budget comparisons",
      "Set up alerts for unusual consumption patterns",
      "Generate monthly consumption reports for management",
      "Update cost per unit if tariff rates change",
      "Schedule regular reading reminders for staff",
      "Export data for financial analysis and budgeting"
    ],
    "Create Knowledge Base Article": [
      "Access Admin → Knowledge Base Management",
      "Click 'Create New Article' for troubleshooting guides",
      "Select appropriate category and difficulty level",
      "Write clear title and comprehensive content",
      "Add step-by-step instructions with screenshots",
      "Include required tools and safety warnings",
      "Upload supporting images and video content",
      "Set estimated completion time for procedures",
      "Add relevant tags for searchability",
      "Test article with real users before publishing",
      "Monitor usage statistics and success rates",
      "Update content based on user feedback"
    ],
    "Manage Daily Staff Checklist": [
      "Access zone-specific checklist from mobile or desktop",
      "Review all required checklist items for assigned area",
      "Complete each task and mark as done with timestamp",
      "Take photos for items requiring visual verification",
      "Add notes for any issues or anomalies discovered",
      "Escalate problems by creating maintenance requests",
      "Submit completed checklist for supervisor review",
      "Address any items flagged by supervisor feedback",
      "Track checklist completion rates and trends",
      "Use historical data for performance improvement"
    ],
    "Order from Cafeteria": [
      "Browse menu categories and current daily specials",
      "Filter items by dietary preferences (Vegan, Vegetarian)",
      "Add items to cart with quantity and special notes",
      "Review order total and available loyalty points",
      "Select pickup time within operating hours",
      "Apply loyalty points discount if desired",
      "Submit order and receive confirmation with order number",
      "Track order preparation status in real-time",
      "Receive pickup notification when order is ready",
      "Collect order and earn loyalty points automatically"
    ]
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">User Manual & Documentation</h1>
        <p className="text-gray-400 mb-6">
          Comprehensive guides and documentation for Autopilot Offices management system
        </p>
        
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white"
          />
        </div>
      </div>

      <Tabs defaultValue="guides" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-8">
          <TabsTrigger value="guides">Role Guides</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="troubleshooting">FAQ & Support</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="admin-setup">Admin Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="guides">
          <div className="mb-6">
            <div className="flex gap-4 mb-6">
              <Button
                variant={selectedRole === 'tenant' ? 'default' : 'outline'}
                onClick={() => setSelectedRole('tenant')}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Tenant Guide
              </Button>
              <Button
                variant={selectedRole === 'staff' ? 'default' : 'outline'}
                onClick={() => setSelectedRole('staff')}
                className="flex items-center gap-2"
              >
                <UserCheck className="h-4 w-4" />
                Staff Guide
              </Button>
              <Button
                variant={selectedRole === 'admin' ? 'default' : 'outline'}
                onClick={() => setSelectedRole('admin')}
                className="flex items-center gap-2"
              >
                <Crown className="h-4 w-4" />
                Admin Guide
              </Button>
            </div>
          </div>

          <div className="grid gap-6">
            {manualSections[selectedRole as keyof typeof manualSections]?.map((section, index) => (
              <Card key={index} className="p-6 bg-gray-800 border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <section.icon className="h-6 w-6 text-plaza-blue" />
                  <h3 className="text-xl font-semibold text-white">{section.title}</h3>
                  <Badge variant="outline" className="capitalize">
                    {selectedRole}
                  </Badge>
                </div>
                <div className="grid gap-3">
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="workflows">
          <div className="grid gap-6">
            {Object.entries(workflows).map(([title, steps], index) => (
              <Card key={index} className="p-6 bg-gray-800 border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
                <div className="space-y-3">
                  {steps.map((step, stepIndex) => (
                    <div key={stepIndex} className="flex items-start gap-4 p-3 bg-gray-900 rounded-lg">
                      <div className="w-8 h-8 bg-plaza-blue text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        {stepIndex + 1}
                      </div>
                      <span className="text-gray-300 pt-1">{step}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="troubleshooting">
          <div className="grid gap-6">
            {troubleshootingGuide.map((item, index) => (
              <Card key={index} className="p-6 bg-gray-800 border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <HelpCircle className="h-6 w-6 text-red-400" />
                  <h3 className="text-xl font-semibold text-white">{item.issue}</h3>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">SOLUTIONS:</h4>
                  {item.solutions.map((solution, solutionIndex) => (
                    <div key={solutionIndex} className="flex items-start gap-3 p-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-300">{solution}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="features">
          <div className="grid gap-6">
            <Card className="p-6 bg-gray-800 border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">Core Features Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Wrench className="h-5 w-5 text-blue-400" />
                    <h4 className="font-semibold text-white">Maintenance System</h4>
                  </div>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• 10+ maintenance categories</li>
                    <li>• SLA tracking & escalation</li>
                    <li>• Photo & file attachments</li>
                    <li>• Real-time status updates</li>
                    <li>• Performance analytics</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <QrCode className="h-5 w-5 text-green-400" />
                    <h4 className="font-semibold text-white">QR Code Integration</h4>
                  </div>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Visitor registration & tracking</li>
                    <li>• Zone-based check-ins</li>
                    <li>• Staff attendance monitoring</li>
                    <li>• Equipment QR identification</li>
                    <li>• Mobile scanning support</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-5 w-5 text-purple-400" />
                    <h4 className="font-semibold text-white">Room Management</h4>
                  </div>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• 6 bookable rooms</li>
                    <li>• Conflict prevention system</li>
                    <li>• Recurring reservations</li>
                    <li>• Capacity & facility tracking</li>
                    <li>• Calendar integration</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-5 w-5 text-orange-400" />
                    <h4 className="font-semibold text-white">Asset Management</h4>
                  </div>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• AMC contract tracking</li>
                    <li>• Service history logging</li>
                    <li>• Warranty management</li>
                    <li>• Automated renewal alerts</li>
                    <li>• Vendor coordination</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-5 w-5 text-cyan-400" />
                    <h4 className="font-semibold text-white">Analytics & Reporting</h4>
                  </div>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Performance dashboards</li>
                    <li>• SLA compliance tracking</li>
                    <li>• Custom report generation</li>
                    <li>• Trend analysis</li>
                    <li>• Export capabilities</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Coffee className="h-5 w-5 text-yellow-400" />
                    <h4 className="font-semibold text-white">Cafeteria & Loyalty</h4>
                  </div>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Menu browsing & ordering</li>
                    <li>• Points-based loyalty system</li>
                    <li>• Order tracking</li>
                    <li>• Dietary preferences</li>
                    <li>• Transaction history</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gray-800 border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">Advanced Capabilities</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    <h4 className="font-semibold text-white">Utility Management</h4>
                  </div>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Multi-utility meter tracking (Electric, Water, Gas)</li>
                    <li>• Automated consumption calculations</li>
                    <li>• Budget monitoring and alerts</li>
                    <li>• Supplier contract management</li>
                    <li>• Energy efficiency reporting</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileCheck className="h-5 w-5 text-green-400" />
                    <h4 className="font-semibold text-white">Knowledge Base</h4>
                  </div>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Self-service troubleshooting guides</li>
                    <li>• Video and image support</li>
                    <li>• Success rate tracking</li>
                    <li>• Escalation to maintenance requests</li>
                    <li>• Content management system</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-5 w-5 text-red-400" />
                    <h4 className="font-semibold text-white">Performance Tracking</h4>
                  </div>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Individual staff scorecards</li>
                    <li>• Efficiency and quality metrics</li>
                    <li>• SLA compliance rates</li>
                    <li>• Customer satisfaction scores</li>
                    <li>• Continuous improvement insights</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-blue-400" />
                    <h4 className="font-semibold text-white">Security & Compliance</h4>
                  </div>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Emergency procedure management</li>
                    <li>• Audit log tracking</li>
                    <li>• Role-based access control</li>
                    <li>• Security incident reporting</li>
                    <li>• Compliance monitoring</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gray-800 border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-white mb-3">Technical Support</h4>
                  <div className="space-y-2 text-gray-300">
                    <div className="flex items-center gap-2">
                      <Headphones className="h-4 w-4" />
                      <span>24/7 Help Desk: Available via chat</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>In-app support ticket system</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Book className="h-4 w-4" />
                      <span>Knowledge base: 50+ articles</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-3">Emergency Contacts</h4>
                  <div className="space-y-2 text-gray-300">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Emergency Hotline: Available 24/7</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span>Security Operations Center</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      <span>System Administrator</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="admin-setup">
          <div className="grid gap-6">
            <Card className="p-6 bg-gray-800 border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">Initial System Setup</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-900 rounded-lg">
                  <h4 className="font-semibold text-plaza-blue mb-2">1. Admin Account Creation</h4>
                  <p className="text-gray-300">
                    The first user registered becomes the system administrator with full access. 
                    Additional admin accounts can be created through User Management with proper approval workflows.
                  </p>
                </div>
                <div className="p-4 bg-gray-900 rounded-lg">
                  <h4 className="font-semibold text-plaza-blue mb-2">2. Core System Configuration</h4>
                  <p className="text-gray-300">
                    Configure maintenance categories (10+ options), service types, priority levels, 
                    room bookings, visitor categories, and utility meter tracking to match your facility needs.
                  </p>
                </div>
                <div className="p-4 bg-gray-900 rounded-lg">
                  <h4 className="font-semibold text-plaza-blue mb-2">3. SLA & Performance Setup</h4>
                  <p className="text-gray-300">
                    Define response and resolution times for different request types and priorities. 
                    Set up escalation rules, penalty matrices, and performance tracking metrics.
                  </p>
                </div>
                <div className="p-4 bg-gray-900 rounded-lg">
                  <h4 className="font-semibold text-plaza-blue mb-2">4. Asset & Infrastructure Setup</h4>
                  <p className="text-gray-300">
                    Register all building assets, equipment, and utility meters. Configure AMC contracts, 
                    service schedules, warranty tracking, and automated alert systems.
                  </p>
                </div>
                <div className="p-4 bg-gray-900 rounded-lg">
                  <h4 className="font-semibold text-plaza-blue mb-2">5. Security & Access Control</h4>
                  <p className="text-gray-300">
                    Set up visitor categories, QR code zones, parking areas, and emergency procedures. 
                    Configure role-based permissions and security protocols.
                  </p>
                </div>
                <div className="p-4 bg-gray-900 rounded-lg">
                  <h4 className="font-semibold text-plaza-blue mb-2">6. Staff Training & Deployment</h4>
                  <p className="text-gray-300">
                    Create staff accounts with appropriate roles, conduct comprehensive training sessions, 
                    and gradually deploy features while monitoring adoption and performance.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gray-800 border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">User Role Management</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-900 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="h-5 w-5 text-yellow-400" />
                      <h4 className="font-semibold text-white">Admin</h4>
                    </div>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Complete system administration</li>
                      <li>• User role management & approvals</li>
                      <li>• Advanced analytics & reporting</li>
                      <li>• System configuration & settings</li>
                      <li>• Financial & budget management</li>
                      <li>• Compliance & audit oversight</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-gray-900 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <UserCheck className="h-5 w-5 text-blue-400" />
                      <h4 className="font-semibold text-white">Staff</h4>
                    </div>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Maintenance request processing</li>
                      <li>• Asset & equipment management</li>
                      <li>• QR zone check-ins & attendance</li>
                      <li>• Visitor & security operations</li>
                      <li>• Performance tracking & reports</li>
                      <li>• Knowledge base content management</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-gray-900 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-green-400" />
                      <h4 className="font-semibold text-white">Tenant</h4>
                    </div>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Submit & track maintenance requests</li>
                      <li>• Book meeting rooms & services</li>
                      <li>• Register visitors with QR codes</li>
                      <li>• Order from cafeteria & earn points</li>
                      <li>• Access knowledge base for self-help</li>
                      <li>• Use mobile PWA for convenience</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserManualPage;