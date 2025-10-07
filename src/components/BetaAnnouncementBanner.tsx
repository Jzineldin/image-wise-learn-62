import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Crown, X, Sparkles, Clock, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLiveStats } from '@/hooks/useLiveStats';

const BetaAnnouncementBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const { stats, isLoading } = useLiveStats();

  // Check if user has dismissed the banner
  useEffect(() => {
    const dismissed = localStorage.getItem('beta-banner-dismissed');
    if (dismissed) {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('beta-banner-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="relative bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-orange-500/10 border-b border-yellow-500/20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left: Icon + Message */}
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-500/20 border border-yellow-500/30 animate-pulse">
              <Crown className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  🎉 Beta Launch - Limited Time Only!
                  <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                  First 1,000 users
                </span>{' '}
                get <strong>Founder status</strong> + <strong>100 FREE credits</strong> (10x normal!)
                {' • '}
                <span className="inline-flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <strong>{isLoading ? '...' : stats.founderCount}</strong> founders joined
                </span>
                {' • '}
                <span className="inline-flex items-center gap-1 text-red-500 dark:text-red-400">
                  <Clock className="w-3 h-3 animate-pulse" />
                  <strong>{1000 - (isLoading ? 8 : stats.founderCount)} spots left</strong>
                </span>
              </p>
            </div>
          </div>

          {/* Right: CTA + Close */}
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button className="btn-primary gap-2 shadow-lg hover:shadow-xl">
                <Crown className="w-4 h-4" />
                Claim Founder Status
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="hover:bg-yellow-500/10"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BetaAnnouncementBanner;

