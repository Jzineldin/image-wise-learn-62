import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search,
  RefreshCw,
  Activity,
  Download,
  Shield,
  FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/debug';

interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: any;
  created_at: string;
}

const AuditLog = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);

      // Load recent credit transactions as audit trail
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Convert to audit log format
      const auditData: AuditLogEntry[] = (data || []).map(transaction => ({
        id: transaction.id,
        user_id: transaction.user_id,
        action: transaction.transaction_type || 'unknown',
        resource_type: 'credit_transaction',
        resource_id: transaction.reference_id || transaction.id,
        details: transaction.metadata || {},
        created_at: transaction.created_at
      }));

      setAuditLogs(auditData);
      logger.info('Loaded audit logs', { count: auditData.length });
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

  const exportAuditLogs = async () => {
    try {
      const dataStr = JSON.stringify(auditLogs, null, 2);
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

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    
    return matchesSearch && matchesAction;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Audit Log</h2>
          <p className="text-text-secondary">System activity and admin actions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportAuditLogs} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={loadAuditLogs} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <p className="text-text-secondary text-sm">Credit Operations</p>
                <p className="text-2xl font-bold text-primary">
                  {auditLogs.filter(log => log.resource_type === 'credit_transaction').length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Unique Users</p>
                <p className="text-2xl font-bold text-primary">
                  {new Set(auditLogs.map(log => log.user_id)).size}
                </p>
              </div>
              <FileText className="w-8 h-8 text-primary" />
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
                  placeholder="Search actions, types..."
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
                <SelectItem value="purchase">Credit Purchases</SelectItem>
                <SelectItem value="spend">Credit Spending</SelectItem>
                <SelectItem value="bonus">Credit Bonuses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card className="glass-card-elevated">
        <CardHeader>
          <CardTitle>Recent Activity ({filteredLogs.length} entries)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLogs.map((log) => (
              <div key={log.id} className="glass-card p-4 flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">
                      {log.action.charAt(0).toUpperCase() + log.action.slice(1)} Action
                    </h3>
                    <p className="text-sm text-text-secondary">
                      Resource: {log.resource_type}
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8">
              <Activity className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
              <p className="text-text-secondary">No audit log entries found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLog;