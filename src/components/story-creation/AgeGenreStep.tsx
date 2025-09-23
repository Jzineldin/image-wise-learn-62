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
    </div>
  );
};