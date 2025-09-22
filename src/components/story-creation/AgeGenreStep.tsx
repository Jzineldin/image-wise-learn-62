import { useLanguage } from '@/hooks/useLanguage';
import LanguageAwareAgeSelector from '@/components/LanguageAwareAgeSelector';
import LanguageAwareGenreSelector from '@/components/LanguageAwareGenreSelector';
import LanguageSelector from '@/components/LanguageSelector';

interface AgeGenreStepProps {
  selectedAgeGroup?: string;
  selectedGenres: string[];
  onAgeGroupSelect: (ageGroup: string) => void;
  onGenreToggle: (genre: string) => void;
}

export const AgeGenreStep = ({
  selectedAgeGroup,
  selectedGenres,
  onAgeGroupSelect,
  onGenreToggle
}: AgeGenreStepProps) => {
  const { translate, selectedLanguage, changeLanguage } = useLanguage();

  const BASE_URL = import.meta.env.BASE_URL || '/';

  // Map age and genre IDs to actual image filenames under public/images/story-creation-flow
  const ageToFilename = (age?: string) => {
    if (!age) return undefined;
    const map: Record<string, string> = {
      '4-6': 'age-4-6',
      '7-9': 'age-7-9',
      '10-12': 'age-10-12',
      '13+': 'age-13', // updated to match new filename
    };
    return map[age];
  };

  const genreToFilename = (g: string) => {
    switch (g) {
      case 'Animal Stories':
        return 'animals';
      case 'Superhero Stories':
        return 'superhero';
      case 'Fairy Tales':
        return 'fairy-tales';
      default:
        return g.toLowerCase().replace(/\s+/g, '-');
    }
  };

  return (
    <div className="space-y-6">
      {/* Inline Language Selector */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{translate('ui.language')}</span>
        <LanguageSelector
          selectedLanguage={selectedLanguage}
          onLanguageChange={changeLanguage}
          variant="compact"
          showSaveButton={false}
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">
          {translate('storyCreation.selectAge')} & {translate('storyCreation.selectGenre')}
        </h2>
        <p className="text-muted-foreground">
          {selectedLanguage === 'sv'
            ? 'Välj åldersgrupp och berättelsegenrer för ditt äventyr.'
            : 'Select the age group and story genres for your adventure.'
          }
        </p>
      </div>

      <LanguageAwareAgeSelector
        selectedAgeGroup={selectedAgeGroup}
        onAgeGroupSelect={onAgeGroupSelect}
      />

      <LanguageAwareGenreSelector
        selectedGenres={selectedGenres}
        onGenreToggle={onGenreToggle}
      />

      {/* Visual previews for selected age group and genres */}
      <div className="mt-4 grid gap-4">
        {selectedAgeGroup && (
          <div>
            <div className="text-sm font-medium mb-2">Age group preview</div>
            <div className="relative aspect-[16/9] rounded-lg overflow-hidden border bg-muted/30">
              <img
                src={`${BASE_URL}images/story-creation-flow/${ageToFilename(selectedAgeGroup)}.jpg`}
                alt={`${selectedAgeGroup} preview`}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          </div>
        )}

        {selectedGenres && selectedGenres.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2">Genre previews</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {selectedGenres.map((g) => (
                <div key={g} className="rounded-lg overflow-hidden border bg-muted/30">
                  <div className="relative aspect-[4/3]">
                    <img
                      src={`${BASE_URL}images/story-creation-flow/${genreToFilename(g)}.jpg`}
                      alt={`${g} preview`}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                  <div className="p-2 text-xs text-center text-muted-foreground">{g}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};