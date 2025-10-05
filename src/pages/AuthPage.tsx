
import React from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AuthForm from "@/components/auth/AuthForm";
import WelcomeCard from "@/components/auth/WelcomeCard";
import InvitationAcceptance from "@/components/auth/InvitationAcceptance";
import { ModernAuthModal } from "@/components/auth/ModernAuthModal";
import { createNetworkAwareRequest } from "@/utils/networkUtils";
import { SEOHead } from "@/components/seo/SEOHead";
import { normalizeToE164, validateAndFormatPhone } from "@/utils/phoneUtils";

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const invitation = searchParams.get('invitation');
  const [showModal, setShowModal] = React.useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = location.state?.from?.pathname || "/dashboard";

  // If there's an invitation token, show the invitation acceptance form
  if (invitation) {
    return <InvitationAcceptance />;
  }

  const handleModalClose = () => {
    setShowModal(false);
    navigate('/');
  };

  const handleAuthSuccess = () => {
    setShowModal(false);
    navigate(from);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background mobile-safe">
      <SEOHead
        title="Sign in or Create Account"
        description="Secure login and signup for AUTOPILOT Building Management System."
        url={`${window.location.origin}/auth`}
        type="website"
      />
      
      {/* Modern Auth Modal */}
      <ModernAuthModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSuccess={handleAuthSuccess}
      />
      
      {/* Fallback content when modal is closed */}
      {!showModal && (
        <>
          {/* Header with branding to match main app */}
          <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <div className="container max-w-7xl mx-auto px-6 h-16 flex items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">SP</span>
                </div>
                <div>
                  <h1 className="font-semibold text-foreground">AUTOPILOT</h1>
                  <p className="text-xs text-muted-foreground">Building Management System</p>
                </div>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 flex items-center justify-center px-4">
            <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-6 lg:gap-8 items-center animate-fade-in-up">
              <div className="hidden lg:block">
                <WelcomeCard />
              </div>
              <div className="w-full max-w-md mx-auto lg:max-w-none">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold mb-4">Welcome to AUTOPILOT</h2>
                  <button
                    onClick={() => setShowModal(true)}
                    className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Sign In / Sign Up
                  </button>
                </div>
              </div>
            </div>
          </main>
        </>
      )}
    </div>
  );
};

export default AuthPage;
