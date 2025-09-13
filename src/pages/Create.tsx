import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useStoryStore } from '@/stores/storyStore';
import { AGE_GROUPS, GENRES } from '@/types';
import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

const Create = () => {
  const navigate = useNavigate();
  const { creationState, updateCreationState } = useStoryStore();
  const [step, setStep] = useState(1);

  const handleAgeSelect = (ageGroup: string) => {
    updateCreationState({ age_group: ageGroup });
    setStep(2);
  };

  const handleGenreToggle = (genre: string) => {
    const genres = creationState.genres.includes(genre)
      ? creationState.genres.filter(g => g !== genre)
      : [...creationState.genres, genre];
    updateCreationState({ genres });
  };

  const handleNext = () => {
    if (step === 2 && creationState.genres.length > 0) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleStartCreating = () => {
    // Navigate to story creation with prompt input
    navigate('/create/story');
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="content-overlay max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-heading font-bold text-gradient mb-4">
                Create Your Story
              </h1>
              <p className="text-xl text-text-secondary">
                Let's craft a magical tale together in just 3 simple steps
              </p>
            </div>
          </div>

          {/* Enhanced Progress Steps */}
          <div className="flex items-center justify-center mb-12">
            <div className="flex items-center space-x-2 md:space-x-4">
              {[
                { num: 1, label: 'Age Group' },
                { num: 2, label: 'Genres' },
                { num: 3, label: 'Create' }
              ].map((stepInfo, index) => (
                <div key={stepInfo.num} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-medium transition-all duration-300 ${
                      stepInfo.num <= step 
                        ? 'bg-primary text-white glow-amber' 
                        : 'bg-surface border border-primary/30 text-text-tertiary'
                    }`}>
                      {stepInfo.num}
                    </div>
                    <span className={`text-xs md:text-sm mt-2 transition-colors ${
                      stepInfo.num <= step ? 'text-primary' : 'text-text-tertiary'
                    }`}>
                      {stepInfo.label}
                    </span>
                  </div>
                  {index < 2 && (
                    <div className={`w-8 md:w-16 h-0.5 mx-2 transition-colors duration-300 ${
                      stepInfo.num < step ? 'bg-primary' : 'bg-surface'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Age Selection - Enhanced */}
          {step === 1 && (
            <div className="glass-card-elevated p-8 animate-fade-in">
              <h2 className="text-2xl font-heading font-semibold text-center mb-4">
                Who is this story for?
              </h2>
              <p className="text-text-secondary text-center mb-8">
                Choose the age group to personalize vocabulary and themes
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {AGE_GROUPS.map((age) => (
                  <button
                    key={age.value}
                    onClick={() => handleAgeSelect(age.value)}
                    className="glass-card-interactive p-6 text-left group hover-scale"
                  >
                    <h3 className="text-xl font-semibold text-primary group-hover:text-primary-hover mb-2 transition-colors">
                      {age.label}
                    </h3>
                    <p className="text-text-secondary group-hover:text-text-primary transition-colors">
                      {age.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Genre Selection - Enhanced */}
          {step === 2 && (
            <div className="glass-card-elevated p-8 animate-fade-in">
              <h2 className="text-2xl font-heading font-semibold text-center mb-4">
                What genre would you like?
              </h2>
              <p className="text-text-secondary text-center mb-8">
                Select one or more genres to shape your story's adventure
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {GENRES.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => handleGenreToggle(genre)}
                    className={`glass-card-interactive p-4 text-center transition-all duration-300 ${
                      creationState.genres.includes(genre)
                        ? 'border-primary bg-primary/10 glow-amber'
                        : ''
                    }`}
                  >
                    <span className={`font-medium transition-colors ${
                      creationState.genres.includes(genre)
                        ? 'text-primary'
                        : 'text-text-primary'
                    }`}>
                      {genre}
                    </span>
                  </button>
                ))}
              </div>
              
              <div className="flex justify-between">
                <Button onClick={handleBack} variant="outline" className="btn-secondary">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={handleNext} 
                  disabled={creationState.genres.length === 0}
                  className="btn-primary"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Ready to Create - Enhanced */}
          {step === 3 && (
            <div className="glass-card-elevated p-8 text-center animate-fade-in">
              <div className="mb-8">
                <h2 className="text-2xl font-heading font-semibold mb-4 text-with-shadow">
                  Ready to Create Magic!
                </h2>
                <p className="text-text-secondary mb-6">
                  You've selected <strong className="text-primary">{creationState.age_group}</strong> age group
                  with <strong className="text-primary">{creationState.genres.join(', ')}</strong> genres.
                </p>
              </div>
              
              <div className="flex justify-between">
                <Button onClick={handleBack} variant="outline" className="btn-secondary">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleStartCreating} className="btn-primary text-lg px-8">
                  Start Creating
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Create;