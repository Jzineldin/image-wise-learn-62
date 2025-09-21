import LanguageSelector from '@/components/LanguageSelector';
import { Card, CardContent } from '@/components/ui/card';
import { Globe } from 'lucide-react';
import { t } from '@/constants/translations';

interface LanguageStepProps {
  selectedLanguage: string;
  onLanguageChange: (code: string) => void;
}

export const LanguageStep = ({ selectedLanguage, onLanguageChange }: LanguageStepProps) => {
  return (
    <div data-testid="wizard-step-language" className="space-y-4">
      <div className="flex items-center gap-2">
        <Globe className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-medium">{t('ui.language', selectedLanguage)}</h3>
      </div>
      <Card>
        <CardContent className="p-6">
          <LanguageSelector
            selectedLanguage={selectedLanguage}
            onLanguageChange={onLanguageChange}
            showSaveButton={false}
          />
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        {t('storyCreation.languageInstruction', selectedLanguage)}
      </p>
    </div>
  );
};

export default LanguageStep;

