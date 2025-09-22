import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { TRANSLATIONS } from '@/constants/translations';
import { OptimizedImage } from '@/components/ui/optimized-image';

interface Genre {
  id: string;
  name: string;
  description: string;
}

interface LanguageAwareGenreSelectorProps {
  selectedGenres: string[];
  onGenreToggle: (genreId: string) => void;
}

const GENRES = ['Fantasy', 'Adventure', 'Mystery', 'Superhero Stories', 'Animal Stories', 'Fairy Tales'];

const LanguageAwareGenreSelector: React.FC<LanguageAwareGenreSelectorProps> = ({
  selectedGenres,
  onGenreToggle
}) => {
  const { selectedLanguage, translate } = useLanguage();

  const getGenreInfo = (genreId: string) => {
    const isSwedish = selectedLanguage === 'sv';
    const genreTranslations = TRANSLATIONS[selectedLanguage as keyof typeof TRANSLATIONS]?.genres || TRANSLATIONS.en.genres;
    
    return {
      name: genreTranslations[genreId as keyof typeof genreTranslations]?.name || genreId,
      description: genreTranslations[genreId as keyof typeof genreTranslations]?.description || ''
    };
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gradient mb-2">
          {translate('storyCreation.selectGenre')}
        </h3>
        <p className="text-text-secondary text-sm mb-4">
          {selectedLanguage === 'sv' 
            ? 'Välj en eller flera genrer för din berättelse' 
            : 'Select one or more genres for your story'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {GENRES.map((genre) => {
          const genreInfo = getGenreInfo(genre);
          const isSelected = selectedGenres.includes(genre);
          
          return (
            <Card
              key={genre}
              className={`glass-card-interactive cursor-pointer transition-all duration-300 overflow-hidden ${
                isSelected 
                  ? 'border-primary/50 bg-primary/10 ring-2 ring-primary/20' 
                  : 'border-primary/20 hover:border-primary/40'
              }`}
              onClick={() => onGenreToggle(genre)}
            >
              <div className="relative">
                <OptimizedImage
                  src={`/images/genres/${genre}.jpg`}
                  alt={`${genreInfo.name} genre`}
                  className="w-full h-24 object-cover"
                  placeholder="blur"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-5 h-5 text-primary bg-background/80 rounded-full p-1" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h4 className={`font-medium mb-2 ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                  {genreInfo.name}
                </h4>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {genreInfo.description}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default LanguageAwareGenreSelector;