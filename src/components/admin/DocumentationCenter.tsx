import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  Code, 
  Users, 
  Settings, 
  Keyboard,
  MousePointer,
  Search,
  HelpCircle,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export const DocumentationCenter: React.FC = () => {
  const documentationSections = [
    {
      title: "Getting Started",
      description: "Quick start guide for new users",
      icon: BookOpen,
      items: [
        { title: "Introduction to FacilityPro", path: "/docs/introduction" },
        { title: "User Registration & Approval", path: "/docs/registration" },
        { title: "Navigation Overview", path: "/docs/navigation" },
        { title: "Dashboard Walkthrough", path: "/docs/dashboard" },
      ]
    },
    {
      title: "User Guides",
      description: "Detailed guides for different user roles",
      icon: Users,
      items: [
        { title: "Admin User Guide", path: "/docs/admin-guide" },
        { title: "Staff User Guide", path: "/docs/staff-guide" },
        { title: "Tenant User Guide", path: "/docs/tenant-guide" },
        { title: "Vendor User Guide", path: "/docs/vendor-guide" },
      ]
    },
    {
      title: "Features & Modules",
      description: "Comprehensive feature documentation",
      icon: Settings,
      items: [
        { title: "Maintenance Requests", path: "/docs/maintenance" },
        { title: "Room Bookings", path: "/docs/bookings" },
        { title: "Visitor Management", path: "/docs/visitors" },
        { title: "Cafeteria System", path: "/docs/cafeteria" },
        { title: "Asset Management", path: "/docs/assets" },
        { title: "Analytics & Reports", path: "/docs/analytics" },
      ]
    },
    {
      title: "API Documentation",
      description: "Developer resources and API reference",
      icon: Code,
      items: [
        { title: "API Overview", path: "/docs/api" },
        { title: "Authentication", path: "/docs/api/auth" },
        { title: "Endpoints Reference", path: "/docs/api/endpoints" },
        { title: "Webhooks", path: "/docs/api/webhooks" },
      ]
    }
  ];

  const quickHelp = [
    {
      title: "Keyboard Shortcuts",
      icon: Keyboard,
      shortcuts: [
        { keys: "Ctrl + K", action: "Open search" },
        { keys: "Ctrl + B", action: "Toggle sidebar" },
        { keys: "Ctrl + F", action: "Quick actions" },
        { keys: "Esc", action: "Close modals" },
        { keys: "Tab", action: "Navigate elements" },
        { keys: "Enter", action: "Activate buttons" },
      ]
    },
    {
      title: "Mouse Interactions",
      icon: MousePointer,
      shortcuts: [
        { keys: "Click", action: "Select/activate" },
        { keys: "Double-click", action: "Quick edit" },
        { keys: "Right-click", action: "Context menu" },
        { keys: "Hover", action: "Show tooltips" },
        { keys: "Drag & Drop", action: "Reorder items" },
      ]
    }
  ];

  const troubleshooting = [
    {
      issue: "Cannot see my data",
      solution: "Check your user permissions and approval status. Contact admin if needed.",
      category: "Access"
    },
    {
      issue: "Page not loading",
      solution: "Refresh the page, check internet connection, or try a different browser.",
      category: "Technical"
    },
    {
      issue: "Search not working",
      solution: "Try different keywords, check spelling, or use filters to narrow results.",
      category: "Features"
    },
    {
      issue: "Form submission fails",
      solution: "Ensure all required fields are filled and check for validation errors.",
      category: "Forms"
    },
    {
      issue: "Notifications not appearing",
      solution: "Check browser notification permissions and notification settings.",
      category: "Settings"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Documentation Center</h2>
        <p className="text-muted-foreground">
          Comprehensive guides, tutorials, and help resources for FacilityPro
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <Search className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Search Documentation</h3>
            <p className="text-sm text-muted-foreground">Find specific topics and answers</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <HelpCircle className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Get Support</h3>
            <p className="text-sm text-muted-foreground">Contact our support team</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <ExternalLink className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Video Tutorials</h3>
            <p className="text-sm text-muted-foreground">Watch step-by-step guides</p>
          </CardContent>
        </Card>
      </div>

      {/* Documentation Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {documentationSections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <section.icon className="h-5 w-5 mr-2 text-primary" />
                {section.title}
              </CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center justify-between p-2 rounded hover:bg-accent/50 cursor-pointer transition-colors"
                  >
                    <span className="text-sm font-medium">{item.title}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Help */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quickHelp.map((helpSection) => (
          <Card key={helpSection.title}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <helpSection.icon className="h-5 w-5 mr-2 text-primary" />
                {helpSection.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {helpSection.shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {shortcut.keys}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {shortcut.action}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle>Common Issues & Solutions</CardTitle>
          <CardDescription>
            Quick fixes for the most frequently encountered problems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {troubleshooting.map((item, index) => (
              <div key={index} className="border-l-4 border-primary/20 pl-4 py-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{item.issue}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{item.solution}</p>
                  </div>
                  <Badge variant="secondary" className="ml-4">
                    {item.category}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Need More Help?</h3>
          <p className="text-muted-foreground mb-4">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button variant="default">
              Contact Support
            </Button>
            <Button variant="outline">
              Submit Feature Request
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};