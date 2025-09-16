import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Globe, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/production-logger';

interface Language {
  code: string;
  name: string;
  native_name: string;
  is_active: boolean;
}

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (languageCode: string) => void;
  variant?: 'default' | 'compact';
  showSaveButton?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange,
  variant = 'default',
  showSaveButton = false
}) => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLanguages();
  }, []);

  const fetchLanguages = async () => {
    try {
      const { data, error } = await supabase
        .from('languages')
        .select('code, name, native_name, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      setLanguages(data || []);
    } catch (error) {
      logger.error('Error fetching languages', error, { component: 'LanguageSelector' });
      toast({
        title: "Error",
        description: "Failed to load available languages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (languageCode: string) => {
    onLanguageChange(languageCode);
    
    if (!showSaveButton) {
      // Auto-save if no save button is shown
      saveUserPreference(languageCode);
    }
  };

  const saveUserPreference = async (languageCode?: string) => {
    const codeToSave = languageCode || selectedLanguage;
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ preferred_language: codeToSave })
          .eq('id', user.id);

        if (error) throw error;

        toast({
          title: "Language preference saved",
          description: `Your language preference has been updated to ${getLanguageName(codeToSave)}`,
        });
      } else {
        // Store in localStorage if not authenticated
        localStorage.setItem('preferred_language', codeToSave);
        toast({
          title: "Language preference saved",
          description: "Language preference saved locally",
        });
      }
    } catch (error) {
      logger.error('Error saving language preference', error, { component: 'LanguageSelector' });
      toast({
        title: "Error",
        description: "Failed to save language preference",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getLanguageName = (code: string): string => {
    const language = languages.find(lang => lang.code === code);
    return language ? `${language.native_name} (${language.name})` : code;
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Globe className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading languages...</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {languages.map((language) => (
              <SelectItem key={language.code} value={language.code}>
                <div className="flex items-center gap-2">
                  {selectedLanguage === language.code && (
                    <Check className="h-3 w-3 text-primary" />
                  )}
                  <span>{language.native_name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Globe className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-medium">Story Language</h3>
      </div>
      
      <div className="space-y-3">
        <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select language for your story" />
          </SelectTrigger>
          <SelectContent>
            {languages.map((language) => (
              <SelectItem key={language.code} value={language.code}>
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2">
                    {selectedLanguage === language.code && (
                      <Check className="h-3 w-3 text-primary" />
                    )}
                    <span className="font-medium">{language.native_name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{language.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showSaveButton && (
          <Button 
            onClick={() => saveUserPreference()} 
            disabled={saving}
            variant="outline"
            className="w-full"
          >
            {saving ? (
              <>
                <Globe className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Save as Preference
              </>
            )}
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Stories will be generated in the selected language. You can translate existing stories later.
      </p>
    </div>
  );
};

export default LanguageSelector;