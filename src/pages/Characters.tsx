import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useCharacters } from '@/hooks/useCharacters';
import { CreateCharacterDialog } from '@/components/story-creation/CreateCharacterDialog';
import { UserCharacter } from '@/types/character';
import { useToast } from '@/hooks/use-toast';
import { Loading } from '@/components/ui/loading';
import { ErrorInline } from '@/components/ui/error-alert';

const Characters = () => {
  const { characters, loading, error, deleteCharacter, refetch } = useCharacters();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleDeleteCharacter = async (id: string) => {
    try {
      await deleteCharacter(id);
      toast({
        title: "Character deleted",
        description: "Character has been removed from your library.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete character. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCharacterCreated = (character: UserCharacter) => {
    setIsCreateDialogOpen(false);
    refetch(); // Refresh the list
    toast({
      title: "Character created",
      description: `${character.name} has been added to your character library.`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          {/* Header skeleton */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div className="flex-1">
              <div className="h-10 bg-muted rounded w-64 mb-2 animate-pulse" />
              <div className="h-4 bg-muted rounded w-96 animate-pulse" />
            </div>
            <div className="h-10 bg-muted rounded w-40 mt-4 md:mt-0 animate-pulse" />
          </div>

          {/* Character cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Loading.Skeleton.Card count={6} />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
          <div className="content-overlay flex-1">
            <h1 className="text-4xl font-heading font-bold text-gradient mb-2">
              My Characters
            </h1>
            <p className="text-xl text-text-secondary">
              Manage your character library for story creation
            </p>
          </div>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            variant="default"
            size="lg"
            className="mt-4 md:mt-0"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Character
          </Button>
        </div>

        {error && (
          <div className="mb-8">
            <ErrorInline message={error} className="text-center" />
          </div>
        )}

        {/* Characters Grid */}
        {characters.length === 0 ? (
          <div className="glass-card-elevated p-12 text-center">
            <Users className="w-16 h-16 text-primary mx-auto mb-4 opacity-50" />
            <h3 className="text-2xl font-heading font-semibold mb-4">
              No Characters Yet
            </h3>
            <p className="text-text-secondary mb-6 max-w-md mx-auto">
              Create your first character to start building your story universe. Characters can be reused across multiple stories.
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              variant="default"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Character
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {characters.map((character) => (
              <Card key={character.id} className="glass-card-interactive group">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {character.name}
                      </CardTitle>
                      <Badge variant="outline" className="mt-1">
                        {character.character_type}
                      </Badge>
                    </div>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-primary/10"
                        aria-label={`Edit ${character.name}`}
                      >
                        <Edit className="w-4 h-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-destructive/10 text-destructive"
                        onClick={() => handleDeleteCharacter(character.id)}
                        aria-label={`Delete ${character.name}`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-text-secondary text-sm mb-3 line-clamp-3">
                    {character.description}
                  </p>
                  
                  {character.personality_traits && character.personality_traits.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {character.personality_traits.slice(0, 3).map((trait, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {trait}
                          </Badge>
                        ))}
                        {character.personality_traits.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{character.personality_traits.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs text-text-secondary">
                    <span>Used {character.usage_count} times</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Character Dialog */}
      <CreateCharacterDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCharacterCreated={handleCharacterCreated}
      />

      <Footer />
    </div>
  );
};

export default Characters;