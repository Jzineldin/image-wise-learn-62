import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus } from 'lucide-react';
import { UserCharacter } from '@/types/character';
import { useCharacters } from '@/hooks/useCharacters';
import { toast } from 'sonner';

interface CreateCharacterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCharacterCreated: (character: UserCharacter) => void;
}

const CHARACTER_TYPES = [
  'human',
  'animal',
  'magical',
  'dragon',
  'robot',
  'alien',
  'fairy',
  'monster'
];

const COMMON_TRAITS = [
  'brave', 'curious', 'kind', 'funny', 'smart', 'loyal', 'creative', 'adventurous',
  'gentle', 'determined', 'wise', 'playful', 'mysterious', 'protective', 'cheerful',
  'patient', 'clever', 'friendly', 'bold', 'caring'
];

export const CreateCharacterDialog = ({ 
  open, 
  onOpenChange, 
  onCharacterCreated 
}: CreateCharacterDialogProps) => {
  const { createCharacter } = useCharacters();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    character_type: 'human',
    backstory: ''
  });
  
  const [personalityTraits, setPersonalityTraits] = useState<string[]>([]);
  const [newTrait, setNewTrait] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) {
      toast.error('Please fill in the character name and description');
      return;
    }

    setLoading(true);
    try {
      const character = await createCharacter({
        ...formData,
        personality_traits: personalityTraits,
        is_public: false
      });

      if (character) {
        onCharacterCreated(character);
        resetForm();
        toast.success('Character created successfully!');
      }
    } catch (error) {
      toast.error('Failed to create character');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      character_type: 'human',
      backstory: ''
    });
    setPersonalityTraits([]);
    setNewTrait('');
  };

  const addTrait = (trait: string) => {
    const trimmedTrait = trait.trim().toLowerCase();
    if (trimmedTrait && !personalityTraits.includes(trimmedTrait)) {
      setPersonalityTraits([...personalityTraits, trimmedTrait]);
      setNewTrait('');
    }
  };

  const removeTrait = (trait: string) => {
    setPersonalityTraits(personalityTraits.filter(t => t !== trait));
  };

  const handleTraitKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTrait(newTrait);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Character</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Character Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter character name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="character_type">Character Type</Label>
            <Select 
              value={formData.character_type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, character_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHARACTER_TYPES.map(type => (
                  <SelectItem key={type} value={type} className="capitalize">
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your character's appearance and basic personality"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="backstory">Backstory (Optional)</Label>
            <Textarea
              id="backstory"
              value={formData.backstory}
              onChange={(e) => setFormData(prev => ({ ...prev, backstory: e.target.value }))}
              placeholder="Character's background story"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Personality Traits</Label>
            <div className="flex flex-wrap gap-1 mb-2">
              {personalityTraits.map(trait => (
                <Badge key={trait} variant="secondary" className="text-xs">
                  {trait}
                  <button
                    type="button"
                    onClick={() => removeTrait(trait)}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Input
                value={newTrait}
                onChange={(e) => setNewTrait(e.target.value)}
                onKeyDown={handleTraitKeyDown}
                placeholder="Add a personality trait"
                className="flex-1"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addTrait(newTrait)}
                disabled={!newTrait.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="text-xs text-muted-foreground mr-2">Quick add:</span>
              {COMMON_TRAITS.filter(trait => !personalityTraits.includes(trait)).slice(0, 6).map(trait => (
                <Button
                  key={trait}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => addTrait(trait)}
                >
                  {trait}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Character'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};