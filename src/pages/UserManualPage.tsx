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
  Shield
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
          "Setting up your profile",
          "Understanding request statuses",
          "Using the mobile app"
        ]
      },
      {
        title: "Services & Bookings",
        icon: FileText,
        items: [
          "Booking meeting rooms",
          "Ordering from cafeteria",
          "Scheduling maintenance services",
          "Managing visitor access"
        ]
      },
      {
        title: "Security Features",
        icon: Shield,
        items: [
          "Visitor registration process",
          "Parking request system",
          "Emergency procedures",
          "Access control guidelines"
        ]
      }
    ],
    staff: [
      {
        title: "Request Management",
        icon: Wrench,
        items: [
          "Assigning and updating requests",
          "Setting priority levels",
          "Using SLA timers",
          "Adding status updates"
        ]
      },
      {
        title: "Dashboard Overview",
        icon: FileText,
        items: [
          "Reading performance metrics",
          "Managing workload balance",
          "Generating reports",
          "Alert management"
        ]
      },
      {
        title: "Communication",
        icon: Users,
        items: [
          "Updating tenants on progress",
          "Internal team coordination",
          "Escalation procedures",
          "Documentation requirements"
        ]
      }
    ],
    admin: [
      {
        title: "System Configuration",
        icon: Settings,
        items: [
          "User role management",
          "SLA configuration",
          "Category setup",
          "System maintenance"
        ]
      },
      {
        title: "Analytics & Reporting",
        icon: FileText,
        items: [
          "Performance dashboard overview",
          "Custom report generation",
          "Data export procedures",
          "Trend analysis"
        ]
      },
      {
        title: "User Management",
        icon: Crown,
        items: [
          "Adding new users",
          "Role assignments",
          "Access control",
          "Account management"
        ]
      }
    ]
  };

  const troubleshootingGuide = [
    {
      issue: "Cannot submit maintenance request",
      solutions: [
        "Check all required fields are filled",
        "Ensure you have a complete profile",
        "Try refreshing the page",
        "Contact support if issue persists"
      ]
    },
    {
      issue: "Not receiving notifications",
      solutions: [
        "Check browser notification settings",
        "Verify email address in profile",
        "Check spam/junk folder",
        "Update notification preferences"
      ]
    },
    {
      issue: "Unable to access admin features",
      solutions: [
        "Verify admin role assignment",
        "Clear browser cache",
        "Log out and back in",
        "Contact system administrator"
      ]
    }
  ];

  const workflows = {
    "Submit Maintenance Request": [
      "Navigate to Requests → New Request",
      "Select appropriate category",
      "Fill in title and detailed description",
      "Add location information",
      "Set priority level if urgent",
      "Attach photos if helpful",
      "Submit request",
      "Track progress in My Requests"
    ],
    "Manage User Roles (Admin)": [
      "Go to Admin → User Management",
      "Find user in the table",
      "Click role dropdown",
      "Select new role (Admin/Staff/Tenant)",
      "Confirm changes",
      "User will be notified of role change"
    ],
    "Process Visitor Registration": [
      "Navigate to Security section",
      "Click 'Register Visitor'",
      "Enter visitor details",
      "Set visit date and purpose",
      "Generate QR code",
      "Share code with visitor",
      "Track visitor entry/exit"
    ]
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">User Manual & Documentation</h1>
        <p className="text-gray-400 mb-6">
          Comprehensive guides and documentation for SS Plaza management system
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
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="guides">Role Guides</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
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

        <TabsContent value="admin-setup">
          <div className="grid gap-6">
            <Card className="p-6 bg-gray-800 border-gray-700">
              <h3 className="text-xl font-semibold text-white mb-4">Initial System Setup</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-900 rounded-lg">
                  <h4 className="font-semibold text-plaza-blue mb-2">1. Admin Account Creation</h4>
                  <p className="text-gray-300">
                    The first user registered becomes the system administrator. 
                    Additional admin accounts can be created through User Management.
                  </p>
                </div>
                <div className="p-4 bg-gray-900 rounded-lg">
                  <h4 className="font-semibold text-plaza-blue mb-2">2. Configure Categories</h4>
                  <p className="text-gray-300">
                    Set up maintenance categories, service types, and request priorities 
                    to match your building's specific needs.
                  </p>
                </div>
                <div className="p-4 bg-gray-900 rounded-lg">
                  <h4 className="font-semibold text-plaza-blue mb-2">3. SLA Configuration</h4>
                  <p className="text-gray-300">
                    Define response and resolution times for different types of requests 
                    to ensure service level agreements are met.
                  </p>
                </div>
                <div className="p-4 bg-gray-900 rounded-lg">
                  <h4 className="font-semibold text-plaza-blue mb-2">4. Staff Onboarding</h4>
                  <p className="text-gray-300">
                    Create staff accounts and assign appropriate roles. Train staff 
                    on using the system for request management and reporting.
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
                      <li>• Full system access</li>
                      <li>• User management</li>
                      <li>• System configuration</li>
                      <li>• Analytics & reports</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-gray-900 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <UserCheck className="h-5 w-5 text-blue-400" />
                      <h4 className="font-semibold text-white">Staff</h4>
                    </div>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Request management</li>
                      <li>• Status updates</li>
                      <li>• Basic reporting</li>
                      <li>• Tenant communication</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-gray-900 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-green-400" />
                      <h4 className="font-semibold text-white">Tenant</h4>
                    </div>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Submit requests</li>
                      <li>• Track progress</li>
                      <li>• Book services</li>
                      <li>• Manage visitors</li>
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