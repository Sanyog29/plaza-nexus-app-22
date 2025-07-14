import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QualityAssuranceDashboard } from '@/components/admin/QualityAssuranceDashboard';
import { DocumentationCenter } from '@/components/admin/DocumentationCenter';
import { PerformanceMonitor } from '@/components/admin/PerformanceMonitor';
import { 
  CheckSquare, 
  BookOpen, 
  Zap, 
  Shield,
  Users,
  BarChart3
} from 'lucide-react';

export default function QualityControlPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Quality Control Center</h1>
          <p className="text-muted-foreground">
            Comprehensive quality assurance, testing, and documentation for production readiness
          </p>
        </div>

        <Tabs defaultValue="quality" className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 h-auto p-1 bg-card/50 backdrop-blur-sm">
            <TabsTrigger 
              value="quality" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
            >
              <CheckSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Quality Tests</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="performance" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
            >
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="documentation" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Documentation</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="accessibility" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Accessibility</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="user-testing" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">User Testing</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="analytics" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">QA Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quality" className="space-y-6">
            <QualityAssuranceDashboard />
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <PerformanceMonitor />
          </TabsContent>

          <TabsContent value="documentation" className="space-y-6">
            <DocumentationCenter />
          </TabsContent>

          <TabsContent value="accessibility" className="space-y-6">
            <div className="text-center py-12">
              <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Accessibility Testing</h2>
              <p className="text-muted-foreground">
                Comprehensive accessibility auditing and compliance checking coming soon.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="user-testing" className="space-y-6">
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">User Testing Suite</h2>
              <p className="text-muted-foreground">
                User journey testing and feedback collection tools coming soon.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Quality Analytics</h2>
              <p className="text-muted-foreground">
                Historical quality metrics and trend analysis coming soon.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}