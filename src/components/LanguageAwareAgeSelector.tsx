import React from 'react';
import { Card } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { TRANSLATIONS } from '@/constants/translations';

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
              className={`glass-card-interactive cursor-pointer transition-all duration-300 ${
                isSelected 
                  ? 'border-primary/50 bg-primary/10' 
                  : 'border-primary/20 hover:border-primary/40'
              }`}
              onClick={() => onAgeGroupSelect(ageGroup)}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-medium text-lg ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                    {ageInfo.label}
                  </h4>
                  {isSelected && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>
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