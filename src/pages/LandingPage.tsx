import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Building2, 
  Wrench, 
  Coffee, 
  Shield, 
  Users, 
  Calendar,
  Bell,
  TrendingUp,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

const LandingPage: React.FC = () => {
  const features = [
    {
      icon: Wrench,
      title: 'Maintenance Management',
      description: 'Submit and track maintenance requests with real-time updates and priority handling.'
    },
    {
      icon: Coffee,
      title: 'Cafeteria Services',
      description: 'Order food from multiple vendors, schedule pickups, and enjoy loyalty rewards.'
    },
    {
      icon: Shield,
      title: 'Security & Access',
      description: 'Advanced security monitoring, visitor management, and access control systems.'
    },
    {
      icon: Calendar,
      title: 'Room Bookings',
      description: 'Book meeting rooms and common areas with smart scheduling and availability tracking.'
    },
    {
      icon: Users,
      title: 'Staff Management',
      description: 'Efficient team coordination, task assignments, and performance tracking.'
    },
    {
      icon: Bell,
      title: 'Real-time Notifications',
      description: 'Stay updated with instant notifications for all activities and updates.'
    }
  ];

  const stats = [
    { value: '24/7', label: 'Support Available' },
    { value: '1000+', label: 'Daily Users' },
    { value: '99.9%', label: 'Uptime' },
    { value: '5min', label: 'Avg Response Time' }
  ];

  return (
    <>
      <SEOHead
        title="SS Plaza - Smart Building Management System"
        description="Modern facility management platform for SS Plaza. Manage maintenance, cafeteria orders, security, room bookings, and more - all in one place."
        keywords={['building management', 'facility management', 'maintenance requests', 'cafeteria ordering', 'security system', 'room booking']}
      />
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-surface/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">SS Plaza</h1>
            </div>
            <Link to="/auth">
              <Button variant="default">
                Sign In
              </Button>
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <TrendingUp className="h-4 w-4" />
              <span>Next-Generation Facility Management</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
              Your Complete Facility Management
              <span className="text-primary"> Solution</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Streamline operations, enhance tenant experience, and manage your facility efficiently with our comprehensive platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Link to="/auth">
                <Button size="lg" className="gap-2">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-y border-border bg-surface/30">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Everything You Need in One Place
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to simplify building management and enhance operational efficiency.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow border-border bg-surface">
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="bg-surface/30 border-y border-border py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-4xl font-bold text-foreground text-center mb-12">
                Why Choose SS Plaza?
              </h2>
              
              <div className="space-y-6">
                {[
                  'Real-time tracking and updates for all operations',
                  'Mobile-friendly interface for on-the-go access',
                  'Automated workflows and smart notifications',
                  'Comprehensive reporting and analytics',
                  'Secure access control and data protection',
                  'Dedicated 24/7 support team'
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="bg-primary/10 rounded-full p-1 mt-1">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-lg text-foreground">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 p-12 text-center">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join hundreds of satisfied users managing their facility operations efficiently with SS Plaza.
            </p>
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                Sign Up Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </Card>
        </section>

        {/* Footer */}
        <footer className="border-t border-border bg-surface/30 py-8">
          <div className="container mx-auto px-4 text-center text-muted-foreground">
            <p>© 2025 SS Plaza. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;
