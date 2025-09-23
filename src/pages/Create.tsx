import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Settings, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import taleForgeLogoImage from '@/assets/tale-forge-logo.png';
import { logger, generateRequestId } from '@/lib/utils/debug';
import { AIClient, InsufficientCreditsError } from '@/lib/api/ai-client';
import CreditDisplay from '@/components/CreditDisplay';
import InsufficientCreditsDialog from '@/components/InsufficientCreditsDialog';
import { StoryCreationWizard } from '@/components/story-creation/StoryCreationWizard';
import { StoryCreationProgress } from '@/components/story-creation/StoryCreationProgress';
import { StoryResumeCard } from '@/components/story-creation/StoryResumeCard';
import { useLanguage } from '@/hooks/useLanguage';
import { useStoryStore } from '@/stores/storyStore';
import { useStoryPersistence } from '@/hooks/useStoryPersistence';

export default function CreateStoryFlow() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { translate, selectedLanguage, changeLanguage } = useLanguage();
  const [showInsufficientCredits, setShowInsufficientCredits] = useState(false);
  const [creditError, setCreditError] = useState<{ required: number; available: number } | null>(null);
  const [showResumeDraft, setShowResumeDraft] = useState(false);

  // Use centralized story state
  const {
    currentFlow: flow,
    isGenerating: generating,
    updateFlow,
    resetFlow,
    setGenerating,
    setGenerationProgress,
    setError,
    incrementRetry,
    resetRetry
  } = useStoryStore();

  // Use persistence hook
  const {
    getDraft,
    deleteDraft,
    manualSave,
    hasUnsavedChanges,
    canResume
  } = useStoryPersistence();

  // Check for existing draft on mount
  useEffect(() => {
    const checkForDraft = async () => {
      if (!user) return;
      
      const draft = await getDraft();
      if (draft && draft.flow_data.step > 1) {
        setShowResumeDraft(true);
      }
    };
    
    checkForDraft();
  }, [user, getDraft]);

  const handleResumeDraft = async () => {
    const draft = await getDraft();
    if (draft?.flow_data) {
      updateFlow(draft.flow_data);
      setShowResumeDraft(false);
      toast.success('Draft restored successfully!');
    }
  };

  const handleDeleteDraft = async () => {
    await deleteDraft();
    setShowResumeDraft(false);
    toast.success('Draft deleted');
  };

  const handleCancelGeneration = () => {
    setGenerating(false, { canCancel: false });
    setGenerationProgress({ progress: 0, currentStep: '' });
    toast.info('Story generation cancelled');
  };

  const handleRetryGeneration = () => {
    resetRetry();
    setError(null);
    generateStory();
  };

  const generateStory = async () => {
    if (!user) {
      toast.error('Please sign in to create stories');
      return;
    }

    if (!flow.selectedSeed && !flow.customSeed.trim()) {
      toast.error('Please select a story idea or write your own');
      return;
    }

    setGenerating(true, { 
      currentStep: 'Preparing your story...', 
      progress: 0,
      canCancel: true 
    });
    setError(null);

    let createdStoryId: string | null = null;
    try {
      const requestId = generateRequestId();
      const storyPrompt = flow.selectedSeed?.description || flow.customSeed;
      const storyTitle = flow.selectedSeed?.title || (selectedLanguage === 'sv' ? 'Anpassad Berättelse' : 'Custom Story');

      setGenerationProgress({ 
        progress: 10, 
        currentStep: 'Creating story structure...' 
      });

      logger.edgeFunction('generate-story', requestId, {
        ageGroup: flow.ageGroup,
        genre: flow.genres[0],
        languageCode: selectedLanguage,
        hasCharacters: flow.selectedCharacters.length > 0,
        promptLength: storyPrompt?.length || 0
      });

      // Create the story in database first
      setGenerationProgress({ 
        progress: 20, 
        currentStep: 'Saving story details...' 
      });

      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          title: storyTitle,
          description: storyPrompt,
          prompt: storyPrompt,
          age_group: flow.ageGroup,
          genre: flow.genres[0],
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

      if (storyError) throw storyError;
      if (!story) throw new Error('Failed to create story');

      createdStoryId = story.id;

      // Now generate the actual story content
      setGenerationProgress({ 
        progress: 40, 
        currentStep: 'Generating your story...' 
      });

      const { data: generationResult, error: generationError } = await supabase.functions.invoke('generate-story', {
        body: {
          storyId: story.id,
          prompt: storyPrompt,
          genre: flow.genres[0],
          ageGroup: flow.ageGroup,
          languageCode: selectedLanguage,
          isInitialGeneration: true,
          characters: flow.selectedCharacters.map(c => ({
            name: c.name,
            description: c.description,
            personality: c.personality_traits?.join(', ') || ''
          }))
        }
      });

      if (generationError) {
        console.error('Story generation failed:', generationError);
        throw new Error('Failed to generate story content');
      }

      setGenerationProgress({ 
        progress: 80, 
        currentStep: 'Finalizing your story...' 
      });

      // Verify the story has content before navigating
      const { data: storySegments } = await supabase
        .from('story_segments')
        .select('id')
        .eq('story_id', story.id)
        .eq('segment_number', 1);

      if (!storySegments || storySegments.length === 0) {
        throw new Error('Story generation completed but no content was created');
      }

      setGenerationProgress({ 
        progress: 100, 
        currentStep: 'Story created successfully!' 
      });

      await deleteDraft();
      toast.success(selectedLanguage === 'sv' ? 'Berättelse skapad!' : 'Story created successfully!');
      
      // Small delay to show completion before navigating
      setTimeout(() => {
        navigate(`/story/${story.id}`);
      }, 500);

    } catch (error) {
      logger.error('Error generating story', error);
      incrementRetry();
      setError(error instanceof Error ? error.message : 'Unknown error');

      if (error instanceof InsufficientCreditsError) {
        setCreditError({
          required: error.required,
          available: error.available
        });
        setShowInsufficientCredits(true);
        return;
      }

      toast.error(selectedLanguage === 'sv' ? 'Kunde inte skapa berättelse. Försök igen.' : 'Failed to create story. Please try again.');
    } finally {
      setGenerating(false, { canCancel: false });
    }
  };

  // Reset wizard state on mount so each visit starts fresh at Step 1
  useEffect(() => {
    if (!canResume && !showResumeDraft) {
      resetFlow();
    }
  }, [resetFlow, canResume, showResumeDraft]);

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
              {hasUnsavedChanges && flow.step > 1 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={manualSave}
                  className="flex items-center gap-2 text-orange-600 hover:text-orange-700"
                >
                  <Save className="h-4 w-4" />
                  Save Draft
                </Button>
              )}
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
          {canResume && !showResumeDraft && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              Unsaved changes
            </div>
          )}
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
      </div>
    </div>
  );
}
