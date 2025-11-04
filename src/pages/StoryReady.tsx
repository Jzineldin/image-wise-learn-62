/**
 * Story Ready Page
 *
 * Shown after user completes story content ("End Story Here").
 * Allows per-chapter asset management (voice, animation, details)
 * before finalizing the story.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import HeroBackground from '@/components/HeroBackground';
import { Loading } from '@/components/ui/loading';
import {
  Sparkles,
  Check,
  AlertCircle,
  Volume2,
  Video,
  Edit,
  MoreVertical,
  ChevronRight,
  Play,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { FinalizeModal } from '@/components/story-lifecycle/FinalizeModal';
import { VoiceGenerationDrawer } from '@/components/story-lifecycle/VoiceGenerationDrawer';
import { AnimationGenerationDrawer } from '@/components/story-lifecycle/AnimationGenerationDrawer';
import { ChapterDetailsDrawer } from '@/components/story-lifecycle/ChapterDetailsDrawer';

interface Chapter {
  id: string;
  segment_number: number;
  content: string;
  chapter_title?: string;

  // Voice/Audio
  voice_status: 'none' | 'queued' | 'processing' | 'ready' | 'failed';
  audio_url?: string;
  voice_config?: {
    speakerId?: string;
    style?: string;
    speed?: number;
  };
  voice_error?: string;

  // Animation/Video
  animation_status: 'none' | 'queued' | 'processing' | 'ready' | 'failed';
  video_url?: string;
  animation_config?: {
    prompt?: string;
    durationSec?: number;
    seed?: number;
  };
  animation_error?: string;

  // Details
  details_status: 'complete' | 'incomplete';
  missing_fields?: string[];
  chapter_tags?: string[];
  chapter_age_range?: string;
  chapter_cover_url?: string;
}

interface Story {
  id: string;
  title: string;
  lifecycle_status: string;
  user_id: string;
}

interface ReadinessSummary {
  total_chapters: number;
  voices_ready: number;
  animations_ready: number;
  details_complete: number;
  missing_voices: number;
  missing_animations: number;
  incomplete_details: number;
}

const StatusBadge = ({ status, type }: { status: string; type: 'voice' | 'animation' | 'details' }) => {
  const variants = {
    voice: {
      none: { label: 'No Voice', variant: 'secondary' as const, icon: null },
      queued: { label: 'Queued', variant: 'secondary' as const, icon: <RefreshCw className="w-3 h-3 animate-spin" /> },
      processing: { label: 'Processing...', variant: 'default' as const, icon: <RefreshCw className="w-3 h-3 animate-spin" /> },
      ready: { label: 'Voice Ready', variant: 'default' as const, icon: <Check className="w-3 h-3" /> },
      failed: { label: 'Failed', variant: 'destructive' as const, icon: <AlertCircle className="w-3 h-3" /> },
    },
    animation: {
      none: { label: 'No Animation', variant: 'secondary' as const, icon: null },
      queued: { label: 'Queued', variant: 'secondary' as const, icon: <RefreshCw className="w-3 h-3 animate-spin" /> },
      processing: { label: 'Processing...', variant: 'default' as const, icon: <RefreshCw className="w-3 h-3 animate-spin" /> },
      ready: { label: 'Animation Ready', variant: 'default' as const, icon: <Check className="w-3 h-3" /> },
      failed: { label: 'Failed', variant: 'destructive' as const, icon: <AlertCircle className="w-3 h-3" /> },
    },
    details: {
      complete: { label: 'Complete', variant: 'default' as const, icon: <Check className="w-3 h-3" /> },
      incomplete: { label: 'Incomplete', variant: 'secondary' as const, icon: <AlertCircle className="w-3 h-3" /> },
    },
  };

  const config = variants[type][status as keyof typeof variants[typeof type]] || variants[type].none;

  return (
    <Badge variant={config.variant} className="gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
};

export default function StoryReady() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [story, setStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [readiness, setReadiness] = useState<ReadinessSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);

  // Drawer states
  const [voiceDrawerOpen, setVoiceDrawerOpen] = useState(false);
  const [animationDrawerOpen, setAnimationDrawerOpen] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

  useEffect(() => {
    if (id && user) {
      loadStoryData();
    }
  }, [id, user]);

  const loadStoryData = async () => {
    try {
      setLoading(true);

      // Load story
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select('id, title, lifecycle_status, user_id')
        .eq('id', id)
        .single();

      if (storyError) throw storyError;
      if (!storyData) throw new Error('Story not found');

      // Check ownership
      if (storyData.user_id !== user?.id) {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to view this story.',
          variant: 'destructive',
        });
        navigate('/my-stories');
        return;
      }

      setStory(storyData);

      // Load chapters with asset status
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('story_segments')
        .select(`
          id,
          segment_number,
          content,
          chapter_title,
          voice_status,
          audio_url,
          voice_config,
          voice_error,
          animation_status,
          video_url,
          animation_config,
          animation_error,
          details_status,
          missing_fields,
          chapter_tags,
          chapter_age_range,
          chapter_cover_url
        `)
        .eq('story_id', id)
        .order('segment_number');

      if (chaptersError) throw chaptersError;
      setChapters(chaptersData || []);

      // Get readiness summary
      const { data: readinessData, error: readinessError } = await supabase
        .rpc('get_story_readiness', { story_uuid: id });

      if (!readinessError && readinessData) {
        setReadiness(readinessData);
      }

      logger.info('Story Ready page loaded', { storyId: id, chapters: chaptersData?.length });
    } catch (error) {
      logger.error('Failed to load story data', error);
      toast({
        title: 'Error',
        description: 'Failed to load story data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenVoiceDrawer = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setVoiceDrawerOpen(true);
  };

  const handleOpenAnimationDrawer = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setAnimationDrawerOpen(true);
  };

  const handleOpenDetailsDrawer = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setDetailsDrawerOpen(true);
  };

  const handleFinalize = () => {
    setShowFinalizeModal(true);
  };

  if (loading) {
    return <Loading.Page text="Loading story..." />;
  }

  if (!story) {
    return <div>Story not found</div>;
  }

  return (
    <div className="min-h-screen relative">
      <HeroBackground />
      <Navigation />

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-[#F4E3B2] tracking-wide mb-4">
            Story Ready
          </h1>
          <p className="text-lg md:text-xl text-[#C9C5D5] max-w-3xl mx-auto">
            Your story is content-complete. Manage voices, animations, and details per chapter before you finalize.
          </p>
        </div>

        {/* Readiness Summary */}
        {readiness && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
            <GlassCard padding="sm">
              <div className="text-center">
                <p className="text-[#C9C5D5] text-sm uppercase tracking-wide mb-1">Chapters</p>
                <p className="text-3xl font-heading font-bold text-[#F4E3B2]">{readiness.total_chapters}</p>
              </div>
            </GlassCard>
            <GlassCard padding="sm">
              <div className="text-center">
                <p className="text-[#C9C5D5] text-sm uppercase tracking-wide mb-1">Voices Ready</p>
                <p className="text-3xl font-heading font-bold text-[#F4E3B2]">
                  {readiness.voices_ready}/{readiness.total_chapters}
                </p>
              </div>
            </GlassCard>
            <GlassCard padding="sm">
              <div className="text-center">
                <p className="text-[#C9C5D5] text-sm uppercase tracking-wide mb-1">Animations Ready</p>
                <p className="text-3xl font-heading font-bold text-[#F4E3B2]">
                  {readiness.animations_ready}/{readiness.total_chapters}
                </p>
              </div>
            </GlassCard>
            <GlassCard padding="sm">
              <div className="text-center">
                <p className="text-[#C9C5D5] text-sm uppercase tracking-wide mb-1">Details Complete</p>
                <p className="text-3xl font-heading font-bold text-[#F4E3B2]">
                  {readiness.details_complete}/{readiness.total_chapters}
                </p>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Primary CTA */}
        <div className="flex justify-center mb-8">
          <Button
            onClick={handleFinalize}
            size="lg"
            className="bg-[rgba(242,181,68,.15)] text-[#F4E3B2] border-2 border-[rgba(242,181,68,.35)] hover:bg-[rgba(242,181,68,.25)] px-12 py-6 text-xl font-heading rounded-2xl"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Finalize Story
          </Button>
        </div>

        {/* Chapter List */}
        <GlassCard>
          <h2 className="text-2xl font-heading font-bold text-[#F4E3B2] mb-6">Manage Chapters</h2>

          <div className="space-y-4">
            {chapters.map((chapter) => (
              <div
                key={chapter.id}
                className="p-4 rounded-xl bg-[rgba(17,17,22,.5)] ring-1 ring-[rgba(242,181,68,.15)] hover:ring-[rgba(242,181,68,.25)] transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Chapter Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-bold text-[#F4E3B2] text-lg mb-2">
                      Chapter {chapter.segment_number}
                      {chapter.chapter_title && `: ${chapter.chapter_title}`}
                    </h3>

                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <StatusBadge status={chapter.voice_status} type="voice" />
                      <StatusBadge status={chapter.animation_status} type="animation" />
                      <StatusBadge status={chapter.details_status} type="details" />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {/* Voice Actions */}
                      {chapter.voice_status === 'none' || chapter.voice_status === 'failed' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenVoiceDrawer(chapter)}
                          className="text-[#C9C5D5] hover:text-[#F4E3B2]"
                        >
                          <Volume2 className="w-4 h-4 mr-1" />
                          Generate Voice
                        </Button>
                      ) : chapter.voice_status === 'ready' && chapter.audio_url ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const audio = new Audio(chapter.audio_url);
                            audio.play();
                          }}
                          className="text-[#C9C5D5] hover:text-[#F4E3B2]"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Play Voice
                        </Button>
                      ) : null}

                      {/* Animation Actions */}
                      {chapter.animation_status === 'none' || chapter.animation_status === 'failed' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenAnimationDrawer(chapter)}
                          className="text-[#C9C5D5] hover:text-[#F4E3B2]"
                        >
                          <Video className="w-4 h-4 mr-1" />
                          Animate
                        </Button>
                      ) : chapter.animation_status === 'ready' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(chapter.video_url, '_blank')}
                          className="text-[#C9C5D5] hover:text-[#F4E3B2]"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                      ) : null}

                      {/* Details Action */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDetailsDrawer(chapter)}
                        className="text-[#C9C5D5] hover:text-[#F4E3B2]"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit Details
                      </Button>
                    </div>
                  </div>

                  {/* More Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem disabled>
                        Duplicate Chapter
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled>
                        Reorder
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Chapter
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <Footer />

      {/* Modals & Drawers */}
      {showFinalizeModal && story && (
        <FinalizeModal
          open={showFinalizeModal}
          onClose={() => setShowFinalizeModal(false)}
          storyId={story.id}
          readinessSummary={readiness}
          onSuccess={() => {
            navigate(`/story/${story.id}/complete`);
          }}
        />
      )}

      {voiceDrawerOpen && selectedChapter && (
        <VoiceGenerationDrawer
          open={voiceDrawerOpen}
          onClose={() => {
            setVoiceDrawerOpen(false);
            setSelectedChapter(null);
          }}
          chapter={selectedChapter}
          storyId={story.id}
          onSuccess={loadStoryData}
        />
      )}

      {animationDrawerOpen && selectedChapter && (
        <AnimationGenerationDrawer
          open={animationDrawerOpen}
          onClose={() => {
            setAnimationDrawerOpen(false);
            setSelectedChapter(null);
          }}
          chapter={selectedChapter}
          storyId={story.id}
          onSuccess={loadStoryData}
        />
      )}

      {detailsDrawerOpen && selectedChapter && (
        <ChapterDetailsDrawer
          open={detailsDrawerOpen}
          onClose={() => {
            setDetailsDrawerOpen(false);
            setSelectedChapter(null);
          }}
          chapter={selectedChapter}
          storyId={story.id}
          onSuccess={loadStoryData}
        />
      )}
    </div>
  );
}
