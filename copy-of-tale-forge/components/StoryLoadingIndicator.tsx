import React, { useState, useEffect } from 'react';
import { BookOpenIcon, MagicWandIcon, SparklesIcon } from './IconComponents';

const loadingSteps = [
  {
    icon: <MagicWandIcon className="w-16 h-16 text-yellow-300" />,
    message: 'Gathering stardust...',
  },
  {
    icon: <BookOpenIcon className="w-16 h-16 text-sky-300" />,
    message: 'Consulting ancient scrolls...',
  },
  {
    icon: <SparklesIcon className="w-16 h-16 text-pink-400" />,
    message: 'Weaving a magical tale...',
  },
  {
    icon: <MagicWandIcon className="w-16 h-16 text-purple-400" />,
    message: 'Waking the friendly dragons...',
  },
];

const StoryLoadingIndicator: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % loadingSteps.length);
    }, 2500); // Change every 2.5 seconds

    return () => clearInterval(interval);
  }, []);

  const currentStep = loadingSteps[currentIndex];

  return (
    <div className="flex flex-col items-center justify-center text-center text-white p-8">
      <style>{`
        @keyframes fadeInOut {
          0%, 100% { opacity: 0; transform: scale(0.95) rotate(-5deg); }
          20%, 80% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        .animate-fade-in-out {
          animation: fadeInOut 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
      <div key={currentIndex} className="animate-fade-in-out flex flex-col items-center">
        {currentStep.icon}
        <p className="mt-4 text-2xl font-bold tracking-wider font-cinzel">{currentStep.message}</p>
      </div>
    </div>
  );
};

export default StoryLoadingIndicator;
