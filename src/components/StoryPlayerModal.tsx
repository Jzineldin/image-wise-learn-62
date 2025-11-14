/**
 * StoryPlayerModal Component
 *
 * Immersive full-screen modal for experiencing stories
 * Features unified layout with image/video, text, TTS, and chapter navigation
 */

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { LazyImage } from '@/components/LazyImage';

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
  const [isMuted, setIsMuted] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const currentChapter = segments[currentChapterIndex];

  // Load story data
  useEffect(() => {
    if (!isOpen || !storyId) return;

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
  }, [storyId, isOpen]);

  // Handle audio playback
  useEffect(() => {
    if (!currentChapter?.audio_url) {
      if (audioElement) {
        audioElement.pause();
        setAudioElement(null);
      }
      setIsPlaying(false);
      return;
    }

    // Create new audio element for current chapter
    const audio = new Audio(currentChapter.audio_url);
    audio.volume = isMuted ? 0 : 1;

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
    });

    setAudioElement(audio);

    return () => {
      audio.pause();
      audio.removeEventListener('ended', () => {});
    };
  }, [currentChapter?.id, currentChapter?.audio_url]);

  // Update audio volume when mute state changes
  useEffect(() => {
    if (audioElement) {
      audioElement.volume = isMuted ? 0 : 1;
    }
  }, [isMuted, audioElement]);

  const handlePlayPause = useCallback(() => {
    if (!audioElement) return;

    if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      audioElement.play();
      setIsPlaying(true);
    }
  }, [audioElement, isPlaying]);

  const handlePreviousChapter = useCallback(() => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(prev => prev - 1);
      setIsPlaying(false);
    }
  }, [currentChapterIndex]);

  const handleNextChapter = useCallback(() => {
    if (currentChapterIndex < segments.length - 1) {
      setCurrentChapterIndex(prev => prev + 1);
      setIsPlaying(false);
    }
  }, [currentChapterIndex, segments.length]);

  const handleClose = useCallback(() => {
    if (audioElement) {
      audioElement.pause();
    }
    setIsPlaying(false);
    onClose();
  }, [audioElement, onClose]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
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
        <div className="w-full h-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col">
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-white mb-2">
              {story?.title}
            </h1>
            <p className="text-white/70 text-sm">
              Chapter {currentChapterIndex + 1} of {segments.length}
              {currentChapter.chapter_title && ` • ${currentChapter.chapter_title}`}
            </p>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 grid md:grid-cols-2 gap-6 overflow-hidden">
            {/* Left: Media (Image/Video) */}
            <div className="relative rounded-2xl overflow-hidden bg-black/50 flex items-center justify-center">
              {currentChapter.video_url ? (
                <video
                  key={currentChapter.id}
                  src={currentChapter.video_url}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                  loop
                  muted={isMuted}
                />
              ) : currentChapter.image_url ? (
                <LazyImage
                  key={currentChapter.id}
                  src={currentChapter.image_url}
                  alt={`Chapter ${currentChapterIndex + 1}`}
                  className="w-full h-full object-contain"
                  loading="eager"
                />
              ) : (
                <div className="text-white/50 text-lg">No media available</div>
              )}
            </div>

            {/* Right: Text & Controls */}
            <div className="flex flex-col justify-between">
              {/* Story Text */}
              <div className="flex-1 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                <p className="text-white text-lg md:text-xl leading-relaxed whitespace-pre-wrap">
                  {currentChapter.content}
                </p>
              </div>

              {/* Audio Controls */}
              {currentChapter.audio_url && (
                <div className="mt-6 p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handlePlayPause}
                      className="text-white hover:bg-white/20"
                      aria-label={isPlaying ? 'Pause narration' : 'Play narration'}
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6" />
                      ) : (
                        <Play className="w-6 h-6" />
                      )}
                    </Button>

                    <div className="flex-1 text-center">
                      <p className="text-white/70 text-sm">
                        {isPlaying ? 'Playing narration...' : 'Narration available'}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMuted(!isMuted)}
                      className="text-white hover:bg-white/20"
                      aria-label={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? (
                        <VolumeX className="w-6 h-6" />
                      ) : (
                        <Volume2 className="w-6 h-6" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handlePreviousChapter}
              disabled={currentChapterIndex === 0}
              className="text-white hover:bg-white/10 disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
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
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentChapterIndex
                      ? 'bg-white w-8'
                      : 'bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Go to chapter ${index + 1}`}
                />
              ))}
            </div>

            <Button
              variant="ghost"
              onClick={handleNextChapter}
              disabled={currentChapterIndex === segments.length - 1}
              className="text-white hover:bg-white/10 disabled:opacity-30"
            >
              Next
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
