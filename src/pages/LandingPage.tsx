import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { useAuth } from '@/components/AuthProvider';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isStaff, userRole } = useAuth();

  // Redirect authenticated users to appropriate dashboard based on role
  useEffect(() => {
    if (user) {
      if (isAdmin) {
        navigate('/admin/dashboard');
      } else if (isStaff) {
        navigate('/staff/dashboard');
      } else if (userRole === 'vendor') {
        navigate('/vendor-portal');
      } else if (userRole === 'procurement_manager' || userRole === 'purchase_executive') {
        navigate('/procurement');
      } else {
        navigate('/dashboard'); // Tenants go to tenant portal
      }
    }
  }, [user, isAdmin, isStaff, userRole, navigate]);
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
        title="AUTOPILOT - Smart Building Management System"
        description="Modern facility management platform for AUTOPILOT. Manage maintenance, cafeteria orders, security, room bookings, and more - all in one place."
        keywords={['building management', 'facility management', 'maintenance requests', 'cafeteria ordering', 'security system', 'room booking']}
      />
      
      <div className="min-h-screen bg-background">
        {/* Floating gradient orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>
        
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">AUTOPILOT</span>
            </div>
            <Link to="/auth">
              <Button 
                variant="default"
                className="rounded-full px-6 hover:scale-105 transition-transform"
              >
                Sign In
              </Button>
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative container mx-auto px-4 py-24 md:py-32 animate-slide-up">
          <div className="flex flex-col items-center text-center space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
              Smart Facility Management
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mt-2">
                Made Simple
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl leading-relaxed">
              Streamline your building operations with AI-powered insights, 
              real-time monitoring, and automated workflows.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/auth">
                <Button 
                  size="lg"
                  className="rounded-full px-8 py-6 text-lg gradient-blue-purple hover:scale-105 transition-all shadow-lg hover:shadow-2xl animate-shimmer"
                >
                  Get Started Free
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline"
                className="rounded-full px-8 py-6 text-lg border-2 hover:scale-105 hover:bg-card/10 transition-all"
              >
                Request Demo
              </Button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="relative py-16">
          <div className="container mx-auto px-4">
            <div className="glass-card-enhanced rounded-ultra p-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-3 animate-pulse-gentle">
                      {stat.value}
                    </div>
                    <div className="text-sm md:text-base text-muted-foreground font-medium">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-24">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Everything You Need
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools to manage every aspect of your building operations
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="rounded-2xl border-2 border-border/40 bg-card/50 backdrop-blur-sm hover-lift overflow-hidden group p-6"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-base">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="gradient-dark py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-12 text-primary-foreground">
                Why Choose AUTOPILOT?
              </h2>
              <div className="space-y-6">
                <div className="glass-card-enhanced rounded-2xl p-8 hover-lift">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl mb-3 text-primary-foreground">Real-time Monitoring</h3>
                      <p className="text-primary-foreground/90 font-semibold text-lg">
                        Stay informed with instant updates on all building systems
                      </p>
                    </div>
                  </div>
                </div>
                <div className="glass-card-enhanced rounded-2xl p-8 hover-lift">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl mb-3 text-primary-foreground">AI-Powered Insights</h3>
                      <p className="text-primary-foreground/90 font-semibold text-lg">
                        Get smart recommendations based on historical data
                      </p>
                    </div>
                  </div>
                </div>
                <div className="glass-card-enhanced rounded-2xl p-8 hover-lift">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl mb-3 text-primary-foreground">Easy Integration</h3>
                      <p className="text-primary-foreground/90 font-semibold text-lg">
                        Connect with your existing building management systems
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-24">
          <div className="relative rounded-ultra overflow-hidden gradient-blue-purple p-16 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-primary-foreground">
                Ready to Transform Your Building Management?
              </h2>
              <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
                Join thousands of satisfied customers already using AUTOPILOT
              </p>
              <Link to="/auth">
                <Button 
                  size="lg"
                  className="rounded-full px-8 py-6 text-lg bg-white text-primary hover:bg-white/90 hover:scale-105 transition-all shadow-2xl animate-shimmer"
                >
                  Start Your Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/40 bg-gradient-to-b from-background to-background/50 py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold">AUTOPILOT</span>
              </div>
              <p className="text-muted-foreground">&copy; 2025 AUTOPILOT. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;
