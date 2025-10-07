import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { Sparkles, Eye, EyeOff } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { logger } from '@/lib/logger';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Check for Google OAuth signup and send welcome email
        logger.info('Auth state change', { event, hasSession: !!session, hasUser: !!session?.user });

        // Log auth event type
        logger.info('Auth event type check', { event });

        // Check condition: event === 'SIGNED_IN' && session?.user
        const isSignedInEvent = event === 'SIGNED_IN';
        const hasUser = !!session?.user;
        logger.info('Auth conditions check', {
          isSignedInEvent,
          hasUser,
          combinedCondition: isSignedInEvent && hasUser
        });

        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          const user = session.user;

          // Log user provider check
          const isGoogleOAuth = user.identities?.some(identity => identity.provider === 'google');
          logger.info('User provider check', {
            email: user.email,
            isGoogleOAuth,
            identities: user.identities?.map(i => ({ provider: i.provider, created_at: i.created_at }))
          });

          // Log account creation time
          logger.info('Account creation time', { createdAt: user.created_at });

          if (isGoogleOAuth) {
            // Check if user was created recently (within last 10 minutes)
            const createdAt = new Date(user.created_at);
            const now = new Date();
            const timeDiff = now.getTime() - createdAt.getTime();
            const tenMinutes = 10 * 60 * 1000;

            // Log timing condition check
            const withinTenMinutes = timeDiff < tenMinutes;
            logger.info('Account creation timing condition check', {
              createdAt: createdAt.toISOString(),
              now: now.toISOString(),
              timeDiffMinutes: timeDiff / (60 * 1000),
              tenMinutesThreshold: tenMinutes / (60 * 1000),
              withinTenMinutes
            });

            if (timeDiff < tenMinutes) {
              logger.info('Attempting to send welcome email', { email: user.email });
              try {
                // Call the send-welcome-email function
                const { data, error } = await supabase.functions.invoke('send-welcome-email', {
                  body: { email: user.email }
                });

                if (error) {
                  logger.error('Failed to send welcome email', { error, email: user.email });
                } else {
                  logger.info('Welcome email sent successfully', { email: user.email, response: data });
                }
              } catch (error) {
                logger.error('Exception calling send-welcome-email function', { error: error.message, email: user.email });
              }
            } else {
              logger.info('User created more than 10 minutes ago, skipping welcome email', { email: user.email });
            }
          }
        }

        // Redirect authenticated users to dashboard
        if (session?.user) {
          setTimeout(() => {
            navigate('/dashboard');
          }, 100);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSignUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName
        }
      }
    });
    
    return { error };
  };

  const handleSignIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { error };
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      logger.info('Starting Google OAuth flow', { origin: window.location.origin });
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      logger.debug('Google OAuth response', { hasData: !!data, hasError: !!error });

      if (error) {
        logger.error('Google OAuth failed', error);
        
        // Provide more specific error messages
        let errorMessage = error.message;
        if (error.message?.includes('OAuth')) {
          errorMessage = "Google authentication is not properly configured. Please contact support.";
        } else if (error.message?.includes('redirect_uri')) {
          errorMessage = "Authentication redirect URL mismatch. Please contact support.";
        } else if (error.message?.includes('unauthorized')) {
          errorMessage = "Google authentication is not enabled. Please contact support.";
        }
        
        toast({
          title: "Google sign-in failed",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        // OAuth redirect will happen automatically if successful
        logger.info('Google OAuth initiated successfully');
      }
    } catch (error: any) {
      logger.error('Google sign-in unexpected error', error);
      toast({
        title: "Authentication Error",
        description: error?.message || "Failed to initiate Google sign-in. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Validate sign up form
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Error",
            description: "Passwords don't match",
            variant: "destructive",
          });
          return;
        }

        if (formData.password.length < 6) {
          toast({
            title: "Error",
            description: "Password must be at least 6 characters long",
            variant: "destructive",
          });
          return;
        }

        if (!formData.fullName.trim()) {
          toast({
            title: "Error",
            description: "Please enter your full name",
            variant: "destructive",
          });
          return;
        }

        const { error } = await handleSignUp(formData.email, formData.password, formData.fullName);
        
        if (error) {
          // Handle specific errors
          if (error.message.includes('already registered')) {
            toast({
              title: "Account exists",
              description: "An account with this email already exists. Try signing in instead.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Sign up failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Welcome to Tale Forge!",
            description: "Please check your email to verify your account.",
          });
        }
      } else {
        // Sign In
        const { error } = await handleSignIn(formData.email, formData.password);
        
        if (error) {
          toast({
            title: "Sign in failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "Successfully signed in.",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card-elevated w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-heading font-bold text-gradient mb-2">
            {isSignUp ? 'Join Tale Forge' : 'Welcome Back'}
          </h1>
          <p className="text-text-secondary">
            {isSignUp 
              ? 'Start creating magical stories with AI' 
              : 'Sign in to continue your storytelling journey'
            }
          </p>
        </div>

        {/* Google Sign-in Button */}
        <Button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 py-6 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="font-medium">Continue with Google</span>
        </Button>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full bg-border/50" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-text-tertiary">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isSignUp && (
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-text-primary mb-2">
                Full Name
              </label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter your full name"
                required
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                className="input-field pr-10"
                placeholder={isSignUp ? 'Create a password' : 'Enter your password'}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-tertiary hover:text-text-primary"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isSignUp && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary mb-2">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-field"
                placeholder="Confirm your password"
                required
              />
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? (
              <div className="loading-spinner h-5 w-5" />
            ) : isSignUp ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-text-secondary">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:text-primary-hover transition-colors font-medium"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
          <Link to="/" className="text-text-tertiary hover:text-text-secondary transition-colors text-sm mt-2 block">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Auth;