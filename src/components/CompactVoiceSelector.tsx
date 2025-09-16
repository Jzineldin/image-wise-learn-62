import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volume2, User } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { VOICE_LANGUAGE_MAP } from '@/constants/translations';

interface CompactVoiceSelectorProps {
  selectedVoice?: string;
  onVoiceSelect: (voiceId: string) => void;
  className?: string;
  size?: 'sm' | 'md';
}

const CompactVoiceSelector: React.FC<CompactVoiceSelectorProps> = ({
  selectedVoice,
  onVoiceSelect,
  className = '',
  size = 'sm'
}) => {
  const { selectedLanguage } = useLanguage();

  // Voice names mapping
  const voiceNames: Record<string, string> = {
    // English voices
    '9BWtsMINqrJLrRacOk9x': 'Aria',
    'CwhRBWXzGAHq8TQ4Fs17': 'Roger',
    'EXAVITQu4vr4xnSDxMaL': 'Sarah',
    'TX3LPaxmHKxFdv7VOQHJ': 'Liam',
    'XB0fDUnXU5powFXDhCwa': 'Charlotte',
    // Swedish voices
    'x0u3EW21dbrORJzOq1m9': 'Adam',
    'aSLKtNoVBZlxQEMsnGL2': 'Sanna',
    'kkwvaJeTPw4KK0sBdyvD': 'J.Bengt',
    '4Ct5uMEndw4cJ7q0Jx0l': 'Elin'
  };

  const getVoicesForLanguage = (languageCode: string) => {
    const voiceMap = VOICE_LANGUAGE_MAP[languageCode as keyof typeof VOICE_LANGUAGE_MAP];
    if (!voiceMap) return [];

    return [
      ...voiceMap.female.map(voiceId => ({
        id: voiceId,
        name: voiceNames[voiceId] || voiceId,
        gender: 'female'
      })),
      ...voiceMap.male.map(voiceId => ({
        id: voiceId,
        name: voiceNames[voiceId] || voiceId,
        gender: 'male'
      })),
      ...voiceMap.neutral.map(voiceId => ({
        id: voiceId,
        name: voiceNames[voiceId] || voiceId,
        gender: 'neutral'
      }))
    ];
  };

  const availableVoices = getVoicesForLanguage(selectedLanguage);
  const selectedVoiceName = selectedVoice ? voiceNames[selectedVoice] || selectedVoice : undefined;

  if (availableVoices.length === 0) {
    return null;
  }

  const sizeClasses = {
    sm: "h-8 text-xs",
    md: "h-10 text-sm"
  };

  return (
    <Select value={selectedVoice} onValueChange={onVoiceSelect}>
      <SelectTrigger className={`w-[100px] ${sizeClasses[size]} ${className}`}>
        <div className="flex items-center gap-1 text-muted-foreground">
          <User className="h-3 w-3" />
          <SelectValue>
            {selectedVoiceName || 'Voice'}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        {availableVoices.map((voice) => (
          <SelectItem key={voice.id} value={voice.id}>
            <div className="flex items-center gap-2">
              <span>{voice.name}</span>
              <span className={`text-xs ${
                voice.gender === 'female' ? 'text-pink-400' : 
                voice.gender === 'male' ? 'text-blue-400' : 
                'text-purple-400'
              }`}>
                {voice.gender === 'female' ? '♀' : voice.gender === 'male' ? '♂' : '◊'}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CompactVoiceSelector;