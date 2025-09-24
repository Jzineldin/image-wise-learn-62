import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import AdminTabs from '@/components/admin/AdminTabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/lib/debug';
import { RefreshCw } from 'lucide-react';

const Admin = () => {
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      checkAdminAccess();
    }
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) {
      logger.warn('No user found during admin check');
      navigate('/');
      return;
    }

    try {
      logger.info('Checking admin access', { userId: user.id });
      
      // Direct query to check if user has admin role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      logger.debug('Role check result', { hasRoleData: !!roleData, errorCode: roleError?.code });
      
      if (roleError && roleError.code !== 'PGRST116') { // PGRST116 is "not found" error
        logger.error('Database error checking admin role', roleError);
        navigate('/');
        return;
      }
      
      if (!roleData) {
        logger.warn('User does not have admin privileges');
        navigate('/');
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
      } else {
        logger.info('Admin access confirmed');
        setLoading(false);
      }
    } catch (error) {
      logger.error('Error checking admin access', error);
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="content-overlay mb-8">
          <h1 className="text-4xl font-heading font-bold text-gradient mb-2">
            Admin Dashboard
          </h1>
          <p className="text-xl text-text-secondary">
            Comprehensive platform management and analytics
          </p>
        </div>

        {/* Admin Tabs */}
        <AdminTabs />
      </div>

      <Footer />
    </div>
  );
};

export default Admin;