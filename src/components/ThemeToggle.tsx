/**
 * ThemeToggle Component for Tale Forge
 * Provides intuitive theme selection with visual previews
 */

import React, { useState } from 'react';
import { Moon, Sun, Sunset, Palette, Clock, Check } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { ThemeVariant } from '@/lib/theme-utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils/cn';

interface ThemeIconProps {
  theme: ThemeVariant;
  size?: number;
  className?: string;
}

function ThemeIcon({ theme, size = 16, className }: ThemeIconProps) {
  const iconProps = { size, className };

  switch (theme) {
    case 'midnight':
      return <Moon {...iconProps} />;
    case 'twilight':
      return <Sunset {...iconProps} />;
    case 'dawn':
      return <Sun {...iconProps} />;
    default:
      return <Palette {...iconProps} />;
  }
}

interface ThemePreviewProps {
  theme: ThemeVariant;
  isSelected: boolean;
  onSelect: () => void;
}

function ThemePreview({ theme, isSelected, onSelect }: ThemePreviewProps) {
  const { getThemeDisplayName, getThemeDescription } = useTheme();

  // Theme color previews based on theme configs
  const getPreviewColors = (themeVariant: ThemeVariant) => {
    switch (themeVariant) {
      case 'midnight':
        return {
          background: '#050510',
          surface: '#0A0A1F',
          primary: '#FFA500',
          text: '#FFFFFF',
        };
      case 'twilight':
        return {
          background: '#0D0D1A',
          surface: '#131323',
          primary: '#FFB366',
          text: '#F2F2F2',
        };
      case 'dawn':
        return {
          background: '#211F1C',
          surface: '#2B2926',
          primary: '#FF9933',
          text: '#E5E4E2',
        };
      default:
        return {
          background: '#050510',
          surface: '#0A0A1F',
          primary: '#FFA500',
          text: '#FFFFFF',
        };
    }
  };

  const colors = getPreviewColors(theme);

  return (
    <div
      onClick={onSelect}
      className={cn(
        'relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200',
        'hover:bg-primary/5 hover:border-primary/30',
        isSelected
          ? 'bg-primary/10 border border-primary/40 shadow-lg'
          : 'border border-transparent hover:border-primary/20'
      )}
    >
      {/* Theme Preview */}
      <div className="relative w-12 h-8 rounded border border-white/20 overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: colors.background }}
        />
        {/* Surface */}
        <div
          className="absolute right-0 top-0 w-3/5 h-full opacity-80"
          style={{ backgroundColor: colors.surface }}
        />
        {/* Primary accent */}
        <div
          className="absolute bottom-0 right-0 w-1/3 h-1 rounded-full"
          style={{ backgroundColor: colors.primary }}
        />
        {/* Text indicator */}
        <div
          className="absolute top-1 left-1 w-1 h-1 rounded-full"
          style={{ backgroundColor: colors.text }}
        />
      </div>

      {/* Theme Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <ThemeIcon theme={theme} size={14} />
          <span className="font-medium text-sm">
            {getThemeDisplayName(theme)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {getThemeDescription(theme)}
        </p>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="flex-shrink-0">
          <Check size={14} className="text-primary" />
        </div>
      )}
    </div>
  );
}

interface ThemeToggleProps {
  variant?: 'button' | 'minimal' | 'dropdown';
  showLabel?: boolean;
  className?: string;
}

export function ThemeToggle({
  variant = 'dropdown',
  showLabel = false,
  className
}: ThemeToggleProps) {
  const {
    currentTheme,
    setTheme,
    toggleTheme,
    getAllThemes,
    useRecommendedTheme,
    enableAutoTheme,
    setEnableAutoTheme,
    isThemeTransitioning,
  } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const themes = getAllThemes();

  // Simple button toggle (cycles through themes)
  if (variant === 'button') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleTheme}
        disabled={isThemeTransitioning}
        className={cn('gap-2', className)}
      >
        <ThemeIcon theme={currentTheme} size={16} />
        {showLabel && (
          <span className="hidden sm:inline">
            {themes.find(t => t.value === currentTheme)?.label}
          </span>
        )}
      </Button>
    );
  }

  // Minimal icon-only toggle
  if (variant === 'minimal') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        disabled={isThemeTransitioning}
        className={cn('h-8 w-8', className)}
      >
        <ThemeIcon theme={currentTheme} size={16} />
      </Button>
    );
  }

  // Full dropdown with theme previews
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('gap-2', className)}
          disabled={isThemeTransitioning}
        >
          <ThemeIcon theme={currentTheme} size={16} />
          {showLabel && (
            <span className="hidden sm:inline">
              {themes.find(t => t.value === currentTheme)?.label}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 glass-card p-2"
        sideOffset={8}
      >
        <DropdownMenuLabel className="flex items-center gap-2 px-2 py-1.5">
          <Palette size={16} />
          Choose Theme
        </DropdownMenuLabel>

        <div className="space-y-1 mb-3">
          {themes.map((theme) => (
            <ThemePreview
              key={theme.value}
              theme={theme.value}
              isSelected={currentTheme === theme.value}
              onSelect={() => {
                setTheme(theme.value);
                setIsOpen(false);
              }}
            />
          ))}
        </div>

        <DropdownMenuSeparator />

        {/* Auto-theme option */}
        <div className="px-2 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={14} />
              <Label htmlFor="auto-theme" className="text-sm font-medium">
                Auto Theme
              </Label>
            </div>
            <Switch
              id="auto-theme"
              checked={enableAutoTheme}
              onCheckedChange={setEnableAutoTheme}
              size="sm"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Automatically switch themes based on time of day
          </p>
        </div>

        <DropdownMenuSeparator />

        {/* Quick actions */}
        <DropdownMenuItem
          onClick={() => {
            useRecommendedTheme();
            setIsOpen(false);
          }}
          className="flex items-center gap-2 px-2 py-1.5"
        >
          <Clock size={14} />
          <span>Use Recommended</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Compact theme selector for settings pages
 */
interface ThemeSelectProps {
  className?: string;
}

export function ThemeSelect({ className }: ThemeSelectProps) {
  const { currentTheme, setTheme, getAllThemes } = useTheme();
  const themes = getAllThemes();

  return (
    <div className={cn('space-y-3', className)}>
      <Label className="text-sm font-medium">Theme Preference</Label>
      <div className="grid gap-2">
        {themes.map((theme) => (
          <ThemePreview
            key={theme.value}
            theme={theme.value}
            isSelected={currentTheme === theme.value}
            onSelect={() => setTheme(theme.value)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Theme status indicator (shows current theme info)
 */
export function ThemeStatus() {
  const { currentTheme, getThemeDisplayName, getThemeDescription } = useTheme();

  return (
    <div className="flex items-center gap-3 p-3 glass-card-light rounded-lg">
      <div className="flex-shrink-0">
        <ThemeIcon theme={currentTheme} size={20} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm">{getThemeDisplayName(currentTheme)}</h4>
        <p className="text-xs text-muted-foreground mt-0.5">
          {getThemeDescription(currentTheme)}
        </p>
      </div>
    </div>
  );
}

export default ThemeToggle;