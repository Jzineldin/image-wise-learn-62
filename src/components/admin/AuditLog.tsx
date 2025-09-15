import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  FileText,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/debug';

interface AuditLogEntry {
  id: string;
  admin_user_id: string;
  admin_user_email: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
  success: boolean;
}

const AuditLog = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7d');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAuditLogs();
  }, [dateRange, page]);

  useEffect(() => {
    filterLogs();
  }, [auditLogs, searchTerm, actionFilter, resourceFilter]);

  const loadAuditLogs = async (reset = false) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('admin_get_audit_logs', {
        days: parseInt(dateRange.replace('d', '')),
        page_num: reset ? 1 : page,
        limit_count: 50
      });

      if (error) throw error;

      if (reset) {
        setAuditLogs(data || []);
        setPage(1);
      } else {
        setAuditLogs(prev => [...prev, ...(data || [])]);
      }

      setHasMore((data || []).length === 50);
      logger.info('Loaded audit logs', { count: data?.length, page });
    } catch (error) {
      logger.error('Error loading audit logs', error);
      toast({
        title: "Error",
        description: "Failed to load audit logs.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...auditLogs];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.admin_user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Action filter
    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    // Resource filter
    if (resourceFilter !== 'all') {
      filtered = filtered.filter(log => log.resource_type === resourceFilter);
    }

    setFilteredLogs(filtered);
  };

  const exportAuditLogs = async () => {
    try {
      const dataStr = JSON.stringify(filteredLogs, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Audit logs exported successfully.",
      });
    } catch (error) {
      logger.error('Error exporting audit logs', error);
      toast({
        title: "Error",
        description: "Failed to export audit logs.",
        variant: "destructive",
      });
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'user_ban':
      case 'user_unban':
        return <Shield className="w-4 h-4" />;
      case 'story_delete':
      case 'story_feature':
      case 'story_unfeature':
        return <FileText className="w-4 h-4" />;
      case 'credit_adjustment':
        return <Activity className="w-4 h-4" />;
      case 'system_config_update':
        return <Settings className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActionBadgeVariant = (action: string, success: boolean) => {
    if (!success) return 'destructive';

    switch (action) {
      case 'user_ban':
      case 'story_delete':
        return 'destructive';
      case 'user_unban':
      case 'story_feature':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const formatActionDetails = (log: AuditLogEntry) => {
    const details = log.details || {};

    switch (log.action) {
      case 'user_ban':
        return `Banned user: ${details.target_email || 'Unknown'}`;
      case 'user_unban':
        return `Unbanned user: ${details.target_email || 'Unknown'}`;
      case 'story_feature':
        return `Featured story: "${details.story_title || 'Unknown'}" with priority ${details.priority || 1}`;
      case 'story_unfeature':
        return `Unfeatured story: "${details.story_title || 'Unknown'}"`;
      case 'story_delete':
        return `Deleted story: "${details.story_title || 'Unknown'}" by ${details.author_email || 'Unknown'}`;
      case 'credit_adjustment':
        return `Adjusted credits by ${details.amount || 0} for user: ${details.target_email || 'Unknown'}`;
      case 'system_config_update':
        return `Updated system configuration: ${details.section || 'Unknown section'}`;
      case 'content_flag_resolve':
        return `Resolved content flag with action: ${details.resolution || 'Unknown'}`;
      default:
        return JSON.stringify(details);
    }
  };

  const uniqueActions = [...new Set(auditLogs.map(log => log.action))];
  const uniqueResources = [...new Set(auditLogs.map(log => log.resource_type))];

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Total Actions</p>
                <p className="text-2xl font-bold text-primary">{auditLogs.length}</p>
              </div>
              <Activity className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Successful</p>
                <p className="text-2xl font-bold text-green-600">
                  {auditLogs.filter(log => log.success).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {auditLogs.filter(log => !log.success).length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Unique Admins</p>
                <p className="text-2xl font-bold text-primary">
                  {new Set(auditLogs.map(log => log.admin_user_id)).size}
                </p>
              </div>
              <User className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-text-secondary" />
                <Input
                  placeholder="Search actions, users, details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>
                    {action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={resourceFilter} onValueChange={setResourceFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Resources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                {uniqueResources.map(resource => (
                  <SelectItem key={resource} value={resource}>
                    {resource.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportAuditLogs} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => loadAuditLogs(true)} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card className="glass-card-elevated">
        <CardHeader>
          <CardTitle>Audit Log ({filteredLogs.length} entries)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLogs.map((log) => (
              <div key={log.id} className="glass-card p-4 flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    {getActionIcon(log.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getActionBadgeVariant(log.action, log.success)}>
                        {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                      {!log.success && (
                        <Badge variant="destructive">Failed</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold truncate">
                      {formatActionDetails(log)}
                    </h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {log.admin_user_email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                      {log.ip_address && (
                        <span className="text-xs text-text-tertiary">
                          IP: {log.ip_address}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center mt-6">
              <Button
                onClick={() => {
                  setPage(prev => prev + 1);
                  loadAuditLogs();
                }}
                disabled={loading}
                variant="outline"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Clock className="w-4 h-4 mr-2" />
                )}
                Load More
              </Button>
            </div>
          )}

          {filteredLogs.length === 0 && !loading && (
            <div className="text-center py-8">
              <Activity className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
              <p className="text-text-secondary">No audit log entries found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLog;