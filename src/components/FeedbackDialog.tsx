import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageSquare, Bug, Lightbulb, Heart, Send } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/production-logger';

interface FeedbackDialogProps {
  trigger?: React.ReactNode;
  defaultOpen?: boolean;
}

const FeedbackDialog = ({ trigger, defaultOpen = false }: FeedbackDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(defaultOpen);
  const [loading, setLoading] = useState(false);
  const [feedbackType, setFeedbackType] = useState<string>('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const feedbackTypes = [
    { value: 'bug', label: 'Bug Report', icon: Bug, description: 'Something isn\'t working' },
    { value: 'feature', label: 'Feature Request', icon: Lightbulb, description: 'I have an idea' },
    { value: 'general', label: 'General Feedback', icon: MessageSquare, description: 'General thoughts' },
    { value: 'praise', label: 'Praise', icon: Heart, description: 'I love something!' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast({
        title: "Feedback Required",
        description: "Please enter your feedback",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('user_feedback')
        .insert({
          user_id: user?.id,
          feedback_type: feedbackType,
          subject: subject.trim() || null,
          message: message.trim(),
          page_url: window.location.href,
          user_agent: navigator.userAgent,
          metadata: {
            screen_width: window.screen.width,
            screen_height: window.screen.height,
            timestamp: new Date().toISOString(),
          },
        });

      if (error) throw error;

      toast({
        title: "Thank you for your feedback!",
        description: "We'll review it and get back to you if needed.",
      });

      // Reset form
      setSubject('');
      setMessage('');
      setFeedbackType('general');
      setOpen(false);

      logger.info('Feedback submitted', {
        operation: 'submit-feedback',
        feedbackType,
        userId: user?.id,
      });
    } catch (error) {
      logger.error('Error submitting feedback', error, {
        operation: 'submit-feedback',
        userId: user?.id,
      });
      toast({
        title: "Failed to submit feedback",
        description: "Please try again or email us directly.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedType = feedbackTypes.find(t => t.value === feedbackType);
  const Icon = selectedType?.icon || MessageSquare;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Feedback
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Share Your Feedback
          </DialogTitle>
          <DialogDescription>
            Help us improve Tale Forge! We read every piece of feedback and use it to make the product better.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Feedback Type */}
          <div className="space-y-2">
            <Label htmlFor="feedback-type">What kind of feedback?</Label>
            <Select value={feedbackType} onValueChange={setFeedbackType}>
              <SelectTrigger id="feedback-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {feedbackTypes.map((type) => {
                  const TypeIcon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <TypeIcon className="w-4 h-4" />
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Subject (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject (optional)</Label>
            <Input
              id="subject"
              placeholder="Brief summary of your feedback"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Your Feedback *</Label>
            <Textarea
              id="message"
              placeholder={
                feedbackType === 'bug'
                  ? 'What happened? What did you expect to happen? Steps to reproduce...'
                  : feedbackType === 'feature'
                  ? 'Describe the feature you\'d like to see and how it would help you...'
                  : feedbackType === 'praise'
                  ? 'What do you love about Tale Forge?'
                  : 'Share your thoughts, ideas, or suggestions...'
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              required
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Be as detailed as possible. We read every message!
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !message.trim()}
              className="gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Feedback
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Footer Note */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Tip:</strong> For urgent issues, email us directly at{' '}
            <a
              href="mailto:kevin.elzarka@tale-forge.app"
              className="text-primary hover:underline"
            >
              kevin.elzarka@tale-forge.app
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDialog;

