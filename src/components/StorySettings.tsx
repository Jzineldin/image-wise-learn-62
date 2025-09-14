import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Globe, Lock, Share } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Story {
  id: string;
  title: string;
  description?: string;
  genre: string;
  age_group: string;
  visibility: string;
  status: string;
}

interface StorySettingsProps {
  story: Story;
  onUpdate: (updatedStory: Story) => void;
  onClose: () => void;
}

const StorySettings: React.FC<StorySettingsProps> = ({ story, onUpdate, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: story.title,
    description: story.description || '',
    genre: story.genre,
    age_group: story.age_group,
    visibility: story.visibility,
  });
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('stories')
        .update({
          title: formData.title,
          description: formData.description,
          genre: formData.genre,
          age_group: formData.age_group,
          visibility: formData.visibility,
        })
        .eq('id', story.id);

      if (error) throw error;

      const updatedStory = { ...story, ...formData };
      onUpdate(updatedStory);
      
      toast({
        title: "Settings saved",
        description: "Your story settings have been updated.",
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating story:', error);
      toast({
        title: "Error",
        description: "Failed to update story settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const genres = [
    'Fantasy & Magic', 'Adventure & Exploration', 'Mystery & Detective', 
    'Science Fiction', 'Animal Tales', 'Fairy Tales', 'Historical Fiction', 'Superhero Stories'
  ];

  const ageGroups = [
    '3-5', '6-8', '9-12', '13+'
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="glass-card-elevated w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Story Settings
          </CardTitle>
          <Button variant="ghost" onClick={onClose}>×</Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Story Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter story title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your story..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="genre">Genre</Label>
                <Select
                  value={formData.genre}
                  onValueChange={(value) => setFormData({ ...formData, genre: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent>
                    {genres.map(genre => (
                      <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="age_group">Age Group</Label>
                <Select
                  value={formData.age_group}
                  onValueChange={(value) => setFormData({ ...formData, age_group: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select age group" />
                  </SelectTrigger>
                  <SelectContent>
                    {ageGroups.map(age => (
                      <SelectItem key={age} value={age}>{age}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Visibility Settings */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Privacy & Sharing
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 glass-card rounded-lg">
                <div className="flex items-center gap-3">
                  {formData.visibility === 'public' ? (
                    <Globe className="w-5 h-5 text-success" />
                  ) : (
                    <Lock className="w-5 h-5 text-warning" />
                  )}
                  <div>
                    <Label className="text-base">Story Visibility</Label>
                    <p className="text-sm text-text-secondary">
                      {formData.visibility === 'public' 
                        ? 'Your story is public and discoverable by everyone'
                        : 'Your story is private and only visible to you'
                      }
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formData.visibility === 'public'}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, visibility: checked ? 'public' : 'private' })
                  }
                />
              </div>

              {formData.visibility === 'public' && (
                <div className="p-4 bg-success/10 rounded-lg border border-success/20">
                  <div className="flex items-start gap-2">
                    <Share className="w-5 h-5 text-success mt-0.5" />
                    <div>
                      <p className="font-medium text-success">Story is Public</p>
                      <p className="text-sm text-success/80">
                        Your story will appear in the Discover page and can be read by anyone. 
                        Admins may also feature it on the homepage.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {formData.visibility === 'private' && (
                <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                  <div className="flex items-start gap-2">
                    <Lock className="w-5 h-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-medium text-warning">Story is Private</p>
                      <p className="text-sm text-warning/80">
                        Only you can see this story. It won't appear in search results or the Discover page.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading} className="btn-primary flex-1">
              {loading ? (
                <>
                  <div className="loading-spinner w-4 h-4 mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StorySettings;