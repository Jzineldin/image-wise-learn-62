/**
 * VideoGateModal Component
 *
 * Shown when non-subscribers attempt to generate video without sufficient credits
 * Replaces the "infinite spinner" with clear gating and upgrade path
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Film, Crown, Sparkles, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { calculateVideoCredits } from '../../../shared/credit-costs';

interface VideoGateModalProps {
  open: boolean;
  onClose: () => void;
  currentBalance: number;
  isSubscriber?: boolean;
}

export const VideoGateModal = ({
  open,
  onClose,
  currentBalance,
  isSubscriber = false
}: VideoGateModalProps) => {
  const navigate = useNavigate();
  const videoCost = calculateVideoCredits(); // 30 credits

  const handleUpgrade = () => {
    navigate('/pricing?source=video_gated');
    onClose();
  };

  const deficit = videoCost - currentBalance;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10">
            <Film className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-center">
            {isSubscriber ? 'Monthly Credits Used' : 'Animate This Scene?'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isSubscriber ? (
              <>
                You've used your monthly credits. They'll reset on your next billing date.
              </>
            ) : (
              <>
                Turn your chapter into a 30-second video with smooth animations and transitions.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Credit Status */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Cost</span>
              <span className="font-semibold">{videoCost} credits</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">You have</span>
              <span className="font-semibold">{currentBalance} credits</span>
            </div>
            {!isSubscriber && deficit > 0 && (
              <div className="flex items-center justify-between text-sm pt-2 border-t">
                <span className="text-warning">Need</span>
                <span className="font-semibold text-warning">{deficit} more credits</span>
              </div>
            )}
          </div>

          {/* Upgrade Benefits */}
          {!isSubscriber && (
            <div className="border border-primary/20 rounded-lg p-4 space-y-3 bg-gradient-to-br from-primary/5 to-transparent">
              <div className="flex items-center space-x-2">
                <Crown className="w-5 h-5 text-primary" />
                <h4 className="font-semibold">Upgrade to Premium</h4>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>500 credits every month</span>
                </li>
                <li className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span>Unlimited story chapters</span>
                </li>
                <li className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span>Priority generation queue</span>
                </li>
              </ul>
              <div className="text-xs text-muted-foreground pt-2 border-t">
                500 credits = ~16 videos/month or 4+ minutes of AI voice
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          {isSubscriber ? (
            <>
              <Button onClick={onClose} variant="outline" className="w-full">
                Got It
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleUpgrade} className="w-full">
                <Crown className="w-4 h-4 mr-2" />
                Start Free Trial – $9.99/mo
              </Button>
              <Button onClick={onClose} variant="ghost" className="w-full">
                Maybe Later
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
