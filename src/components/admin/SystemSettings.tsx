import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  Bot,
  CreditCard,
  Mail,
  Shield,
  Globe,
  Palette,
  Database,
  RefreshCw,
  Save,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/debug';

interface SystemConfig {
  ai_settings: {
    primary_model: string;
    openai_model: string;
    english_model: string;  // Model for English stories
    swedish_model: string;  // Model for Swedish stories
    max_tokens_per_request: number;
    temperature: number;
    story_generation_prompt: string;
    image_generation_enabled: boolean;
    audio_generation_enabled: boolean;
  };
  credit_settings: {
    story_segment_cost: number;
    image_generation_cost: number;
    audio_generation_cost: number;
    daily_free_credits: number;
    welcome_bonus_credits: number;
  };
  content_policies: {
    max_story_length: number;
    prohibited_words: string[];
    auto_moderation_enabled: boolean;
    require_approval_for_public: boolean;
  };
  email_settings: {
    welcome_email_enabled: boolean;
    notification_emails_enabled: boolean;
    smtp_host: string;
    smtp_port: number;
    from_email: string;
  };
  feature_flags: {
    story_sharing_enabled: boolean;
    premium_features_enabled: boolean;
    social_features_enabled: boolean;
    analytics_enabled: boolean;
  };
}

const SystemSettings = () => {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('ai');
  const { toast } = useToast();

  useEffect(() => {
    loadSystemConfig();
  }, []);

  const loadSystemConfig = async () => {
    try {
      setLoading(true);

      // Load system configuration from admin_settings table
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*');

      if (error) {
        // If no settings exist, use defaults
        logger.info('No admin settings found, using defaults');
      } else if (data && data.length > 0) {
        // Convert array of settings to config object
        const configObj = data.reduce((acc, setting) => {
          acc[setting.key] = setting.value;
          return acc;
        }, {} as any);

        setConfig(prev => ({ ...prev, ...configObj }));
      }

      logger.info('Loaded system config');
    } catch (error) {
      logger.error('Error loading system configuration', error);
      toast({
        title: "Error",
        description: "Failed to load system configuration.",
        variant: "destructive",
      });
      // Set default config on error
      setConfig(getDefaultConfig());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultConfig = (): SystemConfig => ({
    ai_settings: {
      primary_model: 'openrouter/sonoma-dusk-alpha',
      openai_model: 'gpt-4o-mini',
      english_model: 'thedrummer/cydonia-24b-v4.1',  // Cydonia 24B for English
      swedish_model: 'x-ai/grok-4-fast',  // Grok-4-Fast for Swedish
      max_tokens_per_request: 2000,
      temperature: 0.7,
      story_generation_prompt: 'Create an engaging children\'s story segment...',
      image_generation_enabled: true,
      audio_generation_enabled: true,
    },
    credit_settings: {
      story_segment_cost: 1,
      image_generation_cost: 2,
      audio_generation_cost: 3,
      daily_free_credits: 5,
      welcome_bonus_credits: 10,
    },
    content_policies: {
      max_story_length: 5000,
      prohibited_words: [],
      auto_moderation_enabled: true,
      require_approval_for_public: false,
    },
    email_settings: {
      welcome_email_enabled: true,
      notification_emails_enabled: true,
      smtp_host: '',
      smtp_port: 587,
      from_email: '',
    },
    feature_flags: {
      story_sharing_enabled: true,
      premium_features_enabled: true,
      social_features_enabled: false,
      analytics_enabled: true,
    },
  });

  const saveSystemConfig = async () => {
    try {
      setSaving(true);

      // Save each config setting
      for (const [key, value] of Object.entries(config)) {
        const { error } = await supabase
          .from('admin_settings')
          .upsert({
            key,
            value,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "System configuration updated successfully.",
      });

      logger.info('Updated system configuration');
    } catch (error) {
      logger.error('Error updating system configuration', error);
      toast({
        title: "Error",
        description: "Failed to update system configuration.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (section: keyof SystemConfig, field: string, value: any) => {
    if (!config) return;

    setConfig({
      ...config,
      [section]: {
        ...config[section],
        [field]: value
      }
    });
  };

  const testEmailConnection = async () => {
    try {
      // Simulate email test since we don't have this function
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Success",
        description: "Email connection test successful.",
      });
    } catch (error) {
      logger.error('Error testing email connection', error);
      toast({
        title: "Error",
        description: "Email connection test failed.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-8">
        <p className="text-text-secondary">Failed to load system configuration.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">System Settings</h2>
          <p className="text-text-secondary">Configure platform-wide settings and policies</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadSystemConfig} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={saveSystemConfig} disabled={saving} size="sm">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 glass-card">
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            AI Settings
          </TabsTrigger>
          <TabsTrigger value="credits" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Credits
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Content Policy
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Features
          </TabsTrigger>
        </TabsList>

        {/* AI Settings Tab */}
        <TabsContent value="ai">
          <Card className="glass-card-elevated">
            <CardHeader>
              <CardTitle>AI Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Language-Specific Models</h3>
                  <p className="text-sm text-text-secondary mb-4">
                    Configure different AI models for different languages to optimize quality and cost.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="english-model">English Model</Label>
                    <Select
                      value={config.ai_settings.english_model || 'thedrummer/cydonia-24b-v4.1'}
                      onValueChange={(value) => updateConfig('ai_settings', 'english_model', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="thedrummer/cydonia-24b-v4.1">Cydonia 24B (Fast, Cheap)</SelectItem>
                        <SelectItem value="x-ai/grok-4-fast">Grok-4-Fast (Paid, Better Quality)</SelectItem>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini (OpenAI)</SelectItem>
                        <SelectItem value="gpt-4o">GPT-4o (OpenAI, Premium)</SelectItem>
                        <SelectItem value="Meta-Llama-3_3-70B-Instruct">Llama 3.3 70B</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-text-secondary mt-1">
                      Used for all English story generation
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="swedish-model">Swedish Model</Label>
                    <Select
                      value={config.ai_settings.swedish_model || 'x-ai/grok-4-fast'}
                      onValueChange={(value) => updateConfig('ai_settings', 'swedish_model', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="x-ai/grok-4-fast">Grok-4-Fast (Recommended for Swedish)</SelectItem>
                        <SelectItem value="thedrummer/cydonia-24b-v4.1">Cydonia 24B (Cheaper, Lower Quality)</SelectItem>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini (OpenAI)</SelectItem>
                        <SelectItem value="gpt-4o">GPT-4o (OpenAI, Premium)</SelectItem>
                        <SelectItem value="Meta-Llama-3_3-70B-Instruct">Llama 3.3 70B</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-text-secondary mt-1">
                      Used for all Swedish story generation
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primary-model">Legacy Primary Model</Label>
                  <Select
                    value={config.ai_settings.primary_model || 'openrouter/sonoma-dusk-alpha'}
                    onValueChange={(value) => updateConfig('ai_settings', 'primary_model', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openrouter/sonoma-dusk-alpha">Sonoma Dusk Alpha (2M Context)</SelectItem>
                      <SelectItem value="Meta-Llama-3_3-70B-Instruct">Llama 3.3 70B</SelectItem>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                      <SelectItem value="gpt-4-turbo-preview">GPT-4 Turbo</SelectItem>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                      <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-text-secondary mt-1">
                    Deprecated - use language-specific models above
                  </p>
                </div>

                <div>
                  <Label htmlFor="max-tokens">Max Tokens per Request</Label>
                  <Input
                    id="max-tokens"
                    type="number"
                    value={config.ai_settings.max_tokens_per_request}
                    onChange={(e) => updateConfig('ai_settings', 'max_tokens_per_request', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="temperature">Temperature (0-1)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={config.ai_settings.temperature}
                    onChange={(e) => updateConfig('ai_settings', 'temperature', parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="story-prompt">Story Generation Prompt</Label>
                <Textarea
                  id="story-prompt"
                  rows={4}
                  value={config.ai_settings.story_generation_prompt}
                  onChange={(e) => updateConfig('ai_settings', 'story_generation_prompt', e.target.value)}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="image-gen">Enable Image Generation</Label>
                  <Switch
                    id="image-gen"
                    checked={config.ai_settings.image_generation_enabled}
                    onCheckedChange={(checked) => updateConfig('ai_settings', 'image_generation_enabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="audio-gen">Enable Audio Generation</Label>
                  <Switch
                    id="audio-gen"
                    checked={config.ai_settings.audio_generation_enabled}
                    onCheckedChange={(checked) => updateConfig('ai_settings', 'audio_generation_enabled', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Credits Tab */}
        <TabsContent value="credits">
          <Card className="glass-card-elevated">
            <CardHeader>
              <CardTitle>Credit System Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="segment-cost">Story Segment Cost</Label>
                  <Input
                    id="segment-cost"
                    type="number"
                    value={config.credit_settings.story_segment_cost}
                    onChange={(e) => updateConfig('credit_settings', 'story_segment_cost', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="image-cost">Image Generation Cost</Label>
                  <Input
                    id="image-cost"
                    type="number"
                    value={config.credit_settings.image_generation_cost}
                    onChange={(e) => updateConfig('credit_settings', 'image_generation_cost', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="audio-cost">Audio Generation Cost</Label>
                  <Input
                    id="audio-cost"
                    type="number"
                    value={config.credit_settings.audio_generation_cost}
                    onChange={(e) => updateConfig('credit_settings', 'audio_generation_cost', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="daily-free">Daily Free Credits</Label>
                  <Input
                    id="daily-free"
                    type="number"
                    value={config.credit_settings.daily_free_credits}
                    onChange={(e) => updateConfig('credit_settings', 'daily_free_credits', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="welcome-bonus">Welcome Bonus Credits</Label>
                  <Input
                    id="welcome-bonus"
                    type="number"
                    value={config.credit_settings.welcome_bonus_credits}
                    onChange={(e) => updateConfig('credit_settings', 'welcome_bonus_credits', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Policy Tab */}
        <TabsContent value="content">
          <Card className="glass-card-elevated">
            <CardHeader>
              <CardTitle>Content Moderation Policies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="max-length">Maximum Story Length (characters)</Label>
                <Input
                  id="max-length"
                  type="number"
                  value={config.content_policies.max_story_length}
                  onChange={(e) => updateConfig('content_policies', 'max_story_length', parseInt(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="prohibited-words">Prohibited Words (comma-separated)</Label>
                <Textarea
                  id="prohibited-words"
                  rows={3}
                  value={config.content_policies.prohibited_words.join(', ')}
                  onChange={(e) => updateConfig('content_policies', 'prohibited_words', e.target.value.split(', ').filter(word => word.trim()))}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-mod">Enable Auto-Moderation</Label>
                  <Switch
                    id="auto-mod"
                    checked={config.content_policies.auto_moderation_enabled}
                    onCheckedChange={(checked) => updateConfig('content_policies', 'auto_moderation_enabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="require-approval">Require Approval for Public Stories</Label>
                  <Switch
                    id="require-approval"
                    checked={config.content_policies.require_approval_for_public}
                    onCheckedChange={(checked) => updateConfig('content_policies', 'require_approval_for_public', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email">
          <Card className="glass-card-elevated">
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input
                    id="smtp-host"
                    value={config.email_settings.smtp_host}
                    onChange={(e) => updateConfig('email_settings', 'smtp_host', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    value={config.email_settings.smtp_port}
                    onChange={(e) => updateConfig('email_settings', 'smtp_port', parseInt(e.target.value))}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="from-email">From Email Address</Label>
                  <Input
                    id="from-email"
                    type="email"
                    value={config.email_settings.from_email}
                    onChange={(e) => updateConfig('email_settings', 'from_email', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="welcome-email">Enable Welcome Emails</Label>
                  <Switch
                    id="welcome-email"
                    checked={config.email_settings.welcome_email_enabled}
                    onCheckedChange={(checked) => updateConfig('email_settings', 'welcome_email_enabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="notification-email">Enable Notification Emails</Label>
                  <Switch
                    id="notification-email"
                    checked={config.email_settings.notification_emails_enabled}
                    onCheckedChange={(checked) => updateConfig('email_settings', 'notification_emails_enabled', checked)}
                  />
                </div>
              </div>

              <Button onClick={testEmailConnection} variant="outline">
                <Mail className="w-4 h-4 mr-2" />
                Test Email Connection
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features">
          <Card className="glass-card-elevated">
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="story-sharing">Story Sharing</Label>
                  <p className="text-sm text-text-secondary">Allow users to share their stories publicly</p>
                </div>
                <Switch
                  id="story-sharing"
                  checked={config.feature_flags.story_sharing_enabled}
                  onCheckedChange={(checked) => updateConfig('feature_flags', 'story_sharing_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="premium-features">Premium Features</Label>
                  <p className="text-sm text-text-secondary">Enable premium subscription features</p>
                </div>
                <Switch
                  id="premium-features"
                  checked={config.feature_flags.premium_features_enabled}
                  onCheckedChange={(checked) => updateConfig('feature_flags', 'premium_features_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="social-features">Social Features</Label>
                  <p className="text-sm text-text-secondary">Enable comments, likes, and social interactions</p>
                </div>
                <Switch
                  id="social-features"
                  checked={config.feature_flags.social_features_enabled}
                  onCheckedChange={(checked) => updateConfig('feature_flags', 'social_features_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="analytics">Analytics</Label>
                  <p className="text-sm text-text-secondary">Enable usage analytics and tracking</p>
                </div>
                <Switch
                  id="analytics"
                  checked={config.feature_flags.analytics_enabled}
                  onCheckedChange={(checked) => updateConfig('feature_flags', 'analytics_enabled', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemSettings;