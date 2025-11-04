/**
 * Simple Story Creation Page
 *
 * Based on copy-of-tale-forge design:
 * - Single-page form instead of multi-step wizard
 * - Quick Start + Story Wizard modes
 * - Child name personalization
 * - Streamlined user experience
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AIClient, InsufficientCreditsError } from '@/lib/api/ai-client';
import CreditDisplay from '@/components/CreditDisplay';
import InsufficientCreditsDialog from '@/components/InsufficientCreditsDialog';
import { SimpleStoryForm } from '@/components/story-creation/SimpleStoryForm';
import { StoryGenerationProgress } from '@/components/story-creation/StoryGenerationProgress';
import { logger, generateRequestId } from '@/lib/utils/debug';
import { normalizeAgeGroup, toDatabaseFormat } from '@/lib/utils/age-group';

interface StoryFormData {
  childName: string;
  character: string;
  genre: string;
  ageGroup?: string;
  traits?: string;
  customPrompt?: string;
}

export default function CreateSimple() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showInsufficientCredits, setShowInsufficientCredits] = useState(false);
  const [creditError, setCreditError] = useState<{ required: number; available: number } | null>(null);

  const handleFormSubmit = async (formData: StoryFormData) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to create stories',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(10);

    let createdStoryId: string | null = null;

    try {
      const requestId = generateRequestId();

      // Build story prompt from form data
      const storyPrompt = formData.customPrompt ||
        `Create a ${formData.genre} story about ${formData.character}${formData.traits ? ` who is ${formData.traits}` : ''}.`;

      logger.edgeFunction('generate-story', requestId, {
        childName: formData.childName,
        ageGroup: formData.ageGroup || '7-9 years old',
        genre: formData.genre,
        character: formData.character,
      });

      // Create story record in database
      setGenerationProgress(25);
      const ageGroup = toDatabaseFormat(formData.ageGroup); // Database uses full format
      const normalizedAgeGroup = normalizeAgeGroup(formData.ageGroup); // Backend uses short format

      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          title: `${formData.character}'s Adventure`,
          description: storyPrompt,
          prompt: storyPrompt,
          age_group: ageGroup, // Database uses full format: "7-9 years old"
          genre: formData.genre,
          language_code: 'en',
          original_language_code: 'en',
          status: 'generating',
          user_id: user.id,
          metadata: {
            childName: formData.childName,
            character: formData.character,
            traits: formData.traits,
            customPrompt: formData.customPrompt,
          },
        })
        .select()
        .single();

      if (storyError) throw storyError;
      if (!story) throw new Error('Failed to create story record');

      createdStoryId = story.id;
      setGenerationProgress(40);

      // Generate story using AI
      logger.info('Generating story with form data', {
        storyId: story.id,
        childName: formData.childName,
        character: formData.character,
        genre: formData.genre,
        ageGroup: normalizedAgeGroup,
      });

      const generationResult = await AIClient.generateStory({
        prompt: storyPrompt,
        genre: formData.genre,
        ageGroup: normalizedAgeGroup, // Backend expects short format: "7-9", "10-12", etc.
        storyId: story.id,
        languageCode: 'en',
        isInitialGeneration: true,
        characters: [{
          name: formData.character,
          description: formData.character,
          personality: formData.traits || '',
        }],
      });

      setGenerationProgress(90);

      if (!generationResult.success || !generationResult.data) {
        throw new Error('Story generation failed');
      }

      const firstSegment = generationResult.data.segments?.[0];
      if (!firstSegment) {
        throw new Error('No segment generated');
      }

      // Update story with first segment
      const { error: updateError } = await supabase
        .from('stories')
        .update({
          current_segment_id: firstSegment.id,
          status: 'active',
        })
        .eq('id', story.id);

      if (updateError) {
        logger.error('Failed to update story with segment', updateError);
      }

      setGenerationProgress(100);

      toast({
        title: 'Story Created!',
        description: `${formData.childName}'s adventure is ready!`,
      });

      // Navigate to story viewer
      setTimeout(() => {
        navigate(`/story/${story.id}`);
      }, 500);

    } catch (error: any) {
      logger.error('Story generation failed', error);

      if (error instanceof InsufficientCreditsError) {
        setCreditError({
          required: error.creditsRequired,
          available: error.creditsAvailable,
        });
        setShowInsufficientCredits(true);
      } else {
        toast({
          title: 'Generation Failed',
          description: error.message || 'An error occurred while creating your story',
          variant: 'destructive',
        });
      }

      // Clean up failed story
      if (createdStoryId) {
        await supabase.from('stories').delete().eq('id', createdStoryId);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <Home className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Create Your Story</h1>
          </div>

          <CreditDisplay />
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Where Every Story Becomes an Adventure
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create personalized, interactive stories in seconds. Choose Quick Start for instant magic, or Story Wizard for complete control.
          </p>
        </div>

        {/* Story Form */}
        <SimpleStoryForm onSubmit={handleFormSubmit} isLoading={isGenerating} />

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
          <div className="p-6 border rounded-lg bg-card text-center">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-semibold mb-2">Quick Start</h3>
            <p className="text-sm text-muted-foreground">
              Just 3 fields to create your story instantly
            </p>
          </div>

          <div className="p-6 border rounded-lg bg-card text-center">
            <div className="text-3xl mb-2">🎨</div>
            <h3 className="font-semibold mb-2">Story Wizard</h3>
            <p className="text-sm text-muted-foreground">
              Advanced options for complete customization
            </p>
          </div>

          <div className="p-6 border rounded-lg bg-card text-center">
            <div className="text-3xl mb-2">✨</div>
            <h3 className="font-semibold mb-2">AI-Powered</h3>
            <p className="text-sm text-muted-foreground">
              Beautiful stories with illustrations & choices
            </p>
          </div>
        </div>
      </main>

      {/* Generation Progress Dialog */}
      <StoryGenerationProgress
        show={isGenerating}
        progress={generationProgress}
        onCancel={() => {
          setIsGenerating(false);
          toast({
            title: 'Cancelled',
            description: 'Story generation was cancelled',
          });
        }}
        canCancel={true}
      />

      {/* Insufficient Credits Dialog */}
      <InsufficientCreditsDialog
        open={showInsufficientCredits}
        onClose={() => setShowInsufficientCredits(false)}
        creditsRequired={creditError?.required || 0}
        creditsAvailable={creditError?.available || 0}
      />
    </div>
  );
}
