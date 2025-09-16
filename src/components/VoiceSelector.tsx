import { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Volume2, Play, Pause } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import VoiceLanguageSelector from '@/components/VoiceLanguageSelector';
import { logger } from '@/lib/production-logger';

interface Voice {
  id: string;
  name: string;
  description: string;
  gender: string;
  accent: string;
}

interface VoiceSelectorProps {
  selectedVoice: string;
  onVoiceChange: (voiceId: string) => void;
  className?: string;
}

const availableVoices: Voice[] = [
  { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria', description: 'Warm and expressive, perfect for storytelling', gender: 'Female', accent: 'American' },
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger', description: 'Deep and authoritative, great for adventure stories', gender: 'Male', accent: 'British' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Clear and gentle, ideal for children\'s stories', gender: 'Female', accent: 'American' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura', description: 'Sophisticated and elegant narrator', gender: 'Female', accent: 'British' },
  { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie', description: 'Friendly and energetic storyteller', gender: 'Male', accent: 'American' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', description: 'Wise and experienced narrator', gender: 'Male', accent: 'British' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum', description: 'Young and dynamic voice', gender: 'Male', accent: 'Irish' },
  { id: 'SAz9YHcvj6GT2YYXdXww', name: 'River', description: 'Calm and soothing narrator', gender: 'Non-binary', accent: 'American' },
];

export const VoiceSelector = memo(({ selectedVoice, onVoiceChange, className }: VoiceSelectorProps) => {
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const { translate, selectedLanguage } = useLanguage();

  const selectedVoiceInfo = availableVoices.find(v => v.id === selectedVoice) || availableVoices[0];

  const handleVoicePreview = async (voiceId: string) => {
    try {
      // Stop any currently playing audio
      if (audioElement) {
        audioElement.pause();
        setIsPlaying(null);
      }

      if (isPlaying === voiceId) {
        setIsPlaying(null);
        return;
      }

      setIsPlaying(voiceId);
      
      // Create a simple preview text
      const previewText = "Hello! This is how I sound when narrating your stories. I hope you enjoy my voice!";
      
      // Generate preview audio (you would call your audio generation function here)
      // For now, we'll simulate with a timeout
      toast({
        title: "Voice Preview",
        description: "Voice preview functionality coming soon!",
      });
      
      setTimeout(() => {
        setIsPlaying(null);
      }, 3000);

    } catch (error) {
      logger.error('Error playing voice preview', error, {
        operation: 'voice-preview',
        voiceId
      });
      setIsPlaying(null);
      toast({
        title: "Preview Error",
        description: "Could not play voice preview. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={className}>
      <VoiceLanguageSelector
        selectedVoice={selectedVoice}
        onVoiceSelect={onVoiceChange}
      />
    </div>
  );
});

VoiceSelector.displayName = 'VoiceSelector';