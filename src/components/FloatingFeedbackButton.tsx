import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import FeedbackDialog from './FeedbackDialog';

const FloatingFeedbackButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={() => setOpen(true)}
          variant="default"
          size="lg"
          className="shadow-2xl hover:shadow-3xl rounded-full w-14 h-14 p-0 animate-pulse hover:animate-none"
          aria-label="Send feedback"
        >
          <MessageSquare className="w-6 h-6" />
        </Button>
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
          <div className="glass-card px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
            <p className="text-sm font-medium">Send Feedback</p>
            <p className="text-xs text-muted-foreground">We read every message!</p>
          </div>
        </div>
      </div>

      {/* Dialog */}
      <FeedbackDialog defaultOpen={open} />
    </>
  );
};

export default FloatingFeedbackButton;

