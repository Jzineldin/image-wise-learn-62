import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Volume2, Play, Pause } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

export const VoiceSelector = ({ selectedVoice, onVoiceChange, className }: VoiceSelectorProps) => {
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const { toast } = useToast();

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
      console.error('Error playing voice preview:', error);
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
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="glass-card-interactive">
            <Volume2 className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Narrator: </span>
            {selectedVoiceInfo.name}
          </Button>
        </DialogTrigger>
        <DialogContent className="glass-card-elevated border-primary/20 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-gradient font-heading">Choose Your Narrator</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid gap-4">
              {availableVoices.map((voice) => (
                <div
                  key={voice.id}
                  className={`glass-card p-4 cursor-pointer hover:border-primary/40 transition-all ${
                    selectedVoice === voice.id ? 'border-primary/60 bg-primary/10' : ''
                  }`}
                  onClick={() => onVoiceChange(voice.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-text-primary">{voice.name}</h3>
                        <span className="text-xs px-2 py-1 bg-secondary/20 rounded-full text-text-secondary">
                          {voice.gender} • {voice.accent}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary">{voice.description}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVoicePreview(voice.id);
                        }}
                        className="btn-icon"
                      >
                        {isPlaying === voice.id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="glass-card p-4 border-accent/30">
              <h4 className="font-semibold text-accent mb-2">Current Selection</h4>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-text-primary">{selectedVoiceInfo.name}</p>
                  <p className="text-sm text-text-secondary">{selectedVoiceInfo.description}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleVoicePreview(selectedVoice)}
                  className="btn-primary"
                >
                  {isPlaying === selectedVoice ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};