import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, Volume2, Image, FileText, Zap } from 'lucide-react';

interface CreditCostDisplayProps {
  operation: 'story' | 'segment' | 'audio' | 'image';
  wordCount?: number;
  compact?: boolean;
  className?: string;
}

const CREDIT_COSTS = {
  story: 2,
  segment: 1,
  image: 1,
  audioBase: 1, // per 100 words
};

const calculateAudioCredits = (wordCount: number = 0): number => {
  return Math.ceil(wordCount / 100);
};

const getOperationDetails = (operation: string, wordCount: number = 0) => {
  switch (operation) {
    case 'story':
      return {
        label: 'Story Generation',
        icon: FileText,
        cost: CREDIT_COSTS.story,
        description: 'Generate a new story with first chapter'
      };
    case 'segment':
      return {
        label: 'Story Chapter',
        icon: Zap,
        cost: CREDIT_COSTS.segment,
        description: 'Generate next story chapter'
      };
    case 'audio': {
      const normalizedWordCount = Math.max(0, wordCount);
      const blocksOfHundred = Math.max(1, Math.ceil(normalizedWordCount / 100));
      return {
        label: 'Voice Narration',
        icon: Volume2,
        cost: blocksOfHundred,
        description: `Generate audio (${blocksOfHundred} x 100 words)`
      };
    }

    case 'image':
      return {
        label: 'AI Illustration',
        icon: Image,
        cost: CREDIT_COSTS.image,
        description: 'Generate story illustration'
      };
    default:
      return {
        label: 'Operation',
        icon: Coins,
        cost: 1,
        description: 'AI operation'
      };
  }
};

export const CreditCostDisplay: React.FC<CreditCostDisplayProps> = ({
  operation,
  wordCount,
  compact = false,
  className = ''
}) => {
  const details = getOperationDetails(operation, wordCount);
  const Icon = details.icon;

  if (compact) {
    return (
      <Badge variant="secondary" className={`flex items-center gap-1 ${className}`}>
        <Coins className="h-3 w-3" />
        {details.cost}
      </Badge>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-primary" />
            <div>
              <div className="font-medium">{details.label}</div>
              <div className="text-sm text-muted-foreground">{details.description}</div>
            </div>
          </div>
          <Badge variant="default" className="flex items-center gap-1">
            <Coins className="h-4 w-4" />
            {details.cost}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreditCostDisplay;
