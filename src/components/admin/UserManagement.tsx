import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search,
  RefreshCw,
  Users,
  Shield,
  Coins,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/debug';

interface User {
  id: string;
  email: string;
  display_name: string;
  full_name: string;
  created_at: string;
  subscription_tier: string;
  credits: number;
  stories_count: number;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, tierFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);

      // Get users with their profile data
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get story counts for each user
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('user_id, id');

      if (storiesError) throw storiesError;

      // Count stories per user
      const storyCounts = storiesData?.reduce((acc, story) => {
        acc[story.user_id] = (acc[story.user_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Combine data
      const userData: User[] = (profilesData || []).map(profile => ({
        id: profile.id,
        email: profile.email || '',
        display_name: profile.display_name || '',
        full_name: profile.full_name || '',
        created_at: profile.created_at,
        subscription_tier: profile.subscription_tier || 'free',
        credits: profile.credits || 0,
        stories_count: storyCounts[profile.id] || 0
      }));

      setUsers(userData);
      logger.info('Loaded users', { count: userData.length });
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
        user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Tier filter
    if (tierFilter !== 'all') {
      filtered = filtered.filter(user => user.subscription_tier === tierFilter);
    }

    setFilteredUsers(filtered);
  };

  const adjustUserCredits = async (userId: string, amount: number) => {
    try {
      const { error } = await supabase.rpc('add_credits', {
        user_uuid: userId,
        credits_to_add: amount,
        description_text: `Admin credit adjustment: ${amount}`,
        ref_type: 'admin_adjustment'
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Credits adjusted by ${amount} for user.`,
      });

      loadUsers();
    } catch (error) {
      logger.error('Error adjusting user credits', error);
      toast({
        title: "Error",
        description: "Failed to adjust user credits.",
        variant: "destructive",
      });
    }
  };

  const getTierBadgeVariant = (tier: string) => {
    switch (tier) {
      case 'premium': return 'default';
      case 'starter': return 'secondary';
      case 'free': return 'outline';
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
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Total Users</p>
                <p className="text-2xl font-bold text-primary">{users.length}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Premium Users</p>
                <p className="text-2xl font-bold text-primary">
                  {users.filter(u => u.subscription_tier === 'premium').length}
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
                <p className="text-text-secondary text-sm">Active Creators</p>
                <p className="text-2xl font-bold text-primary">
                  {users.filter(u => u.stories_count > 0).length}
                </p>
              </div>
              <Coins className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">New This Month</p>
                <p className="text-2xl font-bold text-primary">
                  {users.filter(u => {
                    const userDate = new Date(u.created_at);
                    const thisMonth = new Date();
                    thisMonth.setDate(1);
                    return userDate >= thisMonth;
                  }).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-primary" />
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
                  placeholder="Search users by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
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
        <CardContent className="pt-0">
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div key={user.id} className="glass-card p-4 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {user.display_name || user.full_name || 'Unnamed User'}
                  </h3>
                  <p className="text-sm text-text-secondary">{user.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={getTierBadgeVariant(user.subscription_tier)}>
                      {user.subscription_tier}
                    </Badge>
                    <Badge variant="outline">
                      {user.credits} credits
                    </Badge>
                    <Badge variant="outline">
                      {user.stories_count} stories
                    </Badge>
                  </div>
                  <p className="text-xs text-text-tertiary mt-1">
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => adjustUserCredits(user.id, 10)}
                  >
                    +10 Credits
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => adjustUserCredits(user.id, -10)}
                    disabled={user.credits < 10}
                  >
                    -10 Credits
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
              <p className="text-text-secondary">No users found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;