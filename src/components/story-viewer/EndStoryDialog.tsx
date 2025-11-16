/**
 * EndStoryDialog Component
 * Confirmation dialog for generating story ending
 */

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
import { Sparkles } from 'lucide-react';

interface EndStoryDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  hasExistingEnding: boolean;
}

export function EndStoryDialog({ open, onConfirm, onCancel, hasExistingEnding }: EndStoryDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <AlertDialogTitle className="text-2xl">
              {hasExistingEnding ? 'Finish Your Story?' : 'End Your Story?'}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base space-y-3">
            {hasExistingEnding ? (
              <>
                <p>
                  Your story has a final segment ready. Once you finish, your story will be marked as complete and
                  become read-only.
                </p>
                <p className="font-medium">
                  You can still generate image and audio for the ending segment before finishing if needed.
                </p>
              </>
            ) : (
              <>
                <p>
                  This will generate a final segment to conclude your adventure. Our AI will craft a satisfying
                  ending based on your story so far.
                </p>
                <p className="font-medium text-amber-600 dark:text-amber-400">
                  After the ending is generated, you'll be able to add image and audio before finalizing.
                </p>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          >
            {hasExistingEnding ? 'Finish Story' : 'Generate Ending'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
