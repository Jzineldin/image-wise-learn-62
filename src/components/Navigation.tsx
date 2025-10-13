import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { LogOut, Settings, User, Shield, HelpCircle, MessageSquare, Menu, X } from 'lucide-react';
import taleForgeLogoImage from '@/assets/tale-forge-logo.webp';
import taleForgeLogoFallback from '@/assets/tale-forge-logo.png';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import CreditDisplay from './CreditDisplay';
import { useOnboarding } from './OnboardingTour';
import { ThemeToggle } from './ThemeToggle';
import FeedbackDialog from './FeedbackDialog';
import FounderBadge from './FounderBadge';
import { logger } from '@/lib/production-logger';

interface NavigationProps {
  className?: string;
}

const Navigation = ({ className = "" }: NavigationProps) => {
  const { user, profile, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { startTour } = useOnboarding();

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase.rpc('has_role', { check_role: 'admin' });
      setIsAdmin(data || false);
    } catch (error) {
      logger.error('Error checking admin status', error, {
        operation: 'admin-status-check',
        userId: user?.id
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
    setShowMobileMenu(false);
  };

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
  };

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMobileMenu(false);
        setShowUserMenu(false);
      }
    };
    
    if (showMobileMenu || showUserMenu) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showMobileMenu, showUserMenu]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showMobileMenu]);

  return (
    <nav aria-label="Main navigation" className={`glass-card border-b border-primary/10 sticky top-0 z-50 overflow-visible ${className}`}>
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200"
            aria-label="Tale Forge home"
          >
            <picture>
              <source srcSet={taleForgeLogoImage} type="image/webp" />
              <img
                src={taleForgeLogoFallback}
                alt="Tale Forge Logo"
                className="w-10 h-10 object-contain"
                width="40"
                height="40"
                loading="eager"
                decoding="async"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </picture>
            <span className="text-2xl font-heading font-bold text-gradient">Tale Forge</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-2">
            <Link to="/discover" className="px-3 py-2 rounded-lg text-text-secondary hover:bg-muted/50 hover:text-primary transition-all duration-200">
              Discover
            </Link>
            {user && (
              <>
                <Link to="/dashboard" className="px-3 py-2 rounded-lg text-text-secondary hover:bg-muted/50 hover:text-primary transition-all duration-200">
                  Dashboard
                </Link>
                <Link to="/my-stories" className="px-3 py-2 rounded-lg text-text-secondary hover:bg-muted/50 hover:text-primary transition-all duration-200">
                  My Stories
                </Link>
              </>
            )}
            <Link to="/about" className="px-3 py-2 rounded-lg text-text-secondary hover:bg-muted/50 hover:text-primary transition-all duration-200">
              About
            </Link>
            <Link to="/testimonials" className="px-3 py-2 rounded-lg text-text-secondary hover:bg-muted/50 hover:text-primary transition-all duration-200">
              Testimonials
            </Link>
            <Link to="/pricing" className="px-3 py-2 rounded-lg text-text-secondary hover:bg-muted/50 hover:text-primary transition-all duration-200">
              Pricing
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {user && <CreditDisplay compact showActions={false} />}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 min-h-[44px] min-w-[44px]"
              aria-label={showMobileMenu ? "Close menu" : "Open menu"}
              aria-expanded={showMobileMenu}
              aria-controls="mobile-menu"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle variant="dropdown" showLabel={false} />

            {/* Global Feedback Button - Desktop Only (Mobile has floating button) */}
            <FeedbackDialog
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 hidden md:flex"
                  aria-label="Send feedback"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Feedback</span>
                </Button>
              }
            />

            {user ? (
              <>
                <CreditDisplay compact showActions={false} />
                <div className="relative">
                  <Button
                    variant="ghost"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2"
                    aria-label="User menu"
                    aria-expanded={showUserMenu}
                    aria-haspopup="true"
                  >
                    <User className="w-4 h-4" />
                    {user.email?.split('@')[0]}
                    {profile?.is_beta_user && (
                      <FounderBadge
                        founderStatus={profile.founder_status}
                        isBetaUser={profile.is_beta_user}
                        betaJoinedAt={profile.beta_joined_at}
                        size="sm"
                      />
                    )}
                  </Button>
                
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 glass-card-elevated rounded-lg shadow-lg z-[1200] max-h-[80vh] overflow-auto">
                      <div className="py-2">
                        <Link
                          to="/settings"
                          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg hover:bg-muted/50 hover:text-primary transition-all duration-200"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </Link>
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            startTour();
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg hover:bg-muted/50 hover:text-primary transition-all duration-200 w-full text-left"
                        >
                          <HelpCircle className="w-4 h-4" />
                          Take Tour
                        </button>
                        {isAdmin && (
                          <Link
                            to="/admin"
                            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg hover:bg-muted/50 hover:text-primary transition-all duration-200"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Shield className="w-4 h-4" />
                            Admin Panel
                          </Link>
                        )}
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg hover:bg-muted/50 hover:text-primary transition-all duration-200 w-full text-left"
                          aria-label="Sign out of your account"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/auth" className="hidden sm:block">
                  <Button variant="outline">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="default" size="lg">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={closeMobileMenu}
              aria-hidden="true"
            />
            
            {/* Mobile Menu Panel */}
            <div
              id="mobile-menu"
              className="fixed top-[73px] left-0 right-0 bottom-0 bg-background/95 backdrop-blur-lg z-40 md:hidden overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation menu"
            >
              <div className="container mx-auto px-4 py-6">
                <nav className="flex flex-col space-y-1">
                  {/* Main Navigation Links */}
                  <Link
                    to="/discover"
                    className="text-lg py-3 px-4 rounded-lg hover:bg-muted/50 hover:text-primary transition-all duration-200 min-h-[44px] flex items-center"
                    onClick={closeMobileMenu}
                  >
                    Discover
                  </Link>

                  {user && (
                    <>
                      <Link
                        to="/dashboard"
                        className="text-lg py-3 px-4 rounded-lg hover:bg-muted/50 hover:text-primary transition-all duration-200 min-h-[44px] flex items-center"
                        onClick={closeMobileMenu}
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/my-stories"
                        className="text-lg py-3 px-4 rounded-lg hover:bg-muted/50 hover:text-primary transition-all duration-200 min-h-[44px] flex items-center"
                        onClick={closeMobileMenu}
                      >
                        My Stories
                      </Link>
                    </>
                  )}

                  <Link
                    to="/about"
                    className="text-lg py-3 px-4 rounded-lg hover:bg-muted/50 hover:text-primary transition-all duration-200 min-h-[44px] flex items-center"
                    onClick={closeMobileMenu}
                  >
                    About
                  </Link>

                  <Link
                    to="/testimonials"
                    className="text-lg py-3 px-4 rounded-lg hover:bg-muted/50 hover:text-primary transition-all duration-200 min-h-[44px] flex items-center"
                    onClick={closeMobileMenu}
                  >
                    Testimonials
                  </Link>

                  <Link
                    to="/pricing"
                    className="text-lg py-3 px-4 rounded-lg hover:bg-muted/50 hover:text-primary transition-all duration-200 min-h-[44px] flex items-center"
                    onClick={closeMobileMenu}
                  >
                    Pricing
                  </Link>

                  <div className="h-px bg-border my-4" />

                  {/* User Actions */}
                  {user ? (
                    <>
                      <div className="px-4 py-2 text-sm text-muted-foreground flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {user.email?.split('@')[0]}
                        {profile?.is_beta_user && (
                          <FounderBadge
                            founderStatus={profile.founder_status}
                            isBetaUser={profile.is_beta_user}
                            betaJoinedAt={profile.beta_joined_at}
                            size="sm"
                          />
                        )}
                      </div>
                      
                      <Link
                        to="/settings"
                        className="text-lg py-3 px-4 rounded-lg hover:bg-muted/50 hover:text-primary transition-all duration-200 min-h-[44px] flex items-center gap-3"
                        onClick={closeMobileMenu}
                      >
                        <Settings className="w-5 h-5" />
                        Settings
                      </Link>

                      <button
                        onClick={() => {
                          closeMobileMenu();
                          startTour();
                        }}
                        className="text-lg py-3 px-4 rounded-lg hover:bg-muted/50 hover:text-primary transition-all duration-200 min-h-[44px] flex items-center gap-3 w-full text-left"
                      >
                        <HelpCircle className="w-5 h-5" />
                        Take Tour
                      </button>

                      {/* Feedback button removed from mobile menu - use floating button instead */}

                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="text-lg py-3 px-4 rounded-lg hover:bg-muted/50 hover:text-primary transition-all duration-200 min-h-[44px] flex items-center gap-3"
                          onClick={closeMobileMenu}
                        >
                          <Shield className="w-5 h-5" />
                          Admin Panel
                        </Link>
                      )}

                      <button
                        onClick={handleSignOut}
                        className="text-lg py-3 px-4 rounded-lg hover:bg-muted/50 hover:text-destructive transition-all duration-200 min-h-[44px] flex items-center gap-3 w-full text-left"
                      >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/auth"
                        className="text-lg py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors duration-200 min-h-[44px] flex items-center justify-center"
                        onClick={closeMobileMenu}
                      >
                        <Button variant="outline" className="w-full min-h-[44px]">
                          Sign In
                        </Button>
                      </Link>
                      <Link
                        to="/auth"
                        className="text-lg py-3 px-4 rounded-lg transition-colors duration-200 min-h-[44px] flex items-center justify-center"
                        onClick={closeMobileMenu}
                      >
                        <Button variant="default" size="lg" className="w-full min-h-[44px]">
                          Get Started
                        </Button>
                      </Link>
                    </>
                  )}

                  {/* Theme Toggle in Mobile Menu */}
                  <div className="px-4 py-3 flex items-center justify-between min-h-[44px]">
                    <span className="text-lg">Theme</span>
                    <ThemeToggle variant="dropdown" showLabel={false} />
                  </div>
                </nav>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navigation;