/**
 * Simple Story Creation Form
 *
 * Based on copy-of-tale-forge design:
 * - Single-page form (no wizard steps)
 * - Quick Start mode (3 fields) + Story Wizard mode (6 fields)
 * - Tab-based mode switcher
 * - Child name personalization
 * - Free-text character input
 */

import { useState } from 'react';
import { Wand2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AGE_GROUPS } from '@/lib/utils/age-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StoryFormData {
  childName: string;
  character: string;
  genre: string;
  ageGroup?: string;
  traits?: string;
  customPrompt?: string;
}

interface SimpleStoryFormProps {
  onSubmit: (data: StoryFormData) => void;
  isLoading?: boolean;
}

const GENRES = [
  'Fantasy',
  'Space Adventure',
  'Mystery',
  'Talking Animals',
  'Underwater World',
  'Fairy Tale',
  'Superhero',
  'Historical',
  'Sci-Fi',
];

export function SimpleStoryForm({ onSubmit, isLoading = false }: SimpleStoryFormProps) {
  const [mode, setMode] = useState<'quick' | 'wizard'>('quick');

  // Quick Start fields (always visible)
  const [childName, setChildName] = useState('');
  const [character, setCharacter] = useState('');
  const [genre, setGenre] = useState('Fantasy');

  // Wizard mode fields (conditionally visible)
  const [ageGroup, setAgeGroup] = useState('7-9 years old');
  const [traits, setTraits] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData: StoryFormData = {
      childName,
      character,
      genre,
    };

    // Add wizard fields if in wizard mode
    if (mode === 'wizard') {
      formData.ageGroup = ageGroup;
      if (traits.trim()) formData.traits = traits;
      if (customPrompt.trim()) formData.customPrompt = customPrompt;
    }

    onSubmit(formData);
  };

  const isFormValid = childName.trim() && character.trim();

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-card border rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-2">Let's Begin Your Tale!</h2>
          <p className="text-muted-foreground">Choose your path to adventure.</p>
        </div>

        {/* Mode Switcher */}
        <div className="flex justify-center border-b mb-6">
          <button
            type="button"
            onClick={() => setMode('quick')}
            className={`px-6 py-2 font-semibold transition-colors ${
              mode === 'quick'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Quick Start
          </button>
          <button
            type="button"
            onClick={() => setMode('wizard')}
            className={`px-6 py-2 font-semibold transition-colors ${
              mode === 'wizard'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Story Wizard
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quick Start Fields (Always Visible) */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="childName">What's your name, hero?</Label>
              <Input
                id="childName"
                type="text"
                placeholder="e.g., Lily"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                required
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="character">Who is the story about?</Label>
              <Input
                id="character"
                type="text"
                placeholder="e.g., a brave squirrel named Squeaky"
                value={character}
                onChange={(e) => setCharacter(e.target.value)}
                required
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Describe the main character however you'd like!
              </p>
            </div>

            <div>
              <Label htmlFor="genre">Choose a genre</Label>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENRES.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Wizard Mode Fields (Conditionally Visible) */}
          {mode === 'wizard' && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <Label htmlFor="ageGroup">Age Group</Label>
                <Select value={ageGroup} onValueChange={setAgeGroup}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_GROUPS.FULL.map((ag) => (
                      <SelectItem key={ag} value={ag}>
                        {ag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="traits">Character Traits (Optional)</Label>
                <Input
                  id="traits"
                  type="text"
                  placeholder="e.g., brave, curious, loves cookies"
                  value={traits}
                  onChange={(e) => setTraits(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="customPrompt">Opening Scene (Optional)</Label>
                <Textarea
                  id="customPrompt"
                  placeholder="In a cozy burrow under a great oak tree..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={3}
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Set the scene for your story's beginning
                </p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!isFormValid || isLoading}
          >
            <Wand2 className="w-5 h-5 mr-2" />
            {isLoading ? 'Forging Your Tale...' : 'Forge My Tale!'}
          </Button>
        </form>

        {/* Mode Info */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          {mode === 'quick' ? (
            <p className="text-sm text-muted-foreground text-center">
              <strong>Quick Start:</strong> Just 3 simple fields to create your story instantly!
            </p>
          ) : (
            <p className="text-sm text-muted-foreground text-center">
              <strong>Story Wizard:</strong> Fine-tune your story with advanced options
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
