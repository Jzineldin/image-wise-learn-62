import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, FileText, BarChart3, Settings, Shield, Activity } from 'lucide-react';
import UserManagement from './UserManagement';
import ContentModeration from './ContentModeration';
import AnalyticsDashboard from './AnalyticsDashboard';
import SystemSettings from './SystemSettings';
import AuditLog from './AuditLog';

interface AdminTabsProps {
  defaultTab?: string;
}

const AdminTabs = ({ defaultTab = 'users' }: AdminTabsProps) => {
  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="grid w-full grid-cols-5 glass-card mb-8">
        <TabsTrigger value="users" className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          Users
        </TabsTrigger>
        <TabsTrigger value="content" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Content
        </TabsTrigger>
        <TabsTrigger value="analytics" className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Analytics
        </TabsTrigger>
        <TabsTrigger value="settings" className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Settings
        </TabsTrigger>
        <TabsTrigger value="audit" className="flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Audit Log
        </TabsTrigger>
      </TabsList>

      <TabsContent value="users" className="mt-0">
        <UserManagement />
      </TabsContent>

      <TabsContent value="content" className="mt-0">
        <ContentModeration />
      </TabsContent>

      <TabsContent value="analytics" className="mt-0">
        <AnalyticsDashboard />
      </TabsContent>

      <TabsContent value="settings" className="mt-0">
        <SystemSettings />
      </TabsContent>

      <TabsContent value="audit" className="mt-0">
        <AuditLog />
      </TabsContent>
    </Tabs>
  );
};

export default AdminTabs;