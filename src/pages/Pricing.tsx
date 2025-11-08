import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Sparkles, Crown, Zap, CreditCard, Package, BookOpen, Image, Volume2, Video, Calculator } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { useState } from 'react';
import { CREDIT_COSTS, getPricingTiers } from '../../shared/credit-costs';

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
      priceId: "price_1S0fYXDSKngmC6wHQuhgXK92", // Tale Forge Starter
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
      priceId: "price_1S0fYXDSKngmC6wHFADzfnbx", // Tale Forge Premium
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
      priceId: "price_1S0fYYDSKngmC6wHpSnSJ9cf",
      perCredit: "$0.10 per credit",
      savings: null,
      icon: <Package className="w-6 h-6" />
    },
    {
      name: "Medium Pack",
      credits: 100,
      price: "$9",
      priceId: "price_1S0fYYDSKngmC6wH5OSPOwNC",
      perCredit: "$0.09 per credit",
      savings: "10% savings",
      icon: <Package className="w-6 h-6" />
    },
    {
      name: "Large Pack",
      credits: 250,
      price: "$20",
      priceId: "price_1S0fYZDSKngmC6wHrgIBx0Ih",
      perCredit: "$0.08 per credit",
      savings: "20% savings",
      icon: <Package className="w-6 h-6" />
    },
    {
      name: "Mega Pack",
      credits: 500,
      price: "$35",
      priceId: "price_1S0fYaDSKngmC6wHQQd34mgg",
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
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Start free with 10 credits every month. Upgrade anytime for more stories.
          </p>
        </div>

        {/* Credit System Explanation */}
        <div className="mb-20 max-w-6xl mx-auto">
          <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-heading flex items-center justify-center gap-3">
                <Calculator className="w-8 h-8 text-primary" />
                Understanding Credits
              </CardTitle>
              <CardDescription className="text-lg">
                Transparent pricing for every feature. Know exactly what you'll pay before you create.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Feature Pricing Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* FREE Features */}
                <Card className="border-green-500/30 bg-green-500/5">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2 text-green-600 dark:text-green-400">
                      <Sparkles className="w-5 h-5" />
                      FREE Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <BookOpen className="w-5 h-5 text-green-600 dark:text-green-400 mt-1" />
                      <div>
                        <p className="font-semibold">Story Generation</p>
                        <p className="text-sm text-muted-foreground">Create unlimited story chapters and text content</p>
                        <Badge className="mt-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          FREE
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Image className="w-5 h-5 text-green-600 dark:text-green-400 mt-1" />
                      <div>
                        <p className="font-semibold">Image Generation</p>
                        <p className="text-sm text-muted-foreground">Beautiful AI illustrations for your stories</p>
                        <Badge className="mt-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          FREE (Beta)
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* PAID Features */}
                <Card className="border-orange-500/30 bg-orange-500/5">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2 text-orange-600 dark:text-orange-400">
                      <CreditCard className="w-5 h-5" />
                      Premium Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Volume2 className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-1" />
                      <div>
                        <p className="font-semibold">Audio Narration</p>
                        <p className="text-sm text-muted-foreground">Professional voice narration</p>
                        <Badge className="mt-2 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                          1 credit per 100 words
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Video className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-1" />
                      <div>
                        <p className="font-semibold">Video Animation</p>
                        <p className="text-sm text-muted-foreground">8-second animated scene videos</p>
                        <Badge className="mt-2 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                          {CREDIT_COSTS.videoLong} credits per video
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Pricing Tables */}
              <div className="grid md:grid-cols-2 gap-6 mt-8">
                {/* Audio Pricing Tiers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-primary" />
                      Audio Pricing Tiers
                    </CardTitle>
                    <CardDescription>
                      Word-based pricing (rounded up to nearest 100)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {getPricingTiers().audio.map((tier, index) => (
                        <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-muted/30 border border-border/50">
                          <span className="text-sm font-medium">{tier.range}</span>
                          <Badge variant="secondary">{tier.credits} credit{tier.credits > 1 ? 's' : ''}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Video Pricing Tiers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Video className="w-5 h-5 text-primary" />
                      Video Pricing (Fixed Duration)
                    </CardTitle>
                    <CardDescription>
                      8-second video animation with Veo 3.1
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30 border border-border/50">
                        <span className="text-sm font-medium">8-second video</span>
                        <Badge variant="secondary">{CREDIT_COSTS.videoLong} credits</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <strong>Note:</strong> Video generation uses Google's Veo 3.1 model with a fixed 8-second duration for consistent quality and timing.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Example Calculations */}
              <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Calculator className="w-6 h-6 text-primary" />
                    Example: Complete Story Costs
                  </CardTitle>
                  <CardDescription>
                    See what a typical story costs with different features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Example 1: Text + Images Only */}
                    <div className="p-4 rounded-lg bg-background/60 border border-border/50">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Basic Story
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex justify-between">
                          <span>5 chapters (text)</span>
                          <Badge variant="outline" className="bg-green-500/10">FREE</Badge>
                        </li>
                        <li className="flex justify-between">
                          <span>5 images</span>
                          <Badge variant="outline" className="bg-green-500/10">FREE</Badge>
                        </li>
                        <li className="flex justify-between pt-2 border-t font-semibold">
                          <span>Total Cost</span>
                          <Badge className="bg-green-500 text-white">FREE</Badge>
                        </li>
                      </ul>
                    </div>

                    {/* Example 2: With Audio */}
                    <div className="p-4 rounded-lg bg-background/60 border border-border/50">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Volume2 className="w-4 h-4" />
                        Story + Audio
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex justify-between">
                          <span>5 chapters (text)</span>
                          <Badge variant="outline" className="bg-green-500/10">FREE</Badge>
                        </li>
                        <li className="flex justify-between">
                          <span>5 images</span>
                          <Badge variant="outline" className="bg-green-500/10">FREE</Badge>
                        </li>
                        <li className="flex justify-between">
                          <span>5 audio (150 words ea.)</span>
                          <Badge variant="outline">10cr</Badge>
                        </li>
                        <li className="flex justify-between pt-2 border-t font-semibold">
                          <span>Total Cost</span>
                          <Badge className="bg-orange-500 text-white">10 credits</Badge>
                        </li>
                      </ul>
                    </div>

                    {/* Example 3: Full Experience */}
                    <div className="p-4 rounded-lg bg-background/60 border border-primary/50 ring-2 ring-primary/20">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Premium Experience
                      </h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex justify-between">
                          <span>5 chapters (text)</span>
                          <Badge variant="outline" className="bg-green-500/10">FREE</Badge>
                        </li>
                        <li className="flex justify-between">
                          <span>5 images</span>
                          <Badge variant="outline" className="bg-green-500/10">FREE</Badge>
                        </li>
                        <li className="flex justify-between">
                          <span>5 audio (150 words ea.)</span>
                          <Badge variant="outline">10cr</Badge>
                        </li>
                        <li className="flex justify-between">
                          <span>2 animated videos</span>
                          <Badge variant="outline">24cr</Badge>
                        </li>
                        <li className="flex justify-between pt-2 border-t font-semibold">
                          <span>Total Cost</span>
                          <Badge className="bg-primary text-primary-foreground">34 credits</Badge>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Cost Breakdown Note */}
                  <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-sm text-muted-foreground">
                      <strong>💡 Pro Tip:</strong> The Starter plan (100 credits/month) can create 2-3 complete premium stories with audio narration and video animations, or 10+ basic stories with just text and images.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
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
                  variant={plan.popular ? 'default' : 'outline'}
                  size="lg"
                  className="w-full"
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
                  variant="outline"
                  size="sm"
                  className="w-full"
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