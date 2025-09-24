import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Crown, Zap, CreditCard, Package } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { useState } from 'react';

const Pricing = () => {
  const { isAuthenticated } = useAuth();
  const { tier: currentTier, subscribed, createCheckout, openCustomerPortal, loading } = useSubscription();
  const { toast } = useToast();
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  // Subscription plans with actual Stripe price IDs
  const subscriptionPlans = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      period: "forever",
      priceId: null,
      icon: <Sparkles className="w-8 h-8" />,
      description: "Perfect for getting started",
      features: [
        "10 credits per month",
        "Auto-refresh every 30 days",
        "AI text generation",
        "AI illustrations",
        "Basic support",
        "No payment required"
      ],
      buttonText: "Start Creating Free",
      popular: false
    },
    {
      id: "starter",
      name: "Starter",
      price: "$9.99",
      period: "per month",
      priceId: "price_1S6b9MK8ILu7UAIcAr71xgxL", // Actual Stripe price ID
      icon: <Crown className="w-8 h-8" />,
      description: "Most Popular",
      features: [
        "100 credits per month",
        "~10-20 complete stories",
        "All free features",
        "Priority generation",
        "Email support",
        "Cancel anytime",
        "50% founder discount available"
      ],
      buttonText: "Upgrade to Starter",
      popular: true
    },
    {
      id: "premium",
      name: "Premium",
      price: "$19.99",
      period: "per month",
      priceId: "price_1S6b9NK8ILu7UAIc7Gn8tI0R", // Actual Stripe price ID
      icon: <Zap className="w-8 h-8" />,
      description: "Best Value",
      features: [
        "300 credits per month",
        "~30-60 complete stories",
        "All Starter features",
        "Priority support",
        "10% discount on extra credits",
        "Advanced customization",
        "60% founder discount available"
      ],
      buttonText: "Go Premium",
      popular: false
    }
  ];

  // Credit packs for one-time purchases
  const creditPacks = [
    {
      name: "Small Pack",
      credits: 50,
      price: "$5",
      priceId: "price_1S6b9NK8ILu7UAIcHuoiCSzd",
      perCredit: "$0.10 per credit",
      savings: null,
      icon: <Package className="w-6 h-6" />
    },
    {
      name: "Medium Pack",
      credits: 100,
      price: "$9",
      priceId: "price_1S6b9OK8ILu7UAIcX0c8eIpW",
      perCredit: "$0.09 per credit",
      savings: "10% savings",
      icon: <Package className="w-6 h-6" />
    },
    {
      name: "Large Pack",
      credits: 250,
      price: "$20",
      priceId: "price_1S6b9OK8ILu7UAIcNXqTxGrm",
      perCredit: "$0.08 per credit",
      savings: "20% savings",
      icon: <Package className="w-6 h-6" />
    },
    {
      name: "Mega Pack",
      credits: 500,
      price: "$35",
      priceId: "price_1S6b9PK8ILu7UAIcZkGb9Bt8",
      perCredit: "$0.07 per credit",
      savings: "30% savings",
      icon: <Package className="w-6 h-6" />
    }
  ];

  const handleSubscribe = async (plan: typeof subscriptionPlans[0]) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to subscribe to a plan.",
        variant: "destructive",
      });
      return;
    }

    if (plan.id === "free") {
      toast({
        title: "Already on Free Plan",
        description: "You're already using the free plan with 10 credits per month.",
      });
      return;
    }

    if (currentTier === plan.id) {
      // User already has this plan, open customer portal
      openCustomerPortal();
      return;
    }

    setProcessingPlan(plan.id);
    try {
      const checkoutUrl = await createCheckout(plan.priceId!, 'subscription');
      if (checkoutUrl) {
        window.open(checkoutUrl, '_blank');
      }
    } catch (error) {
      logger.error('Subscription error', error, { operation: 'create_subscription', planId: plan.priceId });
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleBuyCredits = async (pack: typeof creditPacks[0]) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to purchase credits.",
        variant: "destructive",
      });
      return;
    }

    setProcessingPlan(pack.name);
    try {
      const checkoutUrl = await createCheckout(pack.priceId, 'payment');
      if (checkoutUrl) {
        window.open(checkoutUrl, '_blank');
      }
    } catch (error) {
      logger.error('Credit purchase error', error, { operation: 'purchase_credits', packName: pack.name });
    } finally {
      setProcessingPlan(null);
    }
  };

  const getButtonText = (plan: typeof subscriptionPlans[0]) => {
    if (loading) return "Loading...";
    if (currentTier === plan.id && subscribed) return "Manage Subscription";
    if (currentTier === plan.id) return "Current Plan";
    return plan.buttonText;
  };

  const isCurrentPlan = (planId: string) => currentTier === planId;

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-gradient mb-6">
            Choose Your Plan
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-4">
            Start free with 10 credits every month. Upgrade anytime for more stories.
          </p>
          <div className="bg-muted/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 max-w-lg mx-auto">
            <div className="flex items-center justify-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span><strong>1 Credit = 1 Story Chapter</strong> (AI text + illustration)</span>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground mt-2">
              <CreditCard className="w-4 h-4" />
              <span>Voice narration: 1 credit per 100 words</span>
            </div>
          </div>
        </div>

        {/* Monthly Subscriptions */}
        <div className="mb-20">
          <h2 className="text-3xl font-heading font-bold text-center mb-12 text-gradient">
            Monthly Subscriptions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {subscriptionPlans.map((plan) => (
              <div 
                key={plan.id} 
                className={`glass-card-elevated p-8 relative ${
                  plan.popular ? 'ring-2 ring-primary glow-strong' : ''
                } ${isCurrentPlan(plan.id) ? 'ring-2 ring-success' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-2">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                {isCurrentPlan(plan.id) && (
                  <div className="absolute -top-4 right-4">
                    <Badge className="bg-success text-success-foreground px-3 py-1">
                      Current Plan
                    </Badge>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                    {plan.icon}
                  </div>
                  <h3 className="text-2xl font-heading font-bold mb-2">{plan.name}</h3>
                  <p className="text-text-secondary mb-4">{plan.description}</p>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-primary">{plan.price}</span>
                    <span className="text-text-secondary">/{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-text-secondary">
                      <Check className="w-5 h-5 text-success mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleSubscribe(plan)}
                  disabled={loading || processingPlan === plan.id}
                >
                  {processingPlan === plan.id ? "Processing..." : getButtonText(plan)}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Credit Packs */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold mb-4 text-gradient">
              Need More Credits?
            </h2>
            <p className="text-lg text-text-secondary">
              One-time credit purchases that never expire
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {creditPacks.map((pack) => (
              <div key={pack.name} className="glass-card p-6 text-center relative">
                {pack.savings && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-accent text-accent-foreground px-3 py-1 text-xs">
                      {pack.savings}
                    </Badge>
                  </div>
                )}
                
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                  {pack.icon}
                </div>
                
                <h3 className="font-heading font-bold text-lg mb-2">{pack.name}</h3>
                <div className="text-2xl font-bold text-primary mb-1">{pack.credits}</div>
                <div className="text-sm text-text-secondary mb-3">credits</div>
                <div className="text-xl font-bold mb-1">{pack.price}</div>
                <div className="text-xs text-text-secondary mb-4">{pack.perCredit}</div>
                
                <Button 
                  size="sm" 
                  className="w-full btn-secondary"
                  onClick={() => handleBuyCredits(pack)}
                  disabled={loading || processingPlan === pack.name}
                >
                  {processingPlan === pack.name ? "Processing..." : "Buy Pack"}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-text-secondary mb-4">
            All plans include our 30-day money-back guarantee
          </p>
          <p className="text-text-tertiary text-sm">
            Need a custom plan? <a href="/contact" className="text-primary hover:underline">Contact us</a>
          </p>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Pricing;