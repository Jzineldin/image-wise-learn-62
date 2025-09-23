import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Trash2, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useStoryStore } from '@/stores/storyStore';
import { formatDistanceToNow } from 'date-fns';

interface StoryDraft {
  flow_data: any;
  created_at: string;
  updated_at: string;
}

interface StoryResumeCardProps {
  draft: StoryDraft;
  onResume: () => void;
  onDelete: () => void;
}

export const StoryResumeCard = ({ draft, onResume, onDelete }: StoryResumeCardProps) => {
  const { translate } = useLanguage();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  const formatStep = (step: number): string => {
    const stepNames = [
      '',
      'Age & Genre',
      'Characters', 
      'Story Ideas',
      'Review'
    ];
    return stepNames[step] || `Step ${step}`;
  };

  const getSummary = (): string => {
    const flow = draft.flow_data;
    const parts: string[] = [];
    
    if (flow.ageGroup) {
      parts.push(`Age: ${flow.ageGroup}`);
    }
    
    if (flow.genres && flow.genres.length > 0) {
      parts.push(`Genre: ${flow.genres.join(', ')}`);
    }
    
    if (flow.selectedCharacters && flow.selectedCharacters.length > 0) {
      parts.push(`${flow.selectedCharacters.length} character${flow.selectedCharacters.length === 1 ? '' : 's'}`);
    }

    return parts.join(' • ') || 'Draft in progress';
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-primary" />
            Resume Creation
          </span>
          <span className="text-xs text-muted-foreground font-normal">
            Step {draft.flow_data.step} of 4
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {formatStep(draft.flow_data.step)}
          </p>
          <p className="text-xs text-muted-foreground">
            {getSummary()}
          </p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Last saved {formatDistanceToNow(new Date(draft.updated_at), { addSuffix: true })}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onResume}
            className="flex-1"
            size="sm"
          >
            Continue Creating
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};