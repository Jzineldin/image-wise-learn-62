/**
 * Finalize Modal - 2-Step Process
 *
 * Step 1: Warning checklist showing missing assets
 * Step 2: Visibility selection (Private/Public) and feature consent
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { AlertCircle, Globe, Lock, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

interface ReadinessSummary {
  total_chapters: number;
  voices_ready: number;
  animations_ready: number;
  details_complete: number;
  missing_voices: number;
  missing_animations: number;
  incomplete_details: number;
}

interface FinalizeModalProps {
  open: boolean;
  onClose: () => void;
  storyId: string;
  readinessSummary: ReadinessSummary | null;
  onSuccess: () => void;
}

export function FinalizeModal({
  open,
  onClose,
  storyId,
  readinessSummary,
  onSuccess,
}: FinalizeModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [allowFeaturing, setAllowFeaturing] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const hasWarnings =
    readinessSummary &&
    (readinessSummary.missing_voices > 0 ||
      readinessSummary.missing_animations > 0 ||
      readinessSummary.incomplete_details > 0);

  const handleNext = () => {
    // Track analytics
    if (window.gtag) {
      window.gtag('event', 'finalize_modal_opened', {
        story_id: storyId,
        has_warnings: hasWarnings,
      });
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleFinalize = async () => {
    try {
      setFinalizing(true);

      logger.info('Finalizing story', {
        storyId,
        visibility,
        allowFeaturing,
      });

      // Call finalize function
      const { data, error } = await supabase.rpc('finalize_story', {
        story_uuid: storyId,
        p_visibility: visibility,
        p_allow_featuring: allowFeaturing,
      });

      if (error) throw error;

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to finalize story');
      }

      // Track analytics
      if (window.gtag) {
        window.gtag('event', visibility === 'private' ? 'finalize_confirmed_private' : 'finalize_confirmed_public', {
          story_id: storyId,
          version: data.version,
          allow_featuring: allowFeaturing,
        });

        if (allowFeaturing) {
          window.gtag('event', 'feature_consent_checked', {
            story_id: storyId,
          });
        }
      }

      toast({
        title: 'Story Finalized!',
        description: visibility === 'public'
          ? 'Your story is now public and visible in Discover.'
          : 'Your story has been finalized privately.',
      });

      onSuccess();
    } catch (error) {
      logger.error('Failed to finalize story', error);
      toast({
        title: 'Error',
        description: 'Failed to finalize story. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-[rgba(17,17,22,.95)] border-[rgba(242,181,68,.25)]">
        {step === 1 ? (
          // Step 1: Warning Checklist
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-heading text-[#F4E3B2]">
                Ready to Finalize?
              </DialogTitle>
              <DialogDescription className="text-[#C9C5D5]">
                Review your story's completeness before finalizing.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {hasWarnings ? (
                <>
                  <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-yellow-500 mb-2">
                          Your story isn't fully polished
                        </h4>
                        <p className="text-sm text-yellow-200/80 mb-3">
                          You can finalize now or continue adding assets per chapter.
                        </p>
                        <ul className="space-y-2 text-sm">
                          {readinessSummary && readinessSummary.missing_voices > 0 && (
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                              <span className="text-yellow-200">
                                {readinessSummary.missing_voices} chapter{readinessSummary.missing_voices > 1 ? 's' : ''} without voice
                              </span>
                            </li>
                          )}
                          {readinessSummary && readinessSummary.missing_animations > 0 && (
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                              <span className="text-yellow-200">
                                {readinessSummary.missing_animations} chapter{readinessSummary.missing_animations > 1 ? 's' : ''} without animation
                              </span>
                            </li>
                          )}
                          {readinessSummary && readinessSummary.incomplete_details > 0 && (
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                              <span className="text-yellow-200">
                                {readinessSummary.incomplete_details} chapter{readinessSummary.incomplete_details > 1 ? 's' : ''} with incomplete details
                              </span>
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-[#C9C5D5] italic">
                    💡 You can unfinalize later to add missing assets and refinalize when ready.
                  </p>
                </>
              ) : (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-green-500" />
                    <div>
                      <h4 className="font-semibold text-green-500">All Set!</h4>
                      <p className="text-sm text-green-200/80">
                        Your story has all voices, animations, and details ready.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleNext}>
                  Continue
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          // Step 2: Visibility & Consent
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-heading text-[#F4E3B2]">
                Choose Visibility
              </DialogTitle>
              <DialogDescription className="text-[#C9C5D5]">
                Decide who can see your story and whether it can be featured.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Visibility Selection */}
              <div>
                <Label className="text-[#F4E3B2] mb-3 block">Story Visibility</Label>
                <RadioGroup value={visibility} onValueChange={(v) => setVisibility(v as 'private' | 'public')}>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-4 rounded-lg bg-[rgba(17,17,22,.5)] ring-1 ring-[rgba(242,181,68,.15)] hover:ring-[rgba(242,181,68,.25)] cursor-pointer transition-all">
                      <RadioGroupItem value="private" id="private" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="private" className="cursor-pointer">
                          <div className="flex items-center gap-2 mb-1">
                            <Lock className="w-4 h-4 text-[#C9C5D5]" />
                            <span className="font-semibold text-[#F4E3B2]">Private</span>
                            <span className="text-xs text-[#C9C5D5] bg-[rgba(242,181,68,.1)] px-2 py-0.5 rounded">
                              Default
                            </span>
                          </div>
                          <p className="text-sm text-[#C9C5D5]">
                            Only you can see this story. Perfect for personal stories or works in progress.
                          </p>
                        </Label>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-4 rounded-lg bg-[rgba(17,17,22,.5)] ring-1 ring-[rgba(242,181,68,.15)] hover:ring-[rgba(242,181,68,.25)] cursor-pointer transition-all">
                      <RadioGroupItem value="public" id="public" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="public" className="cursor-pointer">
                          <div className="flex items-center gap-2 mb-1">
                            <Globe className="w-4 h-4 text-[#C9C5D5]" />
                            <span className="font-semibold text-[#F4E3B2]">Public</span>
                          </div>
                          <p className="text-sm text-[#C9C5D5]">
                            Visible to everyone in the Discover section. Share your creativity with the world!
                          </p>
                        </Label>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Feature Consent */}
              {visibility === 'public' && (
                <div className="p-4 rounded-lg bg-[rgba(242,181,68,.08)] border border-[rgba(242,181,68,.2)]">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="featuring"
                      checked={allowFeaturing}
                      onCheckedChange={(checked) => setAllowFeaturing(checked === true)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor="featuring" className="cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="font-semibold text-[#F4E3B2]">Allow Featuring</span>
                        </div>
                        <p className="text-sm text-[#C9C5D5]">
                          I consent to Tale Forge featuring this story on the homepage or in marketing materials.
                          This helps other users discover great stories!
                        </p>
                      </Label>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between gap-3 pt-4">
                <Button variant="outline" onClick={handleBack}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleFinalize}
                    disabled={finalizing}
                    className="bg-[rgba(242,181,68,.15)] text-[#F4E3B2] border-2 border-[rgba(242,181,68,.35)] hover:bg-[rgba(242,181,68,.25)]"
                  >
                    {finalizing ? (
                      <>Finalizing...</>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-1" />
                        Mark as Final
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
