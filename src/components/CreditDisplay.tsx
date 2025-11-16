import { useState, useEffect, useCallback } from 'react';
import { Coins, Plus, RefreshCw, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/production-logger';
import FounderBadge from './FounderBadge';
import { useChapterLimits } from '@/hooks/useChapterLimits';
import { useQuotas } from '@/hooks/useQuotas';

interface CreditDisplayProps {
  compact?: boolean;
  showActions?: boolean;
}

interface UserProfile {
  is_beta_user?: boolean;
  beta_joined_at?: string | null;
  founder_status?: string | null;
}

const CreditDisplay = ({ compact = false, showActions = true }: CreditDisplayProps) => {
  const { user } = useAuth();
  const { createCheckout, tier } = useSubscription();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Use the new unified quotas hook
  const { creditBalance, chaptersRemaining, isSubscriber, isLoading, refetch } = useQuotas();

  // Keep chapter limits hook for compatibility
  const { chapterStatus, isPaid, isLoading: isLoadingChapters } = useChapterLimits();

  // Fetch user profile for beta status
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('is_beta_user, beta_joined_at, founder_status')
          .eq('id', user.id)
          .single();

        if (!profileError && profileData) {
          setUserProfile(profileData);
        }
      } catch (error) {
        logger.error('Error fetching profile', error, { component: 'CreditDisplay' });
      }
    };

    fetchProfile();
  }, [user?.id]);

  // Alias for backwards compatibility
  const credits = creditBalance;
  const fetchCredits = refetch;

  const handleBuyCredits = async () => {
    // Buy the most popular pack (100 credits for $9)
    const checkoutUrl = await createCheckout('price_1S0fYYDSKngmC6wH5OSPOwNC', 'payment');
    if (checkoutUrl) {
      window.open(checkoutUrl, '_blank');
    }
  };

  if (isLoading || isLoadingChapters) {
    return (
      <div className={`${compact ? 'flex items-center space-x-2' : ''}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-20"></div>
        </div>
      </div>
    );
  }

  const isLowCredits = credits < 5;
  // Use chaptersRemaining from useQuotas if available, fallback to chapterStatus
  const remaining = chaptersRemaining !== null ? chaptersRemaining : (chapterStatus?.remaining || 0);

  if (compact) {
    return (
      <div className="flex items-center space-x-3">
        {/* Founder Badge */}
        {userProfile && (userProfile.is_beta_user || userProfile.founder_status) && (
          <FounderBadge
            founderStatus={userProfile.founder_status}
            isBetaUser={userProfile.is_beta_user}
            betaJoinedAt={userProfile.beta_joined_at}
            size="sm"
          />
        )}

        {/* Show BOTH chapters AND credits for free users */}
        {!isPaid ? (
          <>
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border ${
              remaining === 0 ? 'border-destructive/20 bg-destructive/5' :
              remaining === 1 ? 'border-warning/20 bg-warning/5' :
              'border-border bg-background'
            }`}>
              <BookOpen className={`w-4 h-4 ${
                remaining === 0 ? 'text-destructive' :
                remaining === 1 ? 'text-warning' :
                'text-primary'
              }`} />
              <span className="font-medium text-sm">{remaining}/4 chapters</span>
            </div>
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border ${
              isLowCredits ? 'border-destructive/20 bg-destructive/5' : 'border-border bg-background'
            }`}>
              <Coins className={`w-4 h-4 ${isLowCredits ? 'text-destructive' : 'text-primary'}`} />
              <span className="font-medium text-sm">{credits} credits</span>
            </div>
          </>
        ) : (
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border ${
            isLowCredits ? 'border-destructive/20 bg-destructive/5' : 'border-border bg-background'
          }`}>
            <Coins className={`w-4 h-4 ${isLowCredits ? 'text-destructive' : 'text-primary'}`} />
            <span className="font-medium">{credits} credits</span>
            <span className="text-xs text-muted-foreground">(TTS/Video)</span>
          </div>
        )}
        
        {showActions && ((isPaid && isLowCredits) || (!isPaid && remaining === 0)) && (
          <Button size="sm" variant="outline" onClick={() => navigate('/pricing')}>
            <Plus className="w-3 h-3 mr-1" />
            {isPaid ? 'Buy' : 'Upgrade'}
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={isLowCredits || (!isPaid && remaining === 0) ? 'border-destructive/20' : ''}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-full ${
              isLowCredits || (!isPaid && remaining === 0) ? 'bg-destructive/10' : 'bg-primary/10'
            }`}>
              {!isPaid ? (
                <BookOpen className={`w-6 h-6 ${remaining === 0 ? 'text-destructive' : 'text-primary'}`} />
              ) : (
                <Coins className={`w-6 h-6 ${isLowCredits ? 'text-destructive' : 'text-primary'}`} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">
                  {!isPaid 
                    ? `${remaining}/4 Chapters Today` 
                    : `${credits} Credits`
                  }
                </h3>
                {/* Founder Badge */}
                {userProfile && (userProfile.is_beta_user || userProfile.founder_status) && (
                  <FounderBadge
                    founderStatus={userProfile.founder_status}
                    isBetaUser={userProfile.is_beta_user}
                    betaJoinedAt={userProfile.beta_joined_at}
                    size="sm"
                  />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {!isPaid 
                  ? remaining === 0 
                    ? 'Daily limit reached' 
                    : 'Free chapters remaining'
                  : isLowCredits 
                    ? 'Running low on credits' 
                    : 'For TTS & Video generation'
                }
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

        {showActions && ((isPaid && isLowCredits) || (!isPaid && remaining <= 1)) && (
          <div className="mt-4 pt-4 border-t border-destructive/10">
            <p className="text-sm text-muted-foreground mb-3">
              {!isPaid 
                ? 'Upgrade to get unlimited chapters every day plus credits for TTS & Video!' 
                : 'Get more credits to continue using premium features!'
              }
            </p>
            <div className="flex space-x-2">
              {isPaid ? (
                <>
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
                </>
              ) : (
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate('/pricing')}
                >
                  Upgrade for Unlimited Chapters
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CreditDisplay;
