/**
 * FeatureGateModal Component
 *
 * Generic gating modal for credit-based features (TTS, Animate Scene)
 * Shows cost, balance, and upgrade path when user has insufficient credits
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
import { Volume2, Sparkles, Crown, TrendingUp, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

export type FeatureType = 'tts' | 'animate' | 'video';

interface FeatureConfig {
  icon: LucideIcon;
  title: string;
  description: string;
  examples: string;
}

const FEATURE_CONFIGS: Record<FeatureType, FeatureConfig> = {
  tts: {
    icon: Volume2,
    title: 'Add AI Voice?',
    description: 'Narrate this chapter with lifelike AI voices in multiple languages.',
    examples: '~60 credits = 30 seconds of narration'
  },
  animate: {
    icon: Sparkles,
    title: 'Animate This Scene?',
    description: 'Bring your image to life with subtle animations and effects.',
    examples: '15 credits per scene (3-5 seconds)'
  },
  video: {
    icon: Zap,
    title: 'Generate Video?',
    description: 'Create a 30-second video with animations and transitions.',
    examples: '30 credits = one 30-second video'
  }
};

interface FeatureGateModalProps {
  open: boolean;
  onClose: () => void;
  feature: FeatureType;
  cost: number;
  currentBalance: number;
  isSubscriber?: boolean;
}

export const FeatureGateModal = ({
  open,
  onClose,
  feature,
  cost,
  currentBalance,
  isSubscriber = false
}: FeatureGateModalProps) => {
  const navigate = useNavigate();
  const config = FEATURE_CONFIGS[feature];
  const Icon = config.icon;
  const deficit = cost - currentBalance;
  const hasEnough = currentBalance >= cost;

  const handleUpgrade = () => {
    navigate(`/pricing?source=${feature}_gated`);
    onClose();
  };

  const handleProceed = () => {
    // This is called when user HAS enough credits
    // Parent component should handle the actual generation
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10">
            <Icon className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-center">{config.title}</DialogTitle>
          <DialogDescription className="text-center">
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Credit Status */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Cost</span>
              <span className="font-semibold">~{cost} credits</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">You have</span>
              <span className="font-semibold">{currentBalance} credits</span>
            </div>
            {deficit > 0 && (
              <div className="flex items-center justify-between text-sm pt-2 border-t">
                <span className="text-warning">Need</span>
                <span className="font-semibold text-warning">{deficit} more credits</span>
              </div>
            )}
          </div>

          {/* Educational Info */}
          {hasEnough && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <p className="text-xs text-muted-foreground text-center">
                💡 {config.examples}
              </p>
            </div>
          )}

          {/* Upgrade Benefits (only show if insufficient credits) */}
          {!hasEnough && !isSubscriber && (
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
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          {hasEnough ? (
            <>
              <Button onClick={handleProceed} className="w-full">
                Got it, Generate ({cost} credits)
              </Button>
              <Button onClick={onClose} variant="ghost" className="w-full">
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleUpgrade} className="w-full">
                <Crown className="w-4 h-4 mr-2" />
                Get Premium – 500 credits/mo
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
