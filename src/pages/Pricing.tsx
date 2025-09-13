import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, Crown, Zap } from 'lucide-react';

const Pricing = () => {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      icon: <Sparkles className="w-8 h-8" />,
      description: "Perfect for getting started",
      features: [
        "5 stories per month",
        "Basic AI generation",
        "Community access",
        "Standard support"
      ],
      buttonText: "Get Started Free",
      popular: false
    },
    {
      name: "Creator",
      price: "$9.99",
      period: "per month",
      icon: <Crown className="w-8 h-8" />,
      description: "For dedicated storytellers",
      features: [
        "50 stories per month",
        "Advanced AI generation", 
        "Voice narration",
        "Priority support",
        "Custom characters",
        "Story analytics"
      ],
      buttonText: "Start Creating",
      popular: true
    },
    {
      name: "Pro",
      price: "$24.99",
      period: "per month",
      icon: <Zap className="w-8 h-8" />,
      description: "For professional creators",
      features: [
        "Unlimited stories",
        "Premium AI features",
        "Commercial use license",
        "24/7 priority support",
        "Advanced analytics",
        "Team collaboration",
        "Custom branding"
      ],
      buttonText: "Go Professional",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-gradient mb-6">
            Choose Your Plan
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Select the perfect plan for your storytelling journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`glass-card-elevated p-8 relative ${
                plan.popular ? 'ring-2 ring-primary glow-strong' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-white px-4 py-2 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
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
              >
                {plan.buttonText}
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
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