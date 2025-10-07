import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { Crown } from 'lucide-react';

/**
 * Hook to display a welcome toast for new founders
 * Shows once per user on their first login after becoming a founder
 */
export const useFounderWelcome = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user || !profile) return;

    // Only show for beta users (founders)
    if (!profile.is_beta_user) return;

    // Check if we've already shown the welcome message
    const welcomeKey = `founder-welcomed-${user.id}`;
    const hasBeenWelcomed = localStorage.getItem(welcomeKey);

    if (hasBeenWelcomed) return;

    // Show welcome toast
    toast({
      title: "🎉 Welcome, Founder!",
      description: "You received 100 FREE credits as a Beta Founder. Thank you for being an early supporter!",
      duration: 10000,
    });

    // Mark as welcomed
    localStorage.setItem(welcomeKey, 'true');
  }, [user, profile, toast]);
};
