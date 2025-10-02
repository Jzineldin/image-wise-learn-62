import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { logger } from '@/lib/logger';
import { 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Sparkles, 
  Users, 
  Volume2, 
  Crown,
  Eye,
  Settings,
  BookOpen,
  Zap
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    path: string;
  };
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: '✨ Welcome to Tale Forge!',
    description: 'Create magical, AI-powered interactive stories in minutes. Choose your genre, add characters, and watch the magic happen!',
    icon: <Sparkles className="w-12 h-12 text-primary" />
  },
  {
    id: 'create',
    title: '🚀 Create Your First Story',
    description: 'Click "Create Story", choose an age group and genre, then let AI generate a unique interactive adventure. Each choice shapes the story!',
    icon: <BookOpen className="w-12 h-12 text-primary" />,
    action: {
      label: 'Start Creating',
      path: '/create'
    }
  },
  {
    id: 'credits',
    title: '⚡ You Have 10 Free Credits',
    description: 'Each story chapter costs 1 credit. You start with 10 free credits - enough for your first stories! Add voice narration and images for extra magic.',
    icon: <Zap className="w-12 h-12 text-primary" />
  },
  {
    id: 'ready',
    title: '🎉 You\'re All Set!',
    description: 'Ready to create your first magical story? Click below to get started, or explore the dashboard to see what\'s possible.',
    icon: <Crown className="w-12 h-12 text-primary" />,
    action: {
      label: 'Create My First Story',
      path: '/create'
    }
  }
];

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

const OnboardingTour = ({ isOpen, onClose }: OnboardingTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setOnboardingCompleted } = useUIStore();

  const currentStepData = TOUR_STEPS[currentStep];
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

  const persistCompletion = () => {
    try {
      localStorage.setItem('onboardingCompleted', 'true');
    } catch (error) {
      logger.warn('Unable to persist onboarding completion', error);
    }
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleRemindLater = () => {
    // Don't mark as completed, just close
    onClose();
    // Optional: Show a toast notification
    logger.info('User chose to be reminded later about onboarding');
  };

  const handleFinish = () => {
    persistCompletion();
    setOnboardingCompleted(true);
    onClose();
  };

  const handleAction = () => {
    if (currentStepData.action) {
      onClose();
      navigate(currentStepData.action.path);
    }
  };

  const handleClose = () => {
    persistCompletion();
    setOnboardingCompleted(true);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" hideCloseButton>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DialogTitle>Getting Started</DialogTitle>
              <Badge variant="secondary">
                {currentStep + 1} of {TOUR_STEPS.length}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <Progress value={progress} className="h-2" />
        </DialogHeader>

        <div className="space-y-6">
          {/* Step Icon */}
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-full">
              {currentStepData.icon}
            </div>
          </div>

          {/* Step Content */}
          <div className="text-center space-y-3">
            <h3 className="text-xl font-semibold">{currentStepData.title}</h3>
            <DialogDescription className="text-base leading-relaxed">
              {currentStepData.description}
            </DialogDescription>
          </div>

          {/* Action Button */}
          {currentStepData.action && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={handleAction}>
                {currentStepData.action.label}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4">
            <div className="flex space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
            </div>

            <div className="flex space-x-2">
              {currentStep < TOUR_STEPS.length - 1 && (
                <>
                  <Button variant="ghost" size="sm" onClick={handleRemindLater}>
                    Remind Me Later
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleSkip}>
                    Skip Tour
                  </Button>
                </>
              )}
              <Button onClick={handleNext}>
                {currentStep === TOUR_STEPS.length - 1 ? 'Get Started' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook to manage onboarding state
export const useOnboarding = () => {
  const [showTour, setShowTour] = useState(false);
  const { user } = useAuth();
  const { onboardingCompleted, setOnboardingCompleted } = useUIStore();

  useEffect(() => {
    if (!user) return;

    // Merge persisted sources
    const local = (() => { try { return localStorage.getItem('onboardingCompleted') === 'true'; } catch { return false; } })();
    if (local && !onboardingCompleted) {
      setOnboardingCompleted(true);
    }

    const hasCompleted = onboardingCompleted || local;
    if (!hasCompleted) {
      const timer = setTimeout(() => setShowTour(true), 3000); // 3 seconds delay
      return () => clearTimeout(timer);
    }
  }, [user, onboardingCompleted, setOnboardingCompleted]);

  const startTour = () => setShowTour(true);
  const closeTour = () => setShowTour(false);

  return { showTour, startTour, closeTour };
};

export default OnboardingTour;