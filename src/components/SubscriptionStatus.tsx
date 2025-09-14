import { Crown, Sparkles, Zap, CreditCard, Settings, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';

interface SubscriptionStatusProps {
  showActions?: boolean;
  compact?: boolean;
}

const SubscriptionStatus = ({ showActions = true, compact = false }: SubscriptionStatusProps) => {
  const { 
    tier, 
    subscribed, 
    subscription_end, 
    credits_per_month, 
    loading, 
    openCustomerPortal 
  } = useSubscription();
  const navigate = useNavigate();

  const getTierInfo = (tier: string) => {
    switch (tier) {
      case 'free':
        return {
          name: 'Free',
          icon: <Sparkles className="w-5 h-5" />,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted/50',
          description: 'Perfect for getting started'
        };
      case 'starter':
        return {
          name: 'Starter',
          icon: <Crown className="w-5 h-5" />,
          color: 'text-primary',
          bgColor: 'bg-primary/10',
          description: 'For dedicated storytellers'
        };
      case 'premium':
        return {
          name: 'Premium',
          icon: <Zap className="w-5 h-5" />,
          color: 'text-accent-foreground',
          bgColor: 'bg-accent/20',
          description: 'Best value for creators'
        };
      default:
        return {
          name: 'Free',
          icon: <Sparkles className="w-5 h-5" />,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted/50',
          description: 'Perfect for getting started'
        };
    }
  };

  const tierInfo = getTierInfo(tier);

  if (loading && !compact) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-8 bg-muted rounded w-2/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-full ${tierInfo.bgColor}`}>
          <div className={tierInfo.color}>
            {tierInfo.icon}
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">{tierInfo.name} Plan</span>
            {subscribed && <Badge variant="secondary">Active</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            {credits_per_month} credits/month
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-full ${tierInfo.bgColor}`}>
              <div className={tierInfo.color}>
                {tierInfo.icon}
              </div>
            </div>
            <div>
              <CardTitle className="flex items-center space-x-2">
                <span>{tierInfo.name} Plan</span>
                {subscribed && <Badge variant="secondary">Active</Badge>}
              </CardTitle>
              <CardDescription>{tierInfo.description}</CardDescription>
            </div>
          </div>
          {showActions && (
            <div className="flex space-x-2">
              {subscribed && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={openCustomerPortal}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Manage
                </Button>
              )}
              {tier === 'free' && (
                <Button 
                  size="sm"
                  onClick={() => navigate('/pricing')}
                >
                  Upgrade
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Monthly Credits</span>
            </div>
            <span className="font-medium">{credits_per_month}</span>
          </div>
          
          {subscription_end && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Next Billing</span>
              <span className="text-sm">
                {new Date(subscription_end).toLocaleDateString()}
              </span>
            </div>
          )}

          {tier === 'free' && showActions && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">
                Upgrade to unlock more stories, priority generation, and premium features.
              </p>
              <Button 
                className="w-full"
                onClick={() => navigate('/pricing')}
              >
                View Pricing
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatus;