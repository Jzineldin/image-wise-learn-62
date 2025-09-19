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
import { useLanguage } from '@/hooks/useLanguage';
import { ThemeSelect, ThemeStatus } from '@/components/ThemeToggle';
import { usePageThemeClasses } from '@/components/ThemeProvider';

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
  const { user } = useAuth();
  const { toast } = useToast();
  const { availableLanguages, translate } = useLanguage();
  const { pageClassName } = usePageThemeClasses('settings');

  const [activeSection, setActiveSection] = useState<string>('profile');
  const [simpleMode, setSimpleMode] = useState<boolean>(() => {
    try { return JSON.parse(localStorage.getItem('simpleMode') ?? 'true'); } catch { return true; }
  });


  useEffect(() => {
    const ids = ['profile','theme','experience','notifications','privacy','account'];
    const observers: IntersectionObserver[] = [];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            setActiveSection(id);
            try { history.replaceState(null, '', `#${id}`); } catch {}
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
      console.error('Error fetching profile:', error);
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
      console.error('Error saving profile:', error);
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
      console.error('Error updating visibility setting:', error);
      toast({
        title: "Error",
        description: "Failed to update setting.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="loading-spinner h-8 w-8" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p>Profile not found</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${pageClassName}`}>
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="content-overlay mb-12">
          <h1 className="text-4xl font-heading font-bold text-gradient mb-2">
            Settings
          </h1>
          <p className="text-xl text-text-secondary">
            Manage your account preferences and settings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="space-y-4 lg:sticky lg:top-24 self-start">
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <a href="#profile" onClick={() => setActiveSection('profile')} className={`flex items-center gap-3 p-2 rounded-lg ${activeSection==='profile' ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'}`}>
                    <User className="w-4 h-4" />
                    <span className="font-medium">Profile</span>
                  </a>
                  <a href="#notifications" onClick={() => setActiveSection('notifications')} className={`flex items-center gap-3 p-2 rounded-lg ${activeSection==='notifications' ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'}`}>
                    <Bell className="w-4 h-4" />
                    <span>Notifications</span>
                  </a>
                  <a href="#theme" onClick={() => setActiveSection('theme')} className={`flex items-center gap-3 p-2 rounded-lg ${activeSection==='theme' ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'}`}>
                    <Palette className="w-4 h-4" />
                    <span>Theme</span>
                  </a>
                  <a href="#privacy" onClick={() => setActiveSection('privacy')} className={`flex items-center gap-3 p-2 rounded-lg ${activeSection==='privacy' ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'}`}>
                    <Shield className="w-4 h-4" />
                    <span>Privacy</span>
                  </a>
                  <a href="#account" onClick={() => setActiveSection('account')} className={`flex items-center gap-3 p-2 rounded-lg ${activeSection==='account' ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'}`}>
                    <CreditCard className="w-4 h-4" />
                    <span>Account</span>
                  </a>
                  <Separator className="my-2" />
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); setActiveSection('profile'); }}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50"
                  >
                    <ArrowUp className="w-4 h-4" />
                    <span>Back to top</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Account Summary */}
            <Card id="account" className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Account Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Plan</span>
                  <span className="font-medium capitalize">{profile.subscription_tier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Credits</span>
                  <span className="font-medium">{profile.credits}</span>
                </div>
                <Separator />
                <Button variant="outline" className="w-full">
                  Upgrade Plan
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Settings */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Settings */}
            <Card id="profile" className="glass-card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
                <p className="text-sm text-text-secondary mt-1">Update your personal details and language.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={profile.email || ''}
                      disabled
                      className="bg-muted/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={profile.full_name || ''}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    value={profile.display_name || ''}
                    onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                    placeholder="How you want to be shown to others"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio || ''}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Tell others about yourself..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">{translate('settings.preferredLanguage')}</Label>
                  <Select
                    value={profile.preferred_language}
                    onValueChange={(value) => setProfile({ ...profile, preferred_language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLanguages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{lang.native_name}</span>
                            <span className="text-xs text-muted-foreground">({lang.name})</span>
                            {lang.code === 'sv' && (
                              <span className="text-xs bg-primary/20 text-primary px-1 rounded">🇸🇪</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {translate('messages.languageUpdated')}
                  </p>
                </div>

                <Separator />
                <Button onClick={saveProfile} disabled={saving} className="btn-primary">
                  {saving ? (
                    <>
                      <div className="loading-spinner w-4 h-4 mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Theme Settings */}
            <Card id="theme" className="glass-card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Theme & Appearance
                </CardTitle>
                <p className="text-sm text-text-secondary mt-1">Choose your preferred theme and see current state.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <p className="text-sm text-text-secondary">
                    Choose your preferred theme for the best reading and writing experience.
                  </p>

                  <ThemeSelect />

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-3">Current Theme Status</h4>
                    <ThemeStatus />

            {/* Experience Mode */}
            <Card id="experience" className="glass-card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5" />
                  Experience Mode
                </CardTitle>
                <p className="text-sm text-text-secondary mt-1">Simplify the app for kids and parents. One-tap create for pictures and voice.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Simple Mode</Label>
                    <p className="text-sm text-text-secondary">Show fewer controls with a single “Make picture & voice” button.</p>
                  </div>
                  <Switch
                    checked={!!simpleMode}
                    onCheckedChange={(checked) => {
                      try { localStorage.setItem('simpleMode', JSON.stringify(checked)); } catch {}
                      setSimpleMode(checked);
                      toast({ title: checked ? 'Simple Mode enabled' : 'Simple Mode disabled' });
                    }}
                  />
                </div>
              </CardContent>
            </Card>

                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card id="notifications" className="glass-card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Preferences
                </CardTitle>
                <p className="text-sm text-text-secondary mt-1">Control how we notify you about updates.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Story Updates</Label>
                    <p className="text-sm text-text-secondary">Get notified when your stories are ready</p>
                  </div>
                  <Switch
                    checked={notificationPreferences.email_stories}
                    onCheckedChange={(checked) =>
                      setNotificationPreferences({ ...notificationPreferences, email_stories: checked })
                    }
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Platform Updates</Label>
                    <p className="text-sm text-text-secondary">New features and announcements</p>
                  </div>
                  <Switch
                    checked={notificationPreferences.email_updates}
                    onCheckedChange={(checked) =>
                      setNotificationPreferences({ ...notificationPreferences, email_updates: checked })
                    }
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-text-secondary">Browser notifications for important updates</p>
                  </div>
                  <Switch
                    checked={notificationPreferences.push_notifications}
                    onCheckedChange={(checked) =>
                      setNotificationPreferences({ ...notificationPreferences, push_notifications: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card id="privacy" className="glass-card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Privacy & Security
                </CardTitle>
                <p className="text-sm text-text-secondary mt-1">Manage your profile visibility and data.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Public Profile</Label>
                    <p className="text-sm text-text-secondary">Allow others to see your profile</p>
                  </div>
                  <Switch
                    checked={visibilitySettings.public_profile}
                    onCheckedChange={(checked) => updateVisibilitySetting('public_profile', checked)}
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Show Stories in Discover</Label>
                    <p className="text-sm text-text-secondary">Make your public stories discoverable</p>
                  </div>
                  <Switch
                    checked={visibilitySettings.discoverable_stories}
                    onCheckedChange={(checked) => updateVisibilitySetting('discoverable_stories', checked)}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Account Actions</h4>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      Change Password
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Download My Data
                    </Button>
                    <Button variant="destructive" className="w-full justify-start">
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Settings;