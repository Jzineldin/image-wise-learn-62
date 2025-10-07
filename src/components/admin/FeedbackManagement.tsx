import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MessageSquare, Bug, Lightbulb, Heart, RefreshCw, ExternalLink, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/production-logger';

interface Feedback {
  id: string;
  user_id: string | null;
  feedback_type: string;
  subject: string | null;
  message: string;
  page_url: string | null;
  status: string | null;
  admin_notes: string | null;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

const FeedbackManagement = () => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const { toast } = useToast();

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('user_feedback')
        .select(`
          *,
          profiles:user_id (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      if (filterType !== 'all') {
        query = query.eq('feedback_type', filterType);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to include user info
      const transformedData = data?.map((item: any) => ({
        ...item,
        user_email: item.profiles?.email,
        user_name: item.profiles?.full_name,
      })) || [];

      setFeedback(transformedData);
    } catch (error) {
      logger.error('Error fetching feedback', error, { operation: 'fetch-feedback' });
      toast({
        title: 'Error',
        description: 'Failed to load feedback',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, [filterStatus, filterType]);

  const updateFeedbackStatus = async (id: string, status: string, adminNotes?: string) => {
    try {
      const { error } = await supabase
        .from('user_feedback')
        .update({
          status,
          admin_notes: adminNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Feedback status updated',
      });

      fetchFeedback();
    } catch (error) {
      logger.error('Error updating feedback', error, { operation: 'update-feedback', feedbackId: id });
      toast({
        title: 'Error',
        description: 'Failed to update feedback',
        variant: 'destructive',
      });
    }
  };

  const getFeedbackIcon = (type: string) => {
    switch (type) {
      case 'bug':
        return <Bug className="w-4 h-4" />;
      case 'feature':
        return <Lightbulb className="w-4 h-4" />;
      case 'praise':
        return <Heart className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'new':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'in_progress':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'resolved':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'closed':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const stats = {
    total: feedback.length,
    new: feedback.filter(f => f.status === 'new').length,
    inProgress: feedback.filter(f => f.status === 'in_progress').length,
    resolved: feedback.filter(f => f.status === 'resolved').length,
    bugs: feedback.filter(f => f.feedback_type === 'bug').length,
    features: feedback.filter(f => f.feedback_type === 'feature').length,
    praise: feedback.filter(f => f.feedback_type === 'praise').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Feedback</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New</p>
                <p className="text-2xl font-bold text-blue-500">{stats.new}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bugs</p>
                <p className="text-2xl font-bold text-red-500">{stats.bugs}</p>
              </div>
              <Bug className="w-8 h-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Praise</p>
                <p className="text-2xl font-bold text-pink-500">{stats.praise}</p>
              </div>
              <Heart className="w-8 h-8 text-pink-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="bug">Bugs</SelectItem>
                  <SelectItem value="feature">Features</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="praise">Praise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={fetchFeedback} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <div className="space-y-4">
        {loading ? (
          <Card className="glass-card">
            <CardContent className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-muted-foreground">Loading feedback...</p>
            </CardContent>
          </Card>
        ) : feedback.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium mb-2">No feedback yet</p>
              <p className="text-muted-foreground">Feedback from users will appear here</p>
            </CardContent>
          </Card>
        ) : (
          feedback.map((item) => (
            <Card key={item.id} className="glass-card-elevated">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      {getFeedbackIcon(item.feedback_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">
                          {item.subject || `${item.feedback_type.charAt(0).toUpperCase() + item.feedback_type.slice(1)} Feedback`}
                        </CardTitle>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status || 'new'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        From: {item.user_name || item.user_email || 'Anonymous'} •{' '}
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Message:</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.message}</p>
                </div>

                {item.page_url && (
                  <div>
                    <p className="text-sm font-medium mb-1">Page:</p>
                    <a
                      href={item.page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      {item.page_url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateFeedbackStatus(item.id, 'in_progress')}
                    disabled={item.status === 'in_progress'}
                  >
                    Mark In Progress
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateFeedbackStatus(item.id, 'resolved')}
                    disabled={item.status === 'resolved'}
                    className="gap-1"
                  >
                    <CheckCircle className="w-3 h-3" />
                    Mark Resolved
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default FeedbackManagement;

