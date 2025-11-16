/**
 * Display component for chapter limits
 * Shows remaining chapters for free users, unlimited badge for paid users
 */

import { BookOpen, Crown, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useChapterLimits, formatTimeUntilReset } from '@/hooks/useChapterLimits';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface ChapterLimitDisplayProps {
  compact?: boolean;
  showUpgradeButton?: boolean;
}

export const ChapterLimitDisplay = ({ 
  compact = false, 
  showUpgradeButton = true 
}: ChapterLimitDisplayProps) => {
  const { 
    chapterStatus, 
    isPaid, 
    hoursUntilReset, 
    isLoading 
  } = useChapterLimits();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className={compact ? 'flex items-center space-x-2' : ''}>
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  // Paid users see unlimited badge
  if (isPaid) {
    if (compact) {
      return (
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5">
          <Crown className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Unlimited Chapters</span>
        </div>
      );
    }

    return (
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Premium Member</p>
              <p className="text-xs text-muted-foreground">Unlimited chapters</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Free users see chapter count
  const remaining = chapterStatus?.remaining || 0;
  const limit = chapterStatus?.limit || 4;
  const used = chapterStatus?.used || 0;

  const isLow = remaining <= 1;
  const isZero = remaining === 0;

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border ${
        isZero 
          ? 'border-destructive/20 bg-destructive/5' 
          : isLow 
          ? 'border-warning/20 bg-warning/5'
          : 'border-border bg-background'
      }`}>
        <BookOpen className={`w-4 h-4 ${
          isZero ? 'text-destructive' : isLow ? 'text-warning' : 'text-primary'
        }`} />
        <span className="font-medium text-sm">
          {remaining} {remaining === 1 ? 'chapter' : 'chapters'} remaining today
        </span>
        {isZero && (
          <Clock className="w-3 h-3 text-muted-foreground" />
        )}
      </div>
    );
  }

  return (
    <Card className={isZero ? 'border-destructive/20' : isLow ? 'border-warning/20' : ''}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              isZero ? 'bg-destructive/10' : isLow ? 'bg-warning/10' : 'bg-primary/10'
            }`}>
              <BookOpen className={`w-5 h-5 ${
                isZero ? 'text-destructive' : isLow ? 'text-warning' : 'text-primary'
              }`} />
            </div>
            <div>
              <p className="font-semibold">
                {remaining} chapter{remaining !== 1 ? 's' : ''} left today
              </p>
              <p className="text-xs text-muted-foreground">
                {used}/{limit} used • Resets in {formatTimeUntilReset(hoursUntilReset)}
              </p>
            </div>
          </div>
          {remaining <= 1 && (
            <Badge variant={isZero ? "destructive" : "outline"} className={!isZero ? "border-warning text-warning" : ""}>
              {isZero ? 'Empty' : 'Last one!'}
            </Badge>
          )}
        </div>

        {/* Warning for last chapter */}
        {remaining === 1 && (
          <Alert className="bg-warning/5 border-warning/20">
            <AlertCircle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-sm">
              This is your last chapter today! Consider ending your story here or upgrade for unlimited.
            </AlertDescription>
          </Alert>
        )}

        {/* Daily limit reached */}
        {isZero && (
          <Alert className="bg-destructive/5 border-destructive/20">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-sm">
              You've used all 4 chapters today. Resets in {formatTimeUntilReset(hoursUntilReset)}.
            </AlertDescription>
          </Alert>
        )}

        {/* Upgrade CTA */}
        {showUpgradeButton && remaining <= 1 && (
          <Button
            size="sm"
            className="w-full"
            onClick={() => navigate('/pricing')}
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade for Unlimited Chapters
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
