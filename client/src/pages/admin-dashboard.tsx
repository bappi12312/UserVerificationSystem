import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserProfile } from '@/lib/auth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Server } from '@shared/schema';
import { formatPlayerCount, getRegionLocation } from '@/lib/utils';
import { Gamepad, Users, MapPin, Server as ServerIcon, Check, X, Star } from 'lucide-react';
import { AlertCircle, Shield } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AdminDashboardProps {
  user: UserProfile | null;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processingServerId, setProcessingServerId] = useState<number | null>(null);

  // Fetch pending servers for approval
  const { data: pendingServers = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/servers/pending'],
    queryFn: async () => {
      const res = await fetch('/api/admin/servers/pending', {
        credentials: 'include',
      });
      
      if (res.status === 403) {
        throw new Error('Admin access required');
      }
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to fetch pending servers');
      }
      
      return await res.json();
    },
    enabled: !!user?.isAdmin,
    retry: false
  });

  // Handle server approval/rejection
  const handleServerAction = async (serverId: number, approve: boolean) => {
    setProcessingServerId(serverId);
    try {
      await apiRequest('PATCH', `/api/admin/servers/${serverId}`, { approve });
      
      toast({
        title: `Server ${approve ? 'Approved' : 'Rejected'}`,
        description: `The server has been ${approve ? 'approved' : 'rejected'} successfully.`,
      });
      
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/servers'] });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${approve ? 'approve' : 'reject'} server`,
        variant: "destructive",
      });
    } finally {
      setProcessingServerId(null);
    }
  };

  // Handle setting server as featured
  const handleFeatureServer = async (serverId: number, featured: boolean) => {
    setProcessingServerId(serverId);
    try {
      await apiRequest('PATCH', `/api/admin/servers/${serverId}/feature`, { featured });
      
      toast({
        title: `Server ${featured ? 'Featured' : 'Unfeatured'}`,
        description: `The server has been ${featured ? 'set as featured' : 'removed from featured'} successfully.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/servers'] });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${featured ? 'feature' : 'unfeature'} server`,
        variant: "destructive",
      });
    } finally {
      setProcessingServerId(null);
    }
  };

  // If user is not admin, show unauthorized message
  if (!user || !user.isAdmin) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unauthorized Access</AlertTitle>
          <AlertDescription>
            You need administrator privileges to access this page.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/')}>Return to Home</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center space-x-2 mb-6">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>
      
      <Tabs defaultValue="pending">
        <TabsList className="mb-6">
          <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
          <TabsTrigger value="featured">Manage Featured</TabsTrigger>
          <TabsTrigger value="users">Manage Users</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Server Approvals</CardTitle>
              <CardDescription>
                Review and approve or reject server submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading pending servers...</div>
              ) : pendingServers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No pending servers to approve.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingServers.map((server: Server) => (
                    <Card key={server.id} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{server.name}</h3>
                            <p className="text-sm text-gray-500 mt-1">{server.description}</p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-3">
                              <div className="flex items-center text-sm text-gray-500">
                                <Gamepad className="mr-1.5 h-4 w-4 text-gray-400" />
                                {server.game}
                              </div>
                              
                              <div className="flex items-center text-sm text-gray-500">
                                <Users className="mr-1.5 h-4 w-4 text-gray-400" />
                                {formatPlayerCount(server.currentPlayers, server.maxPlayers)}
                              </div>
                              
                              <div className="flex items-center text-sm text-gray-500">
                                <MapPin className="mr-1.5 h-4 w-4 text-gray-400" />
                                {getRegionLocation(server.region)}
                              </div>
                              
                              <div className="flex items-center text-sm font-mono text-gray-500">
                                <ServerIcon className="mr-1.5 h-4 w-4 text-gray-400" />
                                <span>{server.ip}:{server.port}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            <Button
                              onClick={() => handleServerAction(server.id, true)}
                              variant="outline"
                              className="gap-2 bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                              disabled={processingServerId === server.id}
                            >
                              <Check className="h-4 w-4" />
                              Approve
                            </Button>
                            
                            <Button
                              onClick={() => handleServerAction(server.id, false)}
                              variant="outline"
                              className="gap-2 bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                              disabled={processingServerId === server.id}
                            >
                              <X className="h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="featured">
          <Card>
            <CardHeader>
              <CardTitle>Manage Featured Servers</CardTitle>
              <CardDescription>
                Set or remove servers from featured status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-20">
                <p className="text-gray-500">Feature management interface will be implemented in a future update.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Manage Users</CardTitle>
              <CardDescription>
                View and manage user accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-20">
                <p className="text-gray-500">User management interface will be implemented in a future update.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
