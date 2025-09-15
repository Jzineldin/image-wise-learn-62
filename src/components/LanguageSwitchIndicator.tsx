import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface LanguageSwitchIndicatorProps {
  className?: string;
  showFlag?: boolean;
  compact?: boolean;
}

const LanguageSwitchIndicator: React.FC<LanguageSwitchIndicatorProps> = ({
  className = '',
  showFlag = true,
  compact = false
}) => {
  const { selectedLanguage, getCurrentLanguage } = useLanguage();
  
  const currentLang = getCurrentLanguage();
  const isSwedish = selectedLanguage === 'sv';

  if (!currentLang) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Badge 
        variant="secondary" 
        className={`${compact ? 'text-xs' : 'text-sm'} ${
          isSwedish ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-100 text-gray-800 border-gray-200'
        }`}
      >
        {showFlag && (
          <span className="mr-1">
            {isSwedish ? '🇸🇪' : '🇺🇸'}
          </span>
        )}
        {compact ? currentLang.code.toUpperCase() : currentLang.native_name}
      </Badge>
      
      {isSwedish && !compact && (
        <span className="text-xs text-muted-foreground">
          Stories will be created in Swedish
        </span>
      )}
    </div>
  );
};

export default LanguageSwitchIndicator;