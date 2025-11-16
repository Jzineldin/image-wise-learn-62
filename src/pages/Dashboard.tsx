import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Book, Users, TrendingUp, Zap, Crown, Sparkles, Settings, Compass, Lock, Globe, CheckCircle, Edit3, MoreVertical } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import FloatingFeedbackButton from '@/components/FloatingFeedbackButton';
import HeroBackground from '@/components/HeroBackground';
import { GlassCard } from '@/components/ui/glass-card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useStories } from '@/hooks/useDataFetching';
import { logger } from '@/lib/logger';
import { Loading } from '@/components/ui/loading';
import { useFounderWelcome } from '@/hooks/useFounderWelcome';
import FounderBadge from '@/components/FounderBadge';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

// Status badge component for story lifecycle
const StoryStatusBadge = ({ story }: { story: any }) => {
  const lifecycleStatus = story.lifecycle_status || (story.status === 'completed' ? 'finalized' : 'draft');
  const visibility = story.visibility || (story.is_public ? 'public' : 'private');

  if (lifecycleStatus === 'finalized') {
    return (
      <Badge variant="default" className="gap-1.5">
        {visibility === 'public' ? (
          <>
            <Globe className="w-3 h-3" />
            Public
          </>
        ) : (
          <>
            <Lock className="w-3 h-3" />
            Private
          </>
        )}
      </Badge>
    );
  } else if (lifecycleStatus === 'ready') {
    return (
      <Badge variant="secondary" className="gap-1.5 bg-yellow-500/15 text-yellow-200 border-yellow-500/30">
        <CheckCircle className="w-3 h-3" />
        Ready
      </Badge>
    );
  } else {
    return (
      <Badge variant="outline" className="gap-1.5">
        <Edit3 className="w-3 h-3" />
        Draft
      </Badge>
    );
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    storiesCreated: 0,
    totalViews: 0,
    totalLikes: 0,
    followers: 0,
    creditsUsed: 0,
    voiceMinutes: 0
  });
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();
  const { tier, subscribed } = useSubscription();
  const { data: stories = [], isLoading: storiesLoading } = useStories();

  // Show welcome toast for new founders
  useFounderWelcome();

  // Separate stories by lifecycle status
  const { draftStories, readyStories, finalizedStories } = useMemo(() => {
    const drafts = stories
      .filter((story: any) => story.lifecycle_status === 'draft' || (!story.lifecycle_status && story.status !== 'completed'))
      .slice(0, 4)
      .map((story: any) => ({
        ...story,
        segment_count: story.story_segments?.length || 0,
        audio_segments: story.story_segments?.filter((seg: any) => seg.audio_url).length || 0,
        content_segments: story.story_segments?.filter((seg: any) => seg.content?.trim().length > 0).length || 0,
      }));

    const ready = stories
      .filter((story: any) => story.lifecycle_status === 'ready')
      .slice(0, 4)
      .map((story: any) => ({
        ...story,
        segment_count: story.story_segments?.length || 0,
      }));

    const finalized = stories
      .filter((story: any) => story.lifecycle_status === 'finalized' || (story.status === 'completed' && !story.lifecycle_status))
      .slice(0, 8)
      .map((story: any) => ({
        ...story,
        segment_count: story.story_segments?.length || 0,
      }));

    return { draftStories: drafts, readyStories: ready, finalizedStories: finalized };
  }, [stories]);

  useEffect(() => {
    if (user && !storiesLoading) {
      loadDashboardData();
    }
  }, [user, storiesLoading]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get current month usage statistics
      const { data: usageStats, error: usageError } = await supabase.rpc('get_current_month_usage');

      // Calculate stats based on stories from React Query
      const totalStories = stories?.length || 0;
      const monthlyStats = usageStats?.[0] || { credits_used: 0, voice_minutes_used: 0 };

      setStats({
        storiesCreated: totalStories,
        totalViews: 0, // Would need analytics table
        totalLikes: 0, // Would need likes table
        followers: 0,  // Would need followers table
        creditsUsed: monthlyStats.credits_used || 0,
        voiceMinutes: monthlyStats.voice_minutes_used || 0
      });
    } catch (error) {
      logger.error('Error loading dashboard data', error, { operation: 'load_dashboard_data' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      <HeroBackground />
      <Navigation />
      <FloatingFeedbackButton />
      <div className="relative z-10 container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-[#F4E3B2] tracking-wide">
              Welcome back,
            </h1>
            {profile?.is_beta_user && (
              <FounderBadge
                founderStatus={profile.founder_status}
                isBetaUser={profile.is_beta_user}
                betaJoinedAt={profile.beta_joined_at}
                size="lg"
                showLabel
              />
            )}
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-[#F4E3B2] tracking-wide mb-6">
            Storyteller!
          </h1>
          <p className="text-lg md:text-xl text-[#C9C5D5] mb-8">
            Ready to write new adventures...
          </p>
          <Button
            onClick={() => navigate('/create')}
            size="lg"
            className="bg-[rgba(242,181,68,.15)] text-[#F4E3B2] border-2 border-[rgba(242,181,68,.35)] hover:bg-[rgba(242,181,68,.25)] px-12 py-6 text-xl font-heading rounded-2xl shadow-[0_8px_32px_rgba(242,181,68,.2)] hover:shadow-[0_8px_32px_rgba(242,181,68,.3)] transition-all duration-300"
          >
            Create New Story
          </Button>
        </div>

        {/* Compact Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <GlassCard padding="sm" className="hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[#F4E3B2] font-heading text-sm tracking-wide uppercase opacity-80">Stories Created</p>
                <p className="text-2xl font-heading font-bold text-[#F4E3B2]">
                  {stats.storiesCreated} <span className="text-sm text-[#C9C5D5] font-normal">/ Unlimited</span>
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard padding="sm" className="hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[#F4E3B2] font-heading text-sm tracking-wide uppercase opacity-80">Voice Minutes</p>
                <p className="text-2xl font-heading font-bold text-[#F4E3B2]">
                  {stats.voiceMinutes} <span className="text-sm text-[#C9C5D5] font-normal">/ 50</span>
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard padding="sm" className="hover:-translate-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[#F4E3B2] font-heading text-sm tracking-wide uppercase opacity-80">Monthly Usage</p>
                <p className="text-2xl font-heading font-bold text-[#F4E3B2]">
                  <button onClick={() => navigate('/discover')} className="text-[#C9C5D5] hover:text-primary transition-colors text-sm font-normal">
                    Discover Stories
                  </button>
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* In-Progress Stories - Large Visual Thumbnails */}
        {loading || storiesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Loading.Skeleton.Card count={3} />
          </div>
        ) : draftStories.length === 0 && readyStories.length === 0 && finalizedStories.length === 0 ? (
          <div className="text-center py-16 mb-12">
            <div className="p-6 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Book className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-2xl font-heading font-semibold text-[#F4E3B2] mb-3">No stories yet</h3>
            <p className="text-[#C9C5D5] text-lg mb-8">
              Create your first magical story adventure!
            </p>
            <Button
              onClick={() => navigate('/create')}
              variant="default"
              size="lg"
              className="bg-[rgba(242,181,68,.15)] text-[#F4E3B2] border-2 border-[rgba(242,181,68,.35)] hover:bg-[rgba(242,181,68,.25)] px-8 py-4 text-lg font-heading rounded-xl"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Create Your First Story
            </Button>
          </div>
        ) : draftStories.length > 0 || readyStories.length > 0 ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-[#F4E3B2] tracking-wide">
                CONTINUE YOUR ADVENTURE
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {[...draftStories, ...readyStories].map((story) => {
                const lifecycleStatus = story.lifecycle_status || (story.status === 'completed' ? 'finalized' : 'draft');
                const isReady = lifecycleStatus === 'ready';

                return (
                <div
                  key={story.id}
                  className="group relative"
                >
                  <Link to={`/story/${story.id}`} className="block">
                    <div className="rounded-3xl overflow-hidden ring-1 ring-[rgba(242,181,68,.18)] hover:ring-[rgba(242,181,68,.35)] shadow-[0_12px_48px_rgba(0,0,0,.45)] hover:shadow-[0_12px_48px_rgba(242,181,68,.2)] transition-all duration-300 hover:-translate-y-2 bg-[rgba(17,17,22,.85)] backdrop-blur-md relative">
                      {/* Story Image - 4:3 landscape aspect ratio */}
                      <div className="aspect-[4/3] w-full overflow-hidden relative">
                        {story.preview_image_url ? (
                          <img
                            src={story.preview_image_url}
                            alt={story.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : story.story_segments?.[0]?.image_url ? (
                          <img
                            src={story.story_segments[0].image_url}
                            alt={story.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                            <Book className="w-20 h-20 text-primary/50" />
                          </div>
                        )}
                        {/* Overlay gradient for better text visibility */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                        {/* Status Badge - Top right */}
                        <div className="absolute top-3 right-3">
                          <StoryStatusBadge story={story} />
                        </div>

                        {/* Story Info - Overlaid on bottom of image */}
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="font-heading font-bold text-white text-lg mb-1 drop-shadow-lg">
                            {story.title}
                          </h3>
                          {story.segment_count > 0 && (
                            <p className="text-white/80 text-sm drop-shadow">
                              {story.segment_count} {story.segment_count === 1 ? 'segment' : 'segments'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Quick Actions Menu - Top left, only visible on hover */}
                  <div className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 w-8 p-0 bg-black/60 hover:bg-black/80 backdrop-blur-sm border-white/20"
                          onClick={(e) => e.preventDefault()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {isReady && (
                          <>
                            <DropdownMenuItem onClick={() => navigate(`/story/${story.id}/ready`)}>
                              <Settings className="w-4 h-4 mr-2" />
                              Manage Assets
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem onClick={() => navigate(`/story/${story.id}`)}>
                          <Book className="w-4 h-4 mr-2" />
                          Continue Story
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/my-stories')}>
                          View All Stories
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                );
              })}
          </div>
          </>
        ) : null}

        {/* Finalized Stories Section */}
        {finalizedStories.length > 0 && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-[#F4E3B2] tracking-wide">
                FINALIZED STORIES
              </h2>
              {finalizedStories.length > 8 && (
                <Link to="/my-stories">
                  <Button
                    variant="outline"
                    className="text-[#C9C5D5] hover:text-[#F4E3B2] border-[rgba(242,181,68,.25)] hover:border-[rgba(242,181,68,.45)]"
                  >
                    View All Stories
                  </Button>
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
              {finalizedStories.map((story: any) => {
              const segmentCount = story.story_segments?.length || 0;
              const visibility = story.visibility || (story.is_public ? 'public' : 'private');

              return (
                <div
                  key={story.id}
                  className="group relative"
                >
                  <Link to={`/story/${story.id}`} className="block">
                    <div className="rounded-2xl overflow-hidden ring-1 ring-[rgba(242,181,68,.15)] hover:ring-[rgba(242,181,68,.3)] shadow-lg hover:shadow-[0_8px_32px_rgba(242,181,68,.15)] transition-all duration-300 hover:-translate-y-1 bg-[rgba(17,17,22,.75)] backdrop-blur-sm relative">
                      {/* Image Container */}
                      <div className="aspect-square w-full overflow-hidden relative">
                        {story.preview_image_url ? (
                          <img
                            src={story.preview_image_url}
                            alt={story.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : story.story_segments?.[0]?.image_url ? (
                          <img
                            src={story.story_segments[0].image_url}
                            alt={story.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center">
                            <Book className="w-12 h-12 text-primary/40" />
                          </div>
                        )}
                        {/* Gradient overlay for text readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                        {/* Status Badge - Top right */}
                        <div className="absolute top-2 right-2">
                          <StoryStatusBadge story={story} />
                        </div>

                        {/* Story Info Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <h4 className="font-heading font-bold text-white text-sm mb-1 drop-shadow-lg line-clamp-2">
                            {story.title}
                          </h4>
                          {segmentCount > 0 && (
                            <p className="text-white/70 text-xs drop-shadow">
                              {segmentCount} {segmentCount === 1 ? 'segment' : 'segments'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Quick Actions Menu - Top left, only visible on hover */}
                  <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 w-7 p-0 bg-black/60 hover:bg-black/80 backdrop-blur-sm border-white/20"
                          onClick={(e) => e.preventDefault()}
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => navigate(`/story/${story.id}/viewer`)}>
                          <Book className="w-4 h-4 mr-2" />
                          Read Story
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/story/${story.id}/ready`)}>
                          <Edit3 className="w-4 h-4 mr-2" />
                          Manage Assets
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {visibility === 'public' && (
                          <DropdownMenuItem onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/story/${story.id}/viewer`);
                          }}>
                            <Globe className="w-4 h-4 mr-2" />
                            Copy Public Link
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => navigate('/my-stories')}>
                          View All Stories
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
          </>
        )}

        {/* Quick Actions Sidebar */}
        <GlassCard className="mb-10">
          <h3 className="text-2xl font-heading font-bold text-[#F4E3B2] tracking-wide mb-6 uppercase">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/discover')}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-[rgba(242,181,68,.08)] transition-colors duration-200 group text-left"
            >
              <div className="p-2 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg">
                <Compass className="w-5 h-5 text-primary" />
              </div>
              <span className="text-[#C9C5D5] group-hover:text-[#F4E3B2] font-medium transition-colors">
                Discover Stories
              </span>
            </button>

            <button
              onClick={() => navigate('/characters')}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-[rgba(242,181,68,.08)] transition-colors duration-200 group text-left"
            >
              <div className="p-2 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <span className="text-[#C9C5D5] group-hover:text-[#F4E3B2] font-medium transition-colors">
                My Characters
              </span>
            </button>

            <button
              onClick={() => navigate('/settings')}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-[rgba(242,181,68,.08)] transition-colors duration-200 group text-left"
            >
              <div className="p-2 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <span className="text-[#C9C5D5] group-hover:text-[#F4E3B2] font-medium transition-colors">
                Settings & Analytics
              </span>
            </button>
          </div>
        </GlassCard>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;