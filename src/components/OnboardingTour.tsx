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
    title: 'Welcome to Tale Forge!',
    description: 'Create magical, interactive stories with AI. Let\'s take a quick tour to get you started.',
    icon: <Sparkles className="w-8 h-8 text-primary" />
  },
  {
    id: 'create',
    title: 'Create Your First Story',
    description: 'Choose age groups, genres, and characters to generate personalized interactive stories.',
    icon: <BookOpen className="w-8 h-8 text-primary" />,
    action: {
      label: 'Try Creating',
      path: '/create'
    }
  },
  {
    id: 'characters',
    title: 'Build Character Library',
    description: 'Create and manage custom characters to star in your stories.',
    icon: <Users className="w-8 h-8 text-primary" />,
    action: {
      label: 'View Characters',
      path: '/characters'
    }
  },
  {
    id: 'watch-mode',
    title: 'Watch Mode',
    description: 'Experience stories with automatic narration and smooth transitions between scenes.',
    icon: <Eye className="w-8 h-8 text-primary" />
  },
  {
    id: 'voice',
    title: 'Voice Narration',
    description: 'Premium feature: Add AI-generated voice narration to bring stories to life.',
    icon: <Volume2 className="w-8 h-8 text-primary" />
  },
  {
    id: 'credits',
    title: 'Credits System',
    description: 'Each story generation uses credits. Start with 10 free credits, then upgrade for more.',
    icon: <Zap className="w-8 h-8 text-primary" />
  },
  {
    id: 'upgrade',
    title: 'Unlock Premium Features',
    description: 'Upgrade to get more credits, priority generation, voice narration, and advanced features.',
    icon: <Crown className="w-8 h-8 text-primary" />,
    action: {
      label: 'View Pricing',
      path: '/pricing'
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
                <Button variant="ghost" size="sm" onClick={handleSkip}>
                  Skip Tour
                </Button>
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
      const timer = setTimeout(() => setShowTour(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [user, onboardingCompleted, setOnboardingCompleted]);

  const startTour = () => setShowTour(true);
  const closeTour = () => setShowTour(false);

  return { showTour, startTour, closeTour };
};

export default OnboardingTour;