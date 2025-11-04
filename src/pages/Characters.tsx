import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import HeroBackground from '@/components/HeroBackground';
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
      <div className="min-h-screen relative">
        <HeroBackground />
        <Navigation />
        <div className="relative z-10 container mx-auto px-4 py-8">
          {/* Header skeleton */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div className="flex-1">
              <div className="h-10 bg-muted rounded w-64 mb-2 animate-pulse" />
              <div className="h-4 bg-muted rounded w-96 animate-pulse" />
            </div>
            <div className="h-10 bg-muted rounded w-40 mt-4 md:mt-0 animate-pulse" />
          </div>

          {/* Character cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Loading.Skeleton.Card count={6} />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <HeroBackground />
      <Navigation />
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-[#F4E3B2] mb-2 tracking-wide">
              My Characters
            </h1>
            <p className="text-lg text-[#C9C5D5]">
              Manage your character library for story creation
            </p>
          </div>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            variant="default"
            size="lg"
            className="mt-4 md:mt-0 bg-[rgba(242,181,68,.15)] text-[#F4E3B2] border border-[rgba(242,181,68,.35)] hover:bg-[rgba(242,181,68,.25)]"
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
          <div className="rounded-2xl bg-[rgba(17,17,22,.85)] backdrop-blur-md ring-1 ring-[rgba(242,181,68,.18)] shadow-[0_12px_48px_rgba(0,0,0,.45)] p-12 text-center">
            <div className="p-4 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Users className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-heading font-semibold text-[#F4E3B2] mb-4">
              No Characters Yet
            </h3>
            <p className="text-[#C9C5D5] mb-6 max-w-md mx-auto">
              Create your first character to start building your story universe. Characters can be reused across multiple stories.
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              variant="default"
              size="lg"
              className="bg-[rgba(242,181,68,.15)] text-[#F4E3B2] border border-[rgba(242,181,68,.35)] hover:bg-[rgba(242,181,68,.25)]"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Character
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {characters.map((character) => (
              <div
                key={character.id}
                className="rounded-2xl bg-[rgba(17,17,22,.85)] backdrop-blur-md ring-1 ring-[rgba(242,181,68,.18)] shadow-[0_12px_48px_rgba(0,0,0,.45)] hover:ring-[rgba(242,181,68,.35)] transition-all duration-300 overflow-hidden group hover:shadow-[0_12px_48px_rgba(242,181,68,.15)]"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-heading font-semibold text-[#F4E3B2] group-hover:text-primary transition-colors duration-200 mb-2">
                        {character.name}
                      </h3>
                      <Badge variant="outline" className="border-primary/30 text-[#C9C5D5]">
                        {character.character_type}
                      </Badge>
                    </div>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-[rgba(242,181,68,.1)] text-[#C9C5D5] hover:text-[#F4E3B2]"
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

                  <p className="text-[#C9C5D5] text-sm mb-3 line-clamp-3">
                    {character.description}
                  </p>

                  {character.personality_traits && character.personality_traits.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {character.personality_traits.slice(0, 3).map((trait, index) => (
                          <Badge key={index} variant="secondary" className="text-xs bg-[rgba(242,181,68,.1)] text-[#F4E3B2] border-primary/30">
                            {trait}
                          </Badge>
                        ))}
                        {character.personality_traits.length > 3 && (
                          <Badge variant="secondary" className="text-xs bg-[rgba(242,181,68,.1)] text-[#F4E3B2] border-primary/30">
                            +{character.personality_traits.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs text-[#C9C5D5] pt-3 border-t border-[rgba(242,181,68,.1)]">
                    <span>Used {character.usage_count} times</span>
                  </div>
                </div>
              </div>
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