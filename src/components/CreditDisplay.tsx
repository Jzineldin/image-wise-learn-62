import { useState, useEffect } from 'react';
import { Coins, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface CreditDisplayProps {
  compact?: boolean;
  showActions?: boolean;
}

const CreditDisplay = ({ compact = false, showActions = true }: CreditDisplayProps) => {
  const { user } = useAuth();
  const { createCheckout } = useSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchCredits = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('current_balance')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setCredits(data?.current_balance || 0);
    } catch (error) {
      console.error('Error fetching credits:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, [user]);

  // Listen for real-time credit updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('credit-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_credits',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setCredits(payload.new.current_balance || 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleBuyCredits = async () => {
    // Buy the most popular pack (100 credits for $9)
    const checkoutUrl = await createCheckout('price_1S6b9OK8ILu7UAIcX0c8eIpW', 'payment');
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className={`${compact ? 'flex items-center space-x-2' : ''}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-20"></div>
        </div>
      </div>
    );
  }

  const isLowCredits = credits < 5;

  if (compact) {
    return (
      <div className="flex items-center space-x-3">
        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border ${
          isLowCredits ? 'border-destructive/20 bg-destructive/5' : 'border-border bg-background'
        }`}>
          <Coins className={`w-4 h-4 ${isLowCredits ? 'text-destructive' : 'text-primary'}`} />
          <span className="font-medium">{credits}</span>
        </div>
        {showActions && isLowCredits && (
          <Button size="sm" variant="outline" onClick={handleBuyCredits}>
            <Plus className="w-3 h-3 mr-1" />
            Buy
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={isLowCredits ? 'border-destructive/20' : ''}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-full ${
              isLowCredits ? 'bg-destructive/10' : 'bg-primary/10'
            }`}>
              <Coins className={`w-6 h-6 ${isLowCredits ? 'text-destructive' : 'text-primary'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{credits} Credits</h3>
              <p className="text-sm text-muted-foreground">
                {isLowCredits ? 'Running low on credits' : 'Ready to create stories'}
              </p>
            </div>
          </div>
          
          {showActions && (
            <div className="flex space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={fetchCredits}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button 
                size="sm"
                onClick={() => navigate('/pricing')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Buy Credits
              </Button>
            </div>
          )}
        </div>

        {isLowCredits && showActions && (
          <div className="mt-4 pt-4 border-t border-destructive/10">
            <p className="text-sm text-muted-foreground mb-3">
              Get more credits to continue creating amazing stories!
            </p>
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                className="flex-1"
                onClick={handleBuyCredits}
              >
                Quick Buy - 100 Credits ($9)
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => navigate('/pricing')}
              >
                View All Packs
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CreditDisplay;