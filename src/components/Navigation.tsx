import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { LogOut, Settings, User, Shield } from 'lucide-react';
import taleForgeLogoImage from '@/assets/tale-forge-logo.png';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface NavigationProps {
  className?: string;
}

const Navigation = ({ className = "" }: NavigationProps) => {
  const { user, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase.rpc('has_role', { check_role: 'admin' });
      setIsAdmin(data || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };
  return (
    <nav className={`glass-card border-b border-primary/10 sticky top-0 z-50 ${className}`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <img 
              src={taleForgeLogoImage} 
              alt="Tale Forge Logo" 
              className="w-10 h-10 object-contain"
            />
            <span className="text-2xl font-heading font-bold text-gradient">Tale Forge</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/discover" className="text-text-secondary hover:text-primary transition-colors story-link text-with-shadow">
              Discover
            </Link>
            {user && (
              <>
                <Link to="/dashboard" className="text-text-secondary hover:text-primary transition-colors story-link text-with-shadow">
                  Dashboard
                </Link>
                <Link to="/my-stories" className="text-text-secondary hover:text-primary transition-colors story-link text-with-shadow">
                  My Stories
                </Link>
              </>
            )}
            <Link to="/about" className="text-text-secondary hover:text-primary transition-colors story-link text-with-shadow">
              About
            </Link>
            <Link to="/pricing" className="text-text-secondary hover:text-primary transition-colors story-link text-with-shadow">
              Pricing
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  {user.email?.split('@')[0]}
                </Button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 glass-card-elevated rounded-lg shadow-lg z-50">
                    <div className="py-2">
                      <Link
                        to="/settings"
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted/50 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted/50 transition-colors text-primary"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Shield className="w-4 h-4" />
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted/50 transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/auth" className="hidden sm:block">
                  <Button variant="outline" className="btn-secondary">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button className="btn-primary">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;