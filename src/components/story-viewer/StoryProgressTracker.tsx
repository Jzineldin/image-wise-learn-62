import { Check } from 'lucide-react';

interface StoryProgressTrackerProps {
  currentSegmentIndex: number;
  totalSegments: number;
  isCompleted?: boolean;
}

export const StoryProgressTracker = ({
  currentSegmentIndex,
  totalSegments,
  isCompleted = false
}: StoryProgressTrackerProps) => {
  // Generate progress steps based on segments
  const steps = Array.from({ length: Math.min(totalSegments + 2, 7) }, (_, i) => {
    if (i === 0) {
      return {
        label: 'Story Started',
        status: 'completed' as const,
        icon: '✓'
      };
    } else if (i === totalSegments + 1 || i === 6) {
      return {
        label: 'Story Ending',
        status: isCompleted ? 'completed' : i <= currentSegmentIndex + 1 ? 'active' : 'pending' as const,
        icon: '🏁'
      };
    } else {
      const segmentNum = i;
      return {
        label: `Chapter ${segmentNum}`,
        status: segmentNum - 1 < currentSegmentIndex ? 'completed' :
                segmentNum - 1 === currentSegmentIndex ? 'active' : 'pending' as const,
        icon: segmentNum - 1 < currentSegmentIndex ? '✓' : String(segmentNum)
      };
    }
  });

  return (
    <div className="bg-surface/50 backdrop-blur-sm rounded-xl p-4 mb-6 overflow-x-auto border border-border/30">
      <div className="flex gap-3 min-w-max">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300
              ${step.status === 'completed' ? 'bg-success text-white' :
                step.status === 'active' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' :
                'bg-surface text-muted-foreground'}
            `}
          >
            <span className={`
              w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold
              ${step.status === 'pending' ? 'bg-surface-overlay' : 'bg-black/30'}
            `}>
              {step.icon}
            </span>
            <span className="text-sm font-medium whitespace-nowrap">
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};