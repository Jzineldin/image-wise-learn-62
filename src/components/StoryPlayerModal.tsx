/**
 * StoryPlayerModal Component
 *
 * Immersive full-screen modal for experiencing stories
 * Features unified layout with image/video, text, TTS, and chapter navigation
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { LazyImage } from '@/components/LazyImage';
import { playNarration, type AudioController } from '@/lib/utils/audioUtils';

interface StorySegment {
  id: string;
  segment_number: number;
  content: string;
  image_url?: string;
  video_url?: string;
  audio_url?: string;
  chapter_title?: string;
}

interface Story {
  id: string;
  title: string;
  genre: string;
  age_group: string;
}

interface StoryPlayerModalProps {
  storyId: string;
  isOpen: boolean;
  onClose: () => void;
  initialChapter?: number;
}

export function StoryPlayerModal({ storyId, isOpen, onClose, initialChapter = 0 }: StoryPlayerModalProps) {
  const [story, setStory] = useState<Story | null>(null);
  const [segments, setSegments] = useState<StorySegment[]>([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(initialChapter);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioController, setAudioController] = useState<AudioController | null>(null);

  // Use refs to avoid circular dependencies in useEffect
  const audioControllerRef = useRef<AudioController | null>(null);
  const segmentsRef = useRef(segments);

  // Keep refs in sync
  useEffect(() => {
    audioControllerRef.current = audioController;
  }, [audioController]);

  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  const currentChapter = segments[currentChapterIndex];

  // Load story data (only on mount, since modal is conditionally rendered)
  useEffect(() => {
    if (!storyId) return;

    const loadStory = async () => {
      setIsLoading(true);
      try {
        // Load story metadata
        const { data: storyData, error: storyError } = await supabase
          .from('stories')
          .select('id, title, genre, age_group')
          .eq('id', storyId)
          .single();

        if (storyError) throw storyError;
        setStory(storyData);

        // Load all segments
        const { data: segmentsData, error: segmentsError } = await supabase
          .from('story_segments')
          .select('id, segment_number, content, image_url, video_url, audio_url, chapter_title')
          .eq('story_id', storyId)
          .order('segment_number');

        if (segmentsError) throw segmentsError;
        setSegments(segmentsData || []);

        logger.info('Story loaded for modal player', { storyId, chaptersCount: segmentsData?.length });
      } catch (error) {
        logger.error('Failed to load story for modal', error, { storyId });
      } finally {
        setIsLoading(false);
      }
    };

    loadStory();
  }, [storyId]);

  // Handle audio playback with WAV header support
  useEffect(() => {
    // Cleanup previous audio if exists
    if (audioControllerRef.current) {
      audioControllerRef.current.stop();
      setAudioController(null);
    }

    if (!currentChapter?.audio_url) {
      setIsPlaying(false);
      return;
    }

    // Don't auto-load audio, wait for user to click play
    setIsPlaying(false);
  }, [currentChapter?.id]);

  const handlePlayPause = useCallback(async () => {
    // If already playing, stop it
    if (isPlaying && audioControllerRef.current) {
      audioControllerRef.current.stop();
      setIsPlaying(false);
      setAudioController(null);
      return;
    }

    // Start playing
    if (!currentChapter?.audio_url) return;

    try {
      const controller = await playNarration(currentChapter.audio_url);

      controller.onEnded(() => {
        setIsPlaying(false);
        setAudioController(null);
      });

      setAudioController(controller);
      setIsPlaying(true);
    } catch (error) {
      logger.error('Failed to play audio in modal', error);
      setIsPlaying(false);
    }
  }, [isPlaying, currentChapter?.audio_url]);

  const handlePreviousChapter = useCallback(() => {
    setCurrentChapterIndex(prev => {
      if (prev > 0) {
        setIsPlaying(false);
        return prev - 1;
      }
      return prev;
    });
  }, []);

  const handleNextChapter = useCallback(() => {
    setCurrentChapterIndex(prev => {
      if (prev < segmentsRef.current.length - 1) {
        setIsPlaying(false);
        return prev + 1;
      }
      return prev;
    });
  }, []);

  const handleClose = useCallback(() => {
    if (audioControllerRef.current) {
      audioControllerRef.current.stop();
    }
    setIsPlaying(false);
    onClose();
  }, [onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowLeft') {
        handlePreviousChapter();
      } else if (e.key === 'ArrowRight') {
        handleNextChapter();
      } else if (e.key === ' ') {
        e.preventDefault();
        handlePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, handleClose, handlePreviousChapter, handleNextChapter, handlePlayPause]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClose}
        className="absolute top-4 right-4 z-50 text-white hover:bg-white/10"
        aria-label="Close story player"
      >
        <X className="w-6 h-6" />
      </Button>

      {isLoading ? (
        <div className="text-white text-xl">Loading story...</div>
      ) : !currentChapter ? (
        <div className="text-white text-xl">Story not found</div>
      ) : (
        <div className="w-full max-w-2xl mx-auto h-[90vh] flex flex-col">
          {/* Header */}
          <div className="text-center mb-4 px-4">
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-white mb-1">
              {story?.title}
            </h1>
            <p className="text-white/70 text-sm">
              Chapter {currentChapterIndex + 1} of {segments.length}
              {currentChapter.chapter_title && ` • ${currentChapter.chapter_title}`}
            </p>
          </div>

          {/* Main Content - Portrait Card */}
          <div className="flex-1 bg-gradient-to-b from-gray-900/80 to-black/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col backdrop-blur-sm border border-white/10">
            {/* Media Section - Takes up ~60% of card */}
            <div className="relative w-full aspect-[4/3] bg-black flex-shrink-0">
              {currentChapter.video_url ? (
                <video
                  key={currentChapter.id}
                  src={currentChapter.video_url}
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                  loop
                />
              ) : currentChapter.image_url ? (
                <LazyImage
                  key={currentChapter.id}
                  src={currentChapter.image_url}
                  alt={`Chapter ${currentChapterIndex + 1}`}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-white/50 text-lg">No media available</div>
                </div>
              )}
            </div>

            {/* Text & Controls Section - Takes up remaining space */}
            <div className="flex-1 flex flex-col p-6 overflow-hidden">
              {/* Story Text - Scrollable */}
              <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent mb-4">
                <p className="text-white text-base md:text-lg leading-relaxed whitespace-pre-wrap">
                  {currentChapter.content}
                </p>
              </div>

              {/* Audio Controls */}
              {currentChapter.audio_url && (
                <div className="mt-auto p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                  <div className="flex items-center justify-between gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePlayPause}
                      className="text-white hover:bg-white/20"
                      aria-label={isPlaying ? 'Pause narration' : 'Play narration'}
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Play
                        </>
                      )}
                    </Button>

                    <div className="flex-1 text-center">
                      <p className="text-white/70 text-xs">
                        {isPlaying ? 'Playing narration...' : 'Narration available'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="mt-4 flex items-center justify-between px-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePreviousChapter}
              disabled={currentChapterIndex === 0}
              className="text-white hover:bg-white/10 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            {/* Chapter Indicators */}
            <div className="flex gap-2">
              {segments.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentChapterIndex(index);
                    setIsPlaying(false);
                  }}
                  className={`h-2 rounded-full transition-all ${
                    index === currentChapterIndex
                      ? 'bg-white w-6'
                      : 'bg-white/40 hover:bg-white/70 w-2'
                  }`}
                  aria-label={`Go to chapter ${index + 1}`}
                />
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleNextChapter}
              disabled={currentChapterIndex === segments.length - 1}
              className="text-white hover:bg-white/10 disabled:opacity-30"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
