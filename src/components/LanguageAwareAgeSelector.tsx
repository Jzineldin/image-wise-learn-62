import React from 'react';
import { Card } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { TRANSLATIONS } from '@/constants/translations';
import { AGE_GROUP_IMAGES, type AgeGroup } from '@/constants/image-paths';
import { logger } from '@/lib/logger';

interface LanguageAwareAgeSelectorProps {
  selectedAgeGroup: string | undefined;
  onAgeGroupSelect: (ageGroup: string) => void;
}

const AGE_GROUPS = ['4-6', '7-9', '10-12', '13+'];

const LanguageAwareAgeSelector: React.FC<LanguageAwareAgeSelectorProps> = ({
  selectedAgeGroup,
  onAgeGroupSelect
}) => {
  const { selectedLanguage, translate } = useLanguage();

  const getAgeGroupInfo = (ageGroup: string) => {
    const ageTranslations = TRANSLATIONS[selectedLanguage as keyof typeof TRANSLATIONS]?.ageGroups || TRANSLATIONS.en.ageGroups;
    
    return {
      label: ageTranslations[ageGroup as keyof typeof ageTranslations]?.label || ageGroup,
      description: ageTranslations[ageGroup as keyof typeof ageTranslations]?.description || ''
    };
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gradient mb-2">
          {translate('storyCreation.selectAge')}
        </h3>
        <p className="text-text-secondary text-sm mb-4">
          {selectedLanguage === 'sv' 
            ? 'Välj åldersgruppen för din berättelse' 
            : 'Choose the age group for your story'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {AGE_GROUPS.map((ageGroup) => {
          const ageInfo = getAgeGroupInfo(ageGroup);
          const isSelected = selectedAgeGroup === ageGroup;
          
          return (
            <Card
              key={ageGroup}
              className={`glass-card-interactive cursor-pointer transition-all duration-300 relative overflow-hidden ${
                isSelected
                  ? 'border-primary/50 bg-primary/10 ring-2 ring-primary/20'
                  : 'border-primary/20 hover:border-primary/40'
              }`}
              onClick={() => onAgeGroupSelect(ageGroup)}
            >
              <img
                src={AGE_GROUP_IMAGES[ageGroup as AgeGroup]}
                alt={`Age group ${ageGroup}`}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  logger.warn('Failed to load age group image', {
                    imageUrl: AGE_GROUP_IMAGES[ageGroup as AgeGroup],
                    ageGroup,
                    component: 'LanguageAwareAgeSelector'
                  });
                  (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />
              <div className="relative p-4 flex flex-col justify-end min-h-[120px]">
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-5 h-5 text-primary bg-background/80 rounded-full p-1" />
                  </div>
                )}
                <h4 className={`font-medium text-lg mb-2 ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                  {ageInfo.label}
                </h4>
                <p className="text-text-secondary text-sm">
                  {ageInfo.description}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default LanguageAwareAgeSelector;