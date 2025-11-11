/**
 * Modal shown when user hits daily chapter limit
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
import { Crown, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatTimeUntilReset } from '@/hooks/useChapterLimits';

interface ChapterLimitReachedModalProps {
  open: boolean;
  onClose: () => void;
  hoursUntilReset: number;
  chaptersUsed: number;
}

export const ChapterLimitReachedModal = ({
  open,
  onClose,
  hoursUntilReset,
  chaptersUsed
}: ChapterLimitReachedModalProps) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate('/pricing');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 p-3 rounded-full bg-warning/10">
            <Clock className="w-8 h-8 text-warning" />
          </div>
          <DialogTitle className="text-center">Daily Chapter Limit Reached</DialogTitle>
          <DialogDescription className="text-center">
            You've created {chaptersUsed} chapters today. Your limit will reset in{' '}
            <span className="font-semibold">{formatTimeUntilReset(hoursUntilReset)}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Stats */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Chapters today</span>
              <span className="font-semibold">{chaptersUsed}/4</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Resets in</span>
              <span className="font-semibold">{formatTimeUntilReset(hoursUntilReset)}</span>
            </div>
          </div>

          {/* Upgrade benefits */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-2">
              <Crown className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">Upgrade to Premium</h4>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-success" />
                <span>Unlimited story chapters per day</span>
              </li>
              <li className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-success" />
                <span>100-300 credits for TTS & Video</span>
              </li>
              <li className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-success" />
                <span>Unlimited active stories</span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button onClick={handleUpgrade} className="w-full">
            <Crown className="w-4 h-4 mr-2" />
            View Pricing Plans
          </Button>
          <Button onClick={onClose} variant="outline" className="w-full">
            Come Back Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
