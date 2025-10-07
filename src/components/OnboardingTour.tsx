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
    icon: <Sparkles className="w-full h-full text-primary" />
  },
  {
    id: 'create',
    title: '🚀 Create Your First Story',
    description: 'Click "Create Story", choose an age group and genre, then let AI generate a unique interactive adventure. Each choice shapes the story!',
    icon: <BookOpen className="w-full h-full text-primary" />,
    action: {
      label: 'Start Creating',
      path: '/create'
    }
  },
  {
    id: 'credits',
    title: '⚡ You Have 10 Free Credits',
    description: 'Each story chapter costs 1 credit. You start with 10 free credits - enough for your first stories! Add voice narration and images for extra magic.',
    icon: <Zap className="w-full h-full text-primary" />
  },
  {
    id: 'ready',
    title: '🎉 You\'re All Set!',
    description: 'Ready to create your first magical story? Click below to get started, or explore the dashboard to see what\'s possible.',
    icon: <Crown className="w-full h-full text-primary" />,
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
      <DialogContent
        className="max-w-md w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto mx-4 p-4 sm:p-6"
        hideCloseButton
      >
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 flex-wrap">
              <DialogTitle className="text-base sm:text-lg">Getting Started</DialogTitle>
              <Badge variant="secondary" className="text-xs">
                {currentStep + 1} of {TOUR_STEPS.length}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="min-w-[44px] min-h-[44px] flex-shrink-0"
              aria-label="Close onboarding"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <Progress value={progress} className="h-2 mt-3" />
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 mt-4">
          {/* Step Icon */}
          <div className="flex justify-center">
            <div className="p-3 sm:p-4 bg-primary/10 rounded-full">
              <div className="w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center">
                {currentStepData.icon}
              </div>
            </div>
          </div>

          {/* Step Content */}
          <div className="text-center space-y-2 sm:space-y-3 px-2">
            <h3 className="text-lg sm:text-xl font-semibold break-words">
              {currentStepData.title}
            </h3>
            <DialogDescription className="text-sm sm:text-base leading-relaxed break-words">
              {currentStepData.description}
            </DialogDescription>
          </div>

          {/* Action Button */}
          {currentStepData.action && (
            <div className="flex justify-center px-2">
              <Button
                variant="outline"
                onClick={handleAction}
                className="w-full sm:w-auto min-h-[44px]"
              >
                {currentStepData.action.label}
                <ArrowRight className="w-4 h-4 ml-2 flex-shrink-0" />
              </Button>
            </div>
          )}

          {/* Navigation - Mobile: Stack vertically, Desktop: Horizontal */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-2 sm:pt-4">
            {/* Previous button */}
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="w-full sm:w-auto min-h-[44px] order-3 sm:order-1"
            >
              <ArrowLeft className="w-4 h-4 mr-1 flex-shrink-0" />
              Previous
            </Button>

            {/* Right side buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 order-1 sm:order-2">
              {currentStep < TOUR_STEPS.length - 1 && (
                <>
                  <Button
                    variant="ghost"
                    onClick={handleRemindLater}
                    className="w-full sm:w-auto min-h-[44px] text-sm sm:text-base"
                  >
                    Remind Me Later
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    className="w-full sm:w-auto min-h-[44px] text-sm sm:text-base"
                  >
                    Skip Tour
                  </Button>
                </>
              )}
              <Button
                onClick={handleNext}
                className="w-full sm:w-auto min-h-[44px]"
              >
                {currentStep === TOUR_STEPS.length - 1 ? 'Get Started' : 'Next'}
                <ArrowRight className="w-4 h-4 ml-1 flex-shrink-0" />
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