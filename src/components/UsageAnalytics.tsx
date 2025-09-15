import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  Zap, 
  Volume2, 
  Book, 
  ArrowUpRight,
  Calendar,
  Target
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';

interface UsageData {
  stories_created: number;
  voice_minutes_used: number;
  credits_used: number;
}

interface TierLimits {
  credits_per_month: number;
  voice_minutes_per_month: number;
  story_limit: number;
}

const UsageAnalytics = () => {
  const { user } = useAuth();
  const { tier, credits_per_month } = useSubscription();
  const navigate = useNavigate();
  const [usage, setUsage] = useState<UsageData>({
    stories_created: 0,
    voice_minutes_used: 0,
    credits_used: 0
  });
  const [tierLimits, setTierLimits] = useState<TierLimits>({
    credits_per_month: 10,
    voice_minutes_per_month: 0,
    story_limit: 5
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUsageData();
      fetchTierLimits();
    }
  }, [user, tier]);

  const fetchUsageData = async () => {
    try {
      const { data, error } = await supabase.rpc('get_current_month_usage');
      if (error) throw error;
      
      if (data && data[0]) {
        setUsage(data[0]);
      }
    } catch (error) {
      console.error('Error fetching usage data:', error);
    }
  };

  const fetchTierLimits = async () => {
    try {
      const { data, error } = await supabase
        .from('tier_limits')
        .select('*')
        .eq('tier_name', tier)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching tier limits:', error);
        // Use defaults on error
        setTierLimits({
          credits_per_month: credits_per_month || 10,
          voice_minutes_per_month: tier === 'free' ? 0 : 60,
          story_limit: tier === 'free' ? 5 : 100
        });
        return;
      }
        
      if (data) {
        setTierLimits(data);
      } else {
        // Default limits for free tier
        setTierLimits({
          credits_per_month: credits_per_month || 10,
          voice_minutes_per_month: tier === 'free' ? 0 : 60,
          story_limit: tier === 'free' ? 5 : 100
        });
      }
    } catch (error) {
      console.error('Error fetching tier limits:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-destructive';
    if (percentage >= 70) return 'text-warning';
    return 'text-success';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-destructive';
    if (percentage >= 70) return 'bg-warning';
    return 'bg-primary';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-8 bg-muted rounded w-2/3"></div>
            <div className="h-2 bg-muted rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const creditsPercentage = getUsagePercentage(usage.credits_used, tierLimits.credits_per_month);
  const voicePercentage = getUsagePercentage(usage.voice_minutes_used, tierLimits.voice_minutes_per_month);
  const storiesPercentage = getUsagePercentage(usage.stories_created, tierLimits.story_limit);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Monthly Usage</span>
            </CardTitle>
            <CardDescription>Track your current month's activity and limits</CardDescription>
          </div>
          <Badge variant="outline" className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>{new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Credits Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="font-medium">Credits</span>
            </div>
            <div className="text-right">
              <span className={`font-semibold ${getUsageColor(creditsPercentage)}`}>
                {usage.credits_used}
              </span>
              <span className="text-muted-foreground">/{tierLimits.credits_per_month}</span>
            </div>
          </div>
          <Progress 
            value={creditsPercentage} 
            className="h-2"
            style={{ backgroundColor: 'hsl(var(--muted))' }}
          />
          {creditsPercentage >= 80 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-warning">Running low on credits</span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => navigate('/pricing')}
              >
                <ArrowUpRight className="w-3 h-3 mr-1" />
                Get More
              </Button>
            </div>
          )}
        </div>

        {/* Voice Minutes Usage */}
        {tierLimits.voice_minutes_per_month > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-primary" />
                <span className="font-medium">Voice Minutes</span>
              </div>
              <div className="text-right">
                <span className={`font-semibold ${getUsageColor(voicePercentage)}`}>
                  {usage.voice_minutes_used}
                </span>
                <span className="text-muted-foreground">/{tierLimits.voice_minutes_per_month}</span>
              </div>
            </div>
            <Progress 
              value={voicePercentage} 
              className="h-2"
            />
          </div>
        )}

        {/* Stories Created */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Book className="w-4 h-4 text-primary" />
              <span className="font-medium">Stories Created</span>
            </div>
            <div className="text-right">
              <span className={`font-semibold ${getUsageColor(storiesPercentage)}`}>
                {usage.stories_created}
              </span>
              <span className="text-muted-foreground">/{tierLimits.story_limit}</span>
            </div>
          </div>
          <Progress 
            value={storiesPercentage} 
            className="h-2"
          />
        </div>

        {/* Upgrade Prompt */}
        {tier === 'free' && (creditsPercentage >= 70 || storiesPercentage >= 70) && (
          <div className="pt-4 border-t">
            <div className="flex items-center space-x-3 p-3 bg-primary/5 rounded-lg">
              <Target className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">Approaching Limits</p>
                <p className="text-sm text-muted-foreground">
                  Upgrade to continue creating without interruption
                </p>
              </div>
              <Button 
                size="sm"
                onClick={() => navigate('/pricing')}
              >
                <TrendingUp className="w-3 h-3 mr-1" />
                Upgrade
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UsageAnalytics;