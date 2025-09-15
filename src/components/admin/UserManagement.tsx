import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Search,
  Filter,
  MoreHorizontal,
  Ban,
  Shield,
  Coins,
  Mail,
  Calendar,
  RefreshCw,
  UserCheck,
  UserX
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/debug';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface User {
  id: string;
  email: string;
  full_name: string;
  display_name: string;
  created_at: string;
  last_sign_in_at: string;
  credits: number;
  role: string;
  is_banned: boolean;
  stories_count: number;
  total_credits_used: number;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditDescription, setCreditDescription] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);

      // Get users with their roles and statistics
      const { data, error } = await supabase.rpc('admin_get_users');

      if (error) throw error;

      setUsers(data || []);
      logger.info('Loaded users', { count: data?.length });
    } catch (error) {
      logger.error('Error loading users', error);
      toast({
        title: "Error",
        description: "Failed to load users.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter === 'banned') {
      filtered = filtered.filter(user => user.is_banned);
    } else if (statusFilter === 'active') {
      filtered = filtered.filter(user => !user.is_banned);
    }

    setFilteredUsers(filtered);
  };

  const toggleUserBan = async (userId: string, shouldBan: boolean) => {
    try {
      const { error } = await supabase.rpc('admin_toggle_user_ban', {
        p_user_id: userId,
        p_is_banned: shouldBan
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${shouldBan ? 'banned' : 'unbanned'} successfully.`,
      });

      loadUsers();
    } catch (error) {
      logger.error('Error toggling user ban', error);
      toast({
        title: "Error",
        description: "Failed to update user status.",
        variant: "destructive",
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase.rpc('admin_update_user_role', {
        p_user_id: userId,
        p_role: newRole
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User role updated successfully.",
      });

      loadUsers();
    } catch (error) {
      logger.error('Error updating user role', error);
      toast({
        title: "Error",
        description: "Failed to update user role.",
        variant: "destructive",
      });
    }
  };

  const adjustCredits = async (userId: string, amount: number, description: string) => {
    try {
      const { error } = await supabase.rpc('admin_adjust_user_credits', {
        p_user_id: userId,
        p_amount: amount,
        p_description: description
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Credits adjusted successfully.",
      });

      setCreditAmount('');
      setCreditDescription('');
      loadUsers();
    } catch (error) {
      logger.error('Error adjusting credits', error);
      toast({
        title: "Error",
        description: "Failed to adjust credits.",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'moderator': return 'secondary';
      case 'premium_plus': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
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
            <div className="text-2xl font-bold text-primary">{users.length}</div>
            <div className="text-sm text-text-secondary">Total Users</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">
              {users.filter(u => !u.is_banned).length}
            </div>
            <div className="text-sm text-text-secondary">Active Users</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">
              {users.filter(u => u.is_banned).length}
            </div>
            <div className="text-sm text-text-secondary">Banned Users</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">
              {users.filter(u => u.role === 'admin' || u.role === 'moderator').length}
            </div>
            <div className="text-sm text-text-secondary">Staff Users</div>
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
                  placeholder="Search by email, name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="premium_plus">Premium+</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadUsers} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="glass-card-elevated">
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="glass-card p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-semibold">
                        {user.display_name || user.full_name || 'Unnamed User'}
                      </h3>
                      <p className="text-sm text-text-secondary flex items-center gap-2">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {user.role}
                    </Badge>
                    {user.is_banned && (
                      <Badge variant="destructive">Banned</Badge>
                    )}
                    <div className="flex items-center gap-1 text-sm text-text-secondary">
                      <Coins className="w-3 h-3" />
                      {user.credits} credits
                    </div>
                    <div className="flex items-center gap-1 text-sm text-text-secondary">
                      <Calendar className="w-3 h-3" />
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setSelectedUser(user)}
                    >
                      <Coins className="w-4 h-4 mr-2" />
                      Manage Credits
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        const newRole = user.role === 'admin' ? 'user' :
                                       user.role === 'moderator' ? 'user' : 'moderator';
                        updateUserRole(user.id, newRole);
                      }}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Change Role
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => toggleUserBan(user.id, !user.is_banned)}
                      className={user.is_banned ? "text-green-600" : "text-red-600"}
                    >
                      {user.is_banned ? (
                        <>
                          <UserCheck className="w-4 h-4 mr-2" />
                          Unban User
                        </>
                      ) : (
                        <>
                          <UserX className="w-4 h-4 mr-2" />
                          Ban User
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-text-secondary">No users found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credit Management Dialog */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Manage Credits for {selectedUser.display_name || selectedUser.email}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="current-credits">Current Credits</Label>
                <div className="text-2xl font-bold text-primary">
                  {selectedUser.credits}
                </div>
              </div>
              <div>
                <Label htmlFor="credit-amount">Amount (use negative to deduct)</Label>
                <Input
                  id="credit-amount"
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="e.g., 100 or -50"
                />
              </div>
              <div>
                <Label htmlFor="credit-description">Description</Label>
                <Input
                  id="credit-description"
                  value={creditDescription}
                  onChange={(e) => setCreditDescription(e.target.value)}
                  placeholder="Reason for credit adjustment"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (creditAmount && creditDescription) {
                      adjustCredits(selectedUser.id, parseInt(creditAmount), creditDescription);
                      setSelectedUser(null);
                    }
                  }}
                  disabled={!creditAmount || !creditDescription}
                  className="flex-1"
                >
                  Apply Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedUser(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default UserManagement;