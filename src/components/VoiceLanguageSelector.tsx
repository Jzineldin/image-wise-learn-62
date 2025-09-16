import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Volume2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { VOICE_LANGUAGE_MAP } from '@/constants/translations';

interface VoiceLanguageSelectorProps {
  selectedVoice?: string;
  onVoiceSelect: (voiceId: string) => void;
  className?: string;
}

const VoiceLanguageSelector: React.FC<VoiceLanguageSelectorProps> = ({
  selectedVoice,
  onVoiceSelect,
  className = ''
}) => {
  const { selectedLanguage, translate } = useLanguage();

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

  if (availableVoices.length === 0) {
    return (
      <div className={`text-muted-foreground text-sm ${className}`}>
        {selectedLanguage === 'sv' 
          ? 'Inga röster tillgängliga för detta språk'
          : 'No voices available for this language'
        }
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Volume2 className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">{translate('voice.selectVoice')}</span>
        <Badge variant="secondary" className="text-xs">
          {selectedLanguage === 'sv' ? '🇸🇪 Svenska' : '🇺🇸 English'}
        </Badge>
      </div>

      <Select value={selectedVoice} onValueChange={onVoiceSelect}>
        <SelectTrigger>
          <SelectValue placeholder={selectedLanguage === 'sv' ? 'Välj röst...' : 'Select voice...'} />
        </SelectTrigger>
        <SelectContent>
          {availableVoices.map((voice) => (
            <SelectItem key={voice.id} value={voice.id}>
              <div className="flex items-center gap-2">
                <span>{voice.name}</span>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    voice.gender === 'female' ? 'text-pink-400' : 
                    voice.gender === 'male' ? 'text-blue-400' : 
                    'text-purple-400'
                  }`}
                >
                  {voice.gender === 'female' ? '♀' : voice.gender === 'male' ? '♂' : '◊'}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedLanguage === 'sv' && (
        <p className="text-xs text-muted-foreground">
          Röster optimerade för svenska språket
        </p>
      )}
    </div>
  );
};

export default VoiceLanguageSelector;