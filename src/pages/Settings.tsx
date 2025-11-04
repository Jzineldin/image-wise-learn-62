import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, User, Bell, Globe, Shield, CreditCard, Palette, ArrowUp } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { useLanguage } from '@/hooks/useLanguage';
import { ThemeSelect, ThemeStatus } from '@/components/ThemeToggle';
import { usePageThemeClasses } from '@/components/ThemeProvider';
import { useSubscription } from '@/hooks/useSubscription';
import { Loading } from '@/components/ui/loading';
import FounderBadge from '@/components/FounderBadge';
import HeroBackground from '@/components/HeroBackground';

interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  preferred_language: string;
  subscription_tier: string;
  credits: number;
}

const Settings = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState({
    email_stories: true,
    email_updates: false,
    push_notifications: true,
  });
  const [visibilitySettings, setVisibilitySettings] = useState({
    public_profile: false,
    discoverable_stories: true,
  });
  const { user, profile: authProfile } = useAuth();
  const { toast } = useToast();
  const { subscribed, tier, openCustomerPortal, checkSubscription, loading: subLoading } = useSubscription();
  const { availableLanguages, translate } = useLanguage();
  const { pageClassName } = usePageThemeClasses('settings');

  const [activeSection, setActiveSection] = useState<string>('profile');

  const safeSetItem = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      logger.warn(`Unable to persist ${key}`, error);
    }
  };

  useEffect(() => {
    const ids = ['profile','theme','notifications','privacy','account'];
    const observers: IntersectionObserver[] = [];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            setActiveSection(id);
            try { history.replaceState(null, '', `#${id}`); } catch (error) { logger.warn('Unable to update URL hash', error); }
          }
        });
      }, { threshold: [0.5] });
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);

      // Load current credits from user_credits
      const { data: creditsData } = await supabase
        .from('user_credits')
        .select('current_balance')
        .eq('user_id', user.id)
        .single();
      if (creditsData) setUserCredits(creditsData.current_balance);

      // Load visibility settings
      const { data: visibilityData } = await supabase.rpc('get_visibility_settings');
      if (visibilityData) {
        const settings = visibilityData.reduce((acc: any, item: any) => {
          acc[item.setting_key] = item.setting_value;
          return acc;
        }, {});

        setVisibilitySettings({
          public_profile: settings.public_profile?.enabled || false,
          discoverable_stories: settings.discoverable_stories?.enabled !== false,
        });
      }
    } catch (error) {
      logger.error('Error fetching profile', error, { operation: 'fetch_profile' });
      toast({
        title: "Error",
        description: "Failed to load profile settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user || !profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          display_name: profile.display_name,
          bio: profile.bio,
          preferred_language: profile.preferred_language,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your profile settings have been updated.",
      });
    } catch (error) {
      logger.error('Error saving profile', error, { operation: 'save_profile' });
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateVisibilitySetting = async (key: string, value: boolean) => {
    try {
      await supabase.rpc('set_visibility_setting', {
        p_setting_key: key,
        p_setting_value: { enabled: value }
      });

      setVisibilitySettings(prev => ({ ...prev, [key]: value }));

      toast({
        title: "Setting updated",
        description: `${key.replace('_', ' ')} setting has been updated.`,
      });
    } catch (error) {
      logger.error('Error updating visibility setting', error, { operation: 'update_visibility', key, value });
      toast({
        title: "Error",
        description: "Failed to update setting.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative">
        <HeroBackground />
        <Navigation />
        <div className="relative z-10 container mx-auto px-4 py-8">
          {/* Header skeleton */}
          <div className="mb-8">
            <div className="h-10 bg-muted rounded w-48 mb-2 animate-pulse" />
            <div className="h-4 bg-muted rounded w-96 animate-pulse" />
          </div>

          {/* Settings cards skeleton */}
          <div className="grid gap-6 max-w-4xl">
            {/* Profile card skeleton */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Loading.Skeleton.Avatar size="lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-6 bg-muted rounded w-48 animate-pulse" />
                    <div className="h-4 bg-muted rounded w-64 animate-pulse" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                <Loading.Skeleton.Text lines={4} />
                <Loading.Skeleton.Button className="w-32" />
              </CardContent>
            </Card>

            {/* Additional settings cards skeleton */}
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-48 animate-pulse" />
                </CardHeader>
                <CardContent className="pt-0">
                  <Loading.Skeleton.Text lines={3} />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen relative">
        <HeroBackground />
        <Navigation />
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-[#C9C5D5]">Profile not found</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative ${pageClassName}`}>
      <HeroBackground />
      <Navigation />
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="content-overlay mb-12">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-[#F4E3B2] mb-2 tracking-wide">
            Settings
          </h1>
          <p className="text-lg text-[#C9C5D5]">
            Manage your account preferences and settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="space-y-4 lg:sticky lg:top-24 self-start">
            <div className="rounded-2xl bg-[rgba(17,17,22,.85)] backdrop-blur-md ring-1 ring-[rgba(242,181,68,.18)] shadow-[0_12px_48px_rgba(0,0,0,.45)] p-4">
              <div className="space-y-2">
                <a href="#profile" onClick={() => setActiveSection('profile')} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${activeSection==='profile' ? 'bg-[rgba(242,181,68,.15)] text-[#F4E3B2]' : 'text-[#C9C5D5] hover:bg-[rgba(242,181,68,.08)]'}`}>
                  <User className="w-4 h-4" />
                  <span className="font-medium">Profile</span>
                </a>
                <a href="#notifications" onClick={() => setActiveSection('notifications')} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${activeSection==='notifications' ? 'bg-[rgba(242,181,68,.15)] text-[#F4E3B2]' : 'text-[#C9C5D5] hover:bg-[rgba(242,181,68,.08)]'}`}>
                  <Bell className="w-4 h-4" />
                  <span>Notifications</span>
                </a>
                <a href="#theme" onClick={() => setActiveSection('theme')} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${activeSection==='theme' ? 'bg-[rgba(242,181,68,.15)] text-[#F4E3B2]' : 'text-[#C9C5D5] hover:bg-[rgba(242,181,68,.08)]'}`}>
                  <Palette className="w-4 h-4" />
                  <span>Theme</span>
                </a>
                <a href="#privacy" onClick={() => setActiveSection('privacy')} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${activeSection==='privacy' ? 'bg-[rgba(242,181,68,.15)] text-[#F4E3B2]' : 'text-[#C9C5D5] hover:bg-[rgba(242,181,68,.08)]'}`}>
                  <Shield className="w-4 h-4" />
                  <span>Privacy</span>
                </a>
                <a href="#account" onClick={() => setActiveSection('account')} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${activeSection==='account' ? 'bg-[rgba(242,181,68,.15)] text-[#F4E3B2]' : 'text-[#C9C5D5] hover:bg-[rgba(242,181,68,.08)]'}`}>
                  <CreditCard className="w-4 h-4" />
                  <span>Account</span>
                </a>
                <Separator className="my-2 bg-[rgba(242,181,68,.18)]" />
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); setActiveSection('profile'); }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg text-[#C9C5D5] hover:bg-[rgba(242,181,68,.08)] transition-colors"
                >
                  <ArrowUp className="w-4 h-4" />
                  <span>Back to top</span>
                </button>
              </div>
            </div>

            {/* Account Summary */}
            <div id="account" className="rounded-2xl bg-[rgba(17,17,22,.85)] backdrop-blur-md ring-1 ring-[rgba(242,181,68,.18)] shadow-[0_12px_48px_rgba(0,0,0,.45)] p-6">
              <h3 className="text-lg font-heading font-bold text-[#F4E3B2] mb-4">Account Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[#C9C5D5]">Plan</span>
                  <span className="font-medium text-[#F4E3B2] capitalize">{subLoading ? 'Loading…' : (subscribed ? tier : 'free')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#C9C5D5]">Credits</span>
                  <span className="font-medium text-[#F4E3B2]">{userCredits ?? '—'}</span>
                </div>
                <Separator className="bg-[rgba(242,181,68,.18)]" />
                {subscribed ? (
                  <Button className="w-full bg-[rgba(242,181,68,.15)] text-[#F4E3B2] border border-[rgba(242,181,68,.35)] hover:bg-[rgba(242,181,68,.25)]" onClick={openCustomerPortal}>
                    Manage Subscription
                  </Button>
                ) : (
                  <Button className="w-full bg-[rgba(242,181,68,.15)] text-[#F4E3B2] border border-[rgba(242,181,68,.35)] hover:bg-[rgba(242,181,68,.25)]" onClick={() => (window.location.href = '/pricing')}>
                    Upgrade Plan
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Settings */}
            <div id="profile" className="rounded-2xl bg-[rgba(17,17,22,.85)] backdrop-blur-md ring-1 ring-[rgba(242,181,68,.18)] shadow-[0_12px_48px_rgba(0,0,0,.45)] p-6 mb-8">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="flex items-center gap-2 text-2xl font-heading font-bold text-[#F4E3B2]">
                      <User className="w-5 h-5" />
                      Profile Information
                    </h2>
                    <p className="text-sm text-[#C9C5D5] mt-1">Update your personal details and language.</p>
                  </div>
                  {authProfile?.is_beta_user && (
                    <FounderBadge
                      founderStatus={authProfile.founder_status}
                      isBetaUser={authProfile.is_beta_user}
                      betaJoinedAt={authProfile.beta_joined_at}
                      size="md"
                      showLabel
                    />
                  )}
                </div>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#C9C5D5]">Email</Label>
                    <Input
                      id="email"
                      value={profile.email || ''}
                      disabled
                      className="bg-muted/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-[#C9C5D5]">Full Name</Label>
                    <Input
                      id="full_name"
                      value={profile.full_name || ''}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display_name" className="text-[#C9C5D5]">Display Name</Label>
                  <Input
                    id="display_name"
                    value={profile.display_name || ''}
                    onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                    placeholder="How you want to be shown to others"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-[#C9C5D5]">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio || ''}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Tell others about yourself..."
                    rows={3}
                  />
                </div>


                <Separator className="bg-[rgba(242,181,68,.18)]" />
                <Button onClick={saveProfile} disabled={saving} size="lg" className="bg-[rgba(242,181,68,.15)] text-[#F4E3B2] border border-[rgba(242,181,68,.35)] hover:bg-[rgba(242,181,68,.25)]">
                  {saving ? (
                    <>
                      <div className="loading-spinner w-4 h-4 mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </div>

            {/* Theme Settings */}
            <div id="theme" className="rounded-2xl bg-[rgba(17,17,22,.85)] backdrop-blur-md ring-1 ring-[rgba(242,181,68,.18)] shadow-[0_12px_48px_rgba(0,0,0,.45)] p-6 mb-8">
              <div className="mb-6">
                <h2 className="flex items-center gap-2 text-2xl font-heading font-bold text-[#F4E3B2]">
                  <Palette className="w-5 h-5" />
                  Theme & Appearance
                </h2>
                <p className="text-sm text-[#C9C5D5] mt-1">Choose your preferred theme and see current state.</p>
              </div>
              <div className="space-y-6">
                <div className="space-y-4">
                  <p className="text-sm text-[#C9C5D5]">
                    Choose your preferred theme for the best reading and writing experience.
                  </p>

                  <ThemeSelect />

                  <Separator className="bg-[rgba(242,181,68,.18)]" />

                  <div>
                    <h4 className="font-medium text-[#F4E3B2] mb-3">Current Theme Status</h4>
                    <ThemeStatus />
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div id="notifications" className="rounded-2xl bg-[rgba(17,17,22,.85)] backdrop-blur-md ring-1 ring-[rgba(242,181,68,.18)] shadow-[0_12px_48px_rgba(0,0,0,.45)] p-6 mb-8">
              <div className="mb-6">
                <h2 className="flex items-center gap-2 text-2xl font-heading font-bold text-[#F4E3B2]">
                  <Bell className="w-5 h-5" />
                  Notification Preferences
                </h2>
                <p className="text-sm text-[#C9C5D5] mt-1">Control how we notify you about updates.</p>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-[#F4E3B2]">Story Updates</Label>
                    <p className="text-sm text-[#C9C5D5]">Get notified when your stories are ready</p>
                  </div>
                  <Switch
                    checked={notificationPreferences.email_stories}
                    onCheckedChange={(checked) =>
                      setNotificationPreferences({ ...notificationPreferences, email_stories: checked })
                    }
                  />
                </div>
                <Separator className="bg-[rgba(242,181,68,.18)]" />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-[#F4E3B2]">Platform Updates</Label>
                    <p className="text-sm text-[#C9C5D5]">New features and announcements</p>
                  </div>
                  <Switch
                    checked={notificationPreferences.email_updates}
                    onCheckedChange={(checked) =>
                      setNotificationPreferences({ ...notificationPreferences, email_updates: checked })
                    }
                  />
                </div>
                <Separator className="bg-[rgba(242,181,68,.18)]" />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-[#F4E3B2]">Push Notifications</Label>
                    <p className="text-sm text-[#C9C5D5]">Browser notifications for important updates</p>
                  </div>
                  <Switch
                    checked={notificationPreferences.push_notifications}
                    onCheckedChange={(checked) =>
                      setNotificationPreferences({ ...notificationPreferences, push_notifications: checked })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            <div id="privacy" className="rounded-2xl bg-[rgba(17,17,22,.85)] backdrop-blur-md ring-1 ring-[rgba(242,181,68,.18)] shadow-[0_12px_48px_rgba(0,0,0,.45)] p-6 mb-8">
              <div className="mb-6">
                <h2 className="flex items-center gap-2 text-2xl font-heading font-bold text-[#F4E3B2]">
                  <Shield className="w-5 h-5" />
                  Privacy & Security
                </h2>
                <p className="text-sm text-[#C9C5D5] mt-1">Manage your profile visibility and data.</p>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-[#F4E3B2]">Public Profile</Label>
                    <p className="text-sm text-[#C9C5D5]">Allow others to see your profile</p>
                  </div>
                  <Switch
                    checked={visibilitySettings.public_profile}
                    onCheckedChange={(checked) => updateVisibilitySetting('public_profile', checked)}
                  />
                </div>
                <Separator className="bg-[rgba(242,181,68,.18)]" />

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-[#F4E3B2]">Show Stories in Discover</Label>
                    <p className="text-sm text-[#C9C5D5]">Make your public stories discoverable</p>
                  </div>
                  <Switch
                    checked={visibilitySettings.discoverable_stories}
                    onCheckedChange={(checked) => updateVisibilitySetting('discoverable_stories', checked)}
                  />
                </div>

                <Separator className="bg-[rgba(242,181,68,.18)]" />

                <div className="space-y-4">
                  <h4 className="font-medium text-[#F4E3B2]">Account Actions</h4>
                  <div className="space-y-2">
                    <Button className="w-full justify-start bg-[rgba(242,181,68,.15)] text-[#F4E3B2] border border-[rgba(242,181,68,.35)] hover:bg-[rgba(242,181,68,.25)]">
                      Change Password
                    </Button>
                    <Button className="w-full justify-start bg-[rgba(242,181,68,.15)] text-[#F4E3B2] border border-[rgba(242,181,68,.35)] hover:bg-[rgba(242,181,68,.25)]">
                      Download My Data
                    </Button>
                    <Button variant="destructive" className="w-full justify-start">
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Settings;
