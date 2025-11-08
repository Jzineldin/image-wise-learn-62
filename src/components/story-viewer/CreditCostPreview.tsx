/**
 * Credit Cost Preview Component
 * Shows estimated credit costs before generation actions
 */

import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { calculateAudioCredits, CREDIT_COSTS } from "../../../shared/credit-costs";

interface CreditCostPreviewProps {
  type: 'audio' | 'video' | 'image' | 'story';
  wordCount?: number; // For audio generation
  duration?: number; // For video generation (optional, defaults to 8s)
  className?: string;
}

export const CreditCostPreview = ({
  type,
  wordCount = 150,
  duration = 8,
  className = ""
}: CreditCostPreviewProps) => {
  const getCostDetails = () => {
    switch (type) {
      case 'audio':
        const audioCost = calculateAudioCredits(' '.repeat(wordCount));
        return {
          cost: audioCost,
          label: `${audioCost} credit${audioCost !== 1 ? 's' : ''}`,
          details: `Based on ${wordCount} words\n(1 credit per 100 words, rounded up)`,
          isFree: false
        };
      
      case 'video':
        return {
          cost: CREDIT_COSTS.videoLong,
          label: `${CREDIT_COSTS.videoLong} credits`,
          details: `8-second video animation\n(Fixed duration with Veo 3.1)`,
          isFree: false
        };
      
      case 'image':
        return {
          cost: 0,
          label: 'FREE',
          details: 'Image generation is free during beta',
          isFree: true
        };
      
      case 'story':
        return {
          cost: 0,
          label: 'FREE',
          details: 'Story text generation is free',
          isFree: true
        };
      
      default:
        return {
          cost: 0,
          label: 'FREE',
          details: 'No cost',
          isFree: true
        };
    }
  };

  const { cost, label, details, isFree } = getCostDetails();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`inline-flex items-center gap-1 ${className}`}>
            <span className={`text-xs font-medium ${
              isFree 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-orange-600 dark:text-orange-400'
            }`}>
              {label}
            </span>
            <Info className={`w-3 h-3 ${
              isFree 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-orange-600 dark:text-orange-400'
            }`} />
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs bg-popover text-popover-foreground border shadow-md z-50"
        >
          <div className="space-y-1">
            <p className="font-semibold text-sm">
              {isFree ? '✨ Free Feature' : `💳 ${label}`}
            </p>
            <p className="text-xs whitespace-pre-line text-muted-foreground">
              {details}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/**
 * Inline cost badge for buttons
 */
interface CreditBadgeProps {
  cost: number;
  className?: string;
}

export const CreditBadge = ({ cost, className = "" }: CreditBadgeProps) => {
  if (cost === 0) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 ${className}`}>
        FREE
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 ${className}`}>
      {cost}cr
    </span>
  );
};
