import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';

const Success = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refresh: refreshSubscription } = useSubscription();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const handleSuccess = async () => {
      if (sessionId) {
        // Wait a moment for Stripe to process, then refresh subscription status
        setTimeout(async () => {
          await refreshSubscription();
          setIsLoading(false);
          toast({
            title: "Payment Successful!",
            description: "Your subscription has been activated and credits have been added to your account.",
          });
        }, 2000);
      } else {
        setIsLoading(false);
      }
    };

    handleSuccess();
  }, [sessionId, refreshSubscription, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-heading font-bold mb-4">Processing your payment...</h1>
            <p className="text-text-secondary">Please wait while we confirm your subscription.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-12 h-12 text-success" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-gradient mb-6">
            Payment Successful!
          </h1>
          
          <p className="text-xl text-text-secondary mb-8">
            Thank you for your purchase! Your subscription has been activated and you're ready to start creating amazing stories.
          </p>

          <div className="glass-card p-8 mb-8">
            <h2 className="text-2xl font-heading font-bold mb-4">What's Next?</h2>
            <div className="space-y-4 text-left">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Your credits have been added</p>
                  <p className="text-sm text-text-secondary">Start creating stories immediately with your new credit balance</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Premium features unlocked</p>
                  <p className="text-sm text-text-secondary">Access priority generation, voice narration, and advanced customization</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Manage your subscription</p>
                  <p className="text-sm text-text-secondary">Update payment methods, change plans, or cancel anytime from your dashboard</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/create')}
              variant="default"
              size="lg"
            >
              Start Creating Stories
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            
            <Button 
              onClick={() => navigate('/dashboard')}
              variant="outline"
            >
              Go to Dashboard
            </Button>
          </div>

          <div className="mt-12 text-center">
            <p className="text-text-secondary mb-4">
              Need help getting started?
            </p>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/about')}
              className="text-primary hover:text-primary/80"
            >
              Learn How It Works
            </Button>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Success;