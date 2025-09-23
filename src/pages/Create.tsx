import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import taleForgeLogoImage from '@/assets/tale-forge-logo.png';
import { logger, generateRequestId } from '@/lib/utils/debug';
import { AIClient, InsufficientCreditsError } from '@/lib/api/ai-client';
import CreditDisplay from '@/components/CreditDisplay';
import InsufficientCreditsDialog from '@/components/InsufficientCreditsDialog';
import { StoryCreationWizard } from '@/components/story-creation/StoryCreationWizard';
import { StoryGenerationProgress } from '@/components/story-creation/StoryGenerationProgress';
import { ErrorRecoveryDialog } from '@/components/story-creation/ErrorRecoveryDialog';
import { useLanguage } from '@/hooks/useLanguage';
import { useStoryStore } from '@/stores/storyStore';

export default function CreateStoryFlow() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { translate, selectedLanguage, changeLanguage } = useLanguage();
  const [showInsufficientCredits, setShowInsufficientCredits] = useState(false);
  const [creditError, setCreditError] = useState<{ required: number; available: number } | null>(null);

  // Use centralized story state
  const {
    currentFlow: flow,
    isGenerating: generating,
    generationProgress,
    generationError,
    canCancelGeneration,
    updateFlow,
    resetFlow,
    setGenerating,
    setGenerationProgress,
    setGenerationError,
    setCanCancelGeneration
  } = useStoryStore();

  // Additional state for dialogs
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [cancelRequested, setCancelRequested] = useState(false);

  const generateStory = async () => {
    // Reset states
    setGenerationError(null);
    setGenerationProgress(0);
    setCancelRequested(false);
    setShowProgressDialog(true);
    setCanCancelGeneration(true);
    if (!user) {
      toast.error('Please sign in to create stories');
      return;
    }

    if (!flow.selectedSeed && !flow.customSeed.trim()) {
      toast.error('Please select a story idea or write your own');
      return;
    }

    setGenerating(true);
    setGenerationProgress(10);

    let createdStoryId: string | null = null;
    try {
      // Check for cancellation
      if (cancelRequested) throw new Error('Generation cancelled by user');
      const requestId = generateRequestId();
      const storyPrompt = flow.selectedSeed?.description || flow.customSeed;
      const storyTitle = flow.selectedSeed?.title || (selectedLanguage === 'sv' ? 'Anpassad Berättelse' : 'Custom Story');

      logger.edgeFunction('generate-story', requestId, {
        ageGroup: flow.ageGroup,
        genre: flow.genres[0],
        languageCode: selectedLanguage,
        hasCharacters: flow.selectedCharacters.length > 0,
        promptLength: storyPrompt?.length || 0
      });

      // Create the story in database first
      setGenerationProgress(25);
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          title: storyTitle,
          description: storyPrompt,
          prompt: storyPrompt,
          age_group: flow.ageGroup,
          genre: flow.genres[0], // Primary genre
          language_code: selectedLanguage,
          original_language_code: selectedLanguage,
          status: 'generating',
          user_id: user.id,
          metadata: {
            genres: flow.genres,
            characters: flow.selectedCharacters.map(c => ({
              id: c.id,
              name: c.name,
              description: c.description
            })),
            selectedSeed: flow.selectedSeed,
            customSeed: flow.customSeed,
            step: flow.step
          } as any
        })
        .select()
        .single();

      if (story) {
        createdStoryId = story.id;
      }

      if (storyError) throw storyError;

      // Check for cancellation before continuing
      if (cancelRequested) throw new Error('Generation cancelled by user');

      // Increment usage count for selected characters
      for (const character of flow.selectedCharacters) {
        await supabase
          .from('user_characters')
          .update({ usage_count: character.usage_count + 1 })
          .eq('id', character.id);
      }

      // Generate the first story segment using unified AI client
      setGenerationProgress(50);
      setCanCancelGeneration(false); // Cannot cancel during AI generation
      const generationResult = await AIClient.generateStory({
        prompt: storyPrompt,
        genre: flow.genres[0],
        ageGroup: flow.ageGroup,
        storyId: story.id,
        languageCode: selectedLanguage,
        isInitialGeneration: true,
        characters: flow.selectedCharacters.map(c => ({
          name: c.name,
          description: c.description,
          personality: c.personality_traits.join(', ')
        }))
      });

      logger.edgeFunctionResponse('generate-story', requestId, generationResult);

      // Save generated segments to database
      setGenerationProgress(75);
      let insertedSegments: any[] = [];
      if (generationResult?.data?.segments && generationResult.data.segments.length > 0) {
        const segmentsToInsert = generationResult.data.segments.map((segment: any, index: number) => ({
          story_id: story.id,
          segment_number: index + 1,
          content: segment.content || segment.text || '',
          choices: Array.isArray(segment.choices) ? segment.choices : [],
          is_ending: (segment.isEnding ?? segment.is_ending ?? false),
          image_prompt: segment.imagePrompt
        }));

        const { data: inserted, error: segmentsError } = await supabase
          .from('story_segments')
          .insert(segmentsToInsert)
          .select('id, segment_number, content');

        if (segmentsError) {
          logger.error('Error saving segments', segmentsError);
          throw new Error('Failed to save story segments');
        }
        insertedSegments = inserted || [];
      }

      // Update story with generated title and status
      const storyUpdates: any = {
        status: 'draft'
      };

      if (generationResult?.data?.title) {
        storyUpdates.title = generationResult.data.title;
      }

      await supabase
        .from('stories')
        .update(storyUpdates)
        .eq('id', story.id);

      setGenerationProgress(90);

      // Auto-generate an image for the first segment (non-blocking UX)
      try {
        const firstInserted = (insertedSegments || []).sort((a: any, b: any) => a.segment_number - b.segment_number)[0];
        if (firstInserted) {
          // Build characters payload similar to story generation
          const charactersPayload = flow.selectedCharacters.map(c => ({
            name: c.name,
            description: c.description,
            personality: (c.personality_traits || []).join(', ')
          }));

          // Fire-and-forget; we don't block navigation
          AIClient.generateStoryImage({
            storyContent: firstInserted.content || storyPrompt || '',
            storyTitle: generationResult?.data?.title || storyTitle,
            ageGroup: flow.ageGroup,
            genre: flow.genres[0],
            segmentNumber: firstInserted.segment_number,
            storyId: story.id,
            segmentId: firstInserted.id,
            characters: charactersPayload,
            requestId
          }).catch((err) => {
            logger.error('Initial image generation failed (non-blocking)', err, { storyId: story.id, segmentId: firstInserted.id });
          });
        }
      } catch (e) {
        logger.error('Failed to schedule initial image generation', e);
      }

      setGenerationProgress(100);
      
      // Small delay to show completion
      setTimeout(() => {
        setShowProgressDialog(false);
        toast.success(selectedLanguage === 'sv' ? 'Berättelse skapad!' : 'Story created successfully!');
        navigate(`/story/${story.id}`);
      }, 1000);

    } catch (error) {
      logger.error('Error generating story', error);

      // Handle specific AI client errors
      if (error instanceof InsufficientCreditsError) {
        setShowProgressDialog(false);
        setCreditError({
          required: error.required,
          available: error.available
        });
        setShowInsufficientCredits(true);
        return;
      }

      // Handle auth errors
      if ((error as any).code === 'AUTH_REQUIRED') {
        setShowProgressDialog(false);
        toast.error('Please sign in to create stories');
        navigate('/auth');
        return;
      }

      // Handle cancellation
      if (error instanceof Error && error.message.includes('cancelled')) {
        setShowProgressDialog(false);
        toast.info('Story generation was cancelled');
        return;
      }

      // Mark story as failed if it was created
      if (createdStoryId) {
        await supabase
          .from('stories')
          .update({ status: 'failed' })
          .eq('id', createdStoryId);
      }

      // Show error recovery dialog
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setGenerationError(errorMessage);
      setShowProgressDialog(false);
      setShowErrorDialog(true);
    } finally {
      setGenerating(false);
      setCanCancelGeneration(false);
    }
  };

  const handleCancelGeneration = () => {
    setCancelRequested(true);
    setCanCancelGeneration(false);
    toast.info('Cancelling story generation...');
  };

  const handleRetryGeneration = () => {
    setIsRetrying(true);
    setShowErrorDialog(false);
    generateStory().finally(() => setIsRetrying(false));
  };

  // Reset wizard state on mount so each visit starts fresh at Step 1
  useEffect(() => {
    resetFlow();
  }, [resetFlow]);

  return (
    <div className="min-h-screen">
      {/* Navigation Header */}
      <nav className="glass-card border-b border-primary/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <img
                src={taleForgeLogoImage}
                alt="Tale Forge Logo"
                className="w-10 h-10 object-contain"
              />
              <span className="text-2xl font-heading font-bold text-gradient">Tale Forge</span>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              <Link to="/dashboard" className="text-text-secondary hover:text-primary transition-colors story-link text-with-shadow flex items-center gap-2">
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
              <Link to="/discover" className="text-text-secondary hover:text-primary transition-colors story-link text-with-shadow">
                Discover
              </Link>
              <Link to="/characters" className="text-text-secondary hover:text-primary transition-colors story-link text-with-shadow">
                Characters
              </Link>
              <Link to="/my-stories" className="text-text-secondary hover:text-primary transition-colors story-link text-with-shadow">
                My Stories
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <CreditDisplay compact />
              <Link to="/settings">
                <Button variant="outline" className="btn-secondary flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{translate('storyCreation.title')}</h1>
            <p className="text-muted-foreground">
              {selectedLanguage === 'sv' ? 'Låt oss bygga en fantastisk interaktiv berättelse tillsammans!' : 'Let\'s build an amazing interactive story together!'}
            </p>
          </div>
        </div>

        {/* Story Creation Wizard */}
        <StoryCreationWizard
          onCreateStory={generateStory}
          selectedLanguage={selectedLanguage}
          onLanguageChange={changeLanguage}
        />

        <InsufficientCreditsDialog
          open={showInsufficientCredits}
          onOpenChange={setShowInsufficientCredits}
          requiredCredits={creditError?.required || 0}
          availableCredits={creditError?.available || 0}
          operation="create a story"
        />

        <StoryGenerationProgress
          open={showProgressDialog}
          onOpenChange={setShowProgressDialog}
          onCancel={canCancelGeneration ? handleCancelGeneration : undefined}
          error={generationError}
        />

        <ErrorRecoveryDialog
          open={showErrorDialog}
          onOpenChange={setShowErrorDialog}
          onRetry={handleRetryGeneration}
          error={generationError || ''}
          isRetrying={isRetrying}
        />
      </div>
    </div>
  );
}