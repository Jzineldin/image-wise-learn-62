/**
 * Unfinalize Dialog
 *
 * Confirmation dialog for moving a finalized story back to "ready" state
 * Allows users to reopen for editing and refinalize when complete
 */

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { Loader2, Unlock } from 'lucide-react';

interface UnfinalizeDialogProps {
  open: boolean;
  onClose: () => void;
  storyId: string;
  storyTitle: string;
  currentVersion: number;
  onSuccess: () => void;
}

export function UnfinalizeDialog({
  open,
  onClose,
  storyId,
  storyTitle,
  currentVersion,
  onSuccess,
}: UnfinalizeDialogProps) {
  const { toast } = useToast();
  const [unfinalizing, setUnfinalizing] = useState(false);

  const handleUnfinalize = async () => {
    try {
      setUnfinalizing(true);

      logger.info('Unfinalizing story', {
        storyId,
        currentVersion,
      });

      // Call unfinalize function
      const { data, error } = await supabase.rpc('unfinalize_story', {
        story_uuid: storyId,
      });

      if (error) throw error;

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to unfinalize story');
      }

      // Track analytics
      if (window.gtag) {
        window.gtag('event', 'unfinalize_confirmed', {
          story_id: storyId,
          version: currentVersion,
        });
      }

      toast({
        title: 'Story Reopened!',
        description: 'You can now edit and manage assets. Refinalize when ready.',
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      logger.error('Failed to unfinalize story', error);

      toast({
        title: 'Error',
        description: error.message || 'Failed to unfinalize story. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUnfinalizing(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="bg-[rgba(17,17,22,.95)] border-[rgba(242,181,68,.25)]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-heading text-[#F4E3B2] flex items-center gap-2">
            <Unlock className="w-6 h-6" />
            Reopen Story for Edits?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[#C9C5D5]">
            This will move "<span className="font-semibold text-[#F4E3B2]">{storyTitle}</span>" back to the Ready state.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 rounded-lg bg-[rgba(242,181,68,.08)] border border-[rgba(242,181,68,.2)]">
            <h4 className="font-semibold text-[#F4E3B2] mb-2">What happens when you unfinalize:</h4>
            <ul className="space-y-2 text-sm text-[#C9C5D5]">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Story returns to <span className="font-semibold text-[#F4E3B2]">Ready</span> state</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>You can add/edit voices, animations, and chapter details</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Story becomes <span className="font-semibold text-[#F4E3B2]">private</span> until you refinalize</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Version number stays <span className="font-semibold text-[#F4E3B2]">v{currentVersion}</span> (will increment on refinalize)</span>
              </li>
            </ul>
          </div>

          <p className="text-sm text-[#C9C5D5] italic text-center">
            💡 You can refinalize anytime when you're satisfied with your edits.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={unfinalizing}
            className="bg-transparent border-[rgba(242,181,68,.25)] text-[#F4E3B2] hover:bg-[rgba(242,181,68,.1)]"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleUnfinalize}
            disabled={unfinalizing}
            className="bg-[rgba(242,181,68,.15)] text-[#F4E3B2] border-2 border-[rgba(242,181,68,.35)] hover:bg-[rgba(242,181,68,.25)]"
          >
            {unfinalizing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Reopening...
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4 mr-2" />
                Reopen for Edits
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
