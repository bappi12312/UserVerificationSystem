import { useState } from 'react';
import { useRoute, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { getServerDetails, voteForServer } from '@/lib/steam';
import { formatVoteCount, formatPlayerCount, getRegionDisplay, getRegionLocation, generateSteamConnectLink } from '@/lib/utils';
import { 
  Gamepad, 
  Users, 
  MapPin, 
  Server, 
  Calendar, 
  Clock, 
  ArrowUp, 
  Copy, 
  ExternalLink,
  ChevronLeft,
  Map
} from 'lucide-react';
import { UserProfile } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { FaSteam } from 'react-icons/fa';

interface ServerDetailsProps {
  user: UserProfile | null;
  onLoginRequired: () => void;
}

export default function ServerDetails({ user, onLoginRequired }: ServerDetailsProps) {
  const [, params] = useRoute<{ id: string }>('/servers/:id');
  const { toast } = useToast();
  const [isVoting, setIsVoting] = useState(false);
  
  const serverId = params ? parseInt(params.id) : 0;
  
  const { data: server, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/servers', serverId],
    queryFn: () => getServerDetails(serverId),
    enabled: !!serverId
  });
  
  const handleCopyIP = () => {
    if (!server) return;
    
    const serverIP = `${server.ip}:${server.port}`;
    navigator.clipboard.writeText(serverIP);
    toast({
      title: "IP Copied",
      description: `${serverIP} has been copied to your clipboard`,
    });
  };
  
  const handleVote = async () => {
    if (!server) return;
    
    try {
      setIsVoting(true);
      await voteForServer(server.id);
      refetch();
      
      toast({
        title: server.hasVoted ? "Vote Removed" : "Vote Added",
        description: server.hasVoted 
          ? "Your vote has been removed from this server" 
          : "Your vote has been added to this server",
      });
    } catch (error: any) {
      if (error.message.includes('Authentication required')) {
        onLoginRequired();
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to vote for server",
          variant: "destructive",
        });
      }
    } finally {
      setIsVoting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Card className="animate-pulse">
          <CardContent className="h-96 p-6"></CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !server) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="p-6 text-center">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Server Not Found</h1>
            <p className="mb-4">The server you are looking for does not exist or has been removed.</p>
            <Link href="/servers">
              <Button>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Servers
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="mb-4">
        <Link href="/servers">
          <Button variant="outline" size="sm">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Servers
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">{server.name}</h1>
                <Badge variant={server.isOnline ? "success" : "destructive"} className="flex items-center gap-1">
                  <span className={`h-2 w-2 rounded-full ${server.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  {server.isOnline ? 'Online' : 'Offline'}
                </Badge>
                {server.isFeatured && (
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                    <span className="mr-1">★</span>
                    Featured
                  </Badge>
                )}
              </div>
              <p className="mt-2 text-lg text-gray-600">{server.description}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                className="flex items-center gap-2"
                variant={server.hasVoted ? "default" : "outline"}
                onClick={handleVote}
                disabled={isVoting || !user}
              >
                <ArrowUp className="h-4 w-4" />
                {isVoting ? 'Processing...' : formatVoteCount(server.voteCount)} {server.hasVoted ? 'Voted' : 'Vote'}
              </Button>
              
              {server.game === 'minecraft' ? (
                <Button onClick={handleCopyIP} className="flex items-center gap-2">
                  <Copy className="h-4 w-4" />
                  Copy IP
                </Button>
              ) : (
                <a href={generateSteamConnectLink(server.ip, server.port)} target="_blank" rel="noopener noreferrer">
                  <Button className="flex items-center gap-2 w-full">
                    <FaSteam className="h-4 w-4" />
                    Connect via Steam
                  </Button>
                </a>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Server Information</h2>
              <div className="space-y-4">
                <div className="flex items-center text-gray-700">
                  <Gamepad className="mr-3 h-5 w-5 text-gray-500" />
                  <span className="font-medium mr-2">Game:</span> {server.game}
                </div>
                
                <div className="flex items-center text-gray-700">
                  <Users className="mr-3 h-5 w-5 text-gray-500" />
                  <span className="font-medium mr-2">Players:</span> {formatPlayerCount(server.currentPlayers, server.maxPlayers)}
                </div>
                
                <div className="flex items-center text-gray-700">
                  <MapPin className="mr-3 h-5 w-5 text-gray-500" />
                  <span className="font-medium mr-2">Region:</span> {getRegionLocation(server.region)}
                </div>
                
                <div className="flex items-center text-gray-700">
                  <Server className="mr-3 h-5 w-5 text-gray-500" />
                  <span className="font-medium mr-2">IP:</span> 
                  <code className="bg-gray-100 px-2 py-1 rounded select-all">{server.ip}:{server.port}</code>
                </div>
                
                {server.currentMap && (
                  <div className="flex items-center text-gray-700">
                    <Map className="mr-3 h-5 w-5 text-gray-500" />
                    <span className="font-medium mr-2">Current Map:</span> {server.currentMap}
                  </div>
                )}
                
                <div className="flex items-center text-gray-700">
                  <Calendar className="mr-3 h-5 w-5 text-gray-500" />
                  <span className="font-medium mr-2">Added:</span> {new Date(server.createdAt).toLocaleDateString()}
                </div>
                
                <div className="flex items-center text-gray-700">
                  <Clock className="mr-3 h-5 w-5 text-gray-500" />
                  <span className="font-medium mr-2">Last Updated:</span> {new Date(server.lastUpdated).toLocaleString()}
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Server Status</h2>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-700 font-medium">Status</span>
                    <Badge variant={server.isOnline ? "success" : "destructive"}>
                      {server.isOnline ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-700 font-medium">Players</span>
                    <span className="text-gray-900">{server.currentPlayers}/{server.maxPlayers}</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                    <div 
                      className="bg-primary h-2.5 rounded-full" 
                      style={{ width: `${(server.currentPlayers / server.maxPlayers) * 100}%` }}
                    ></div>
                  </div>
                  
                  {server.currentMap && (
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-700 font-medium">Current Map</span>
                      <span className="text-gray-900">{server.currentMap}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-medium">Votes</span>
                    <span className="text-gray-900">{formatVoteCount(server.voteCount)}</span>
                  </div>
                </CardContent>
              </Card>
              
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Connect to Server</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-700 mb-2">Copy the server address:</p>
                    <div className="flex">
                      <code className="flex-1 bg-gray-100 p-2 rounded-l-md select-all border border-r-0 border-gray-300">{server.ip}:{server.port}</code>
                      <Button 
                        variant="outline"
                        className="rounded-l-none" 
                        onClick={handleCopyIP}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {server.game !== 'minecraft' && (
                    <div>
                      <p className="text-gray-700 mb-2">Or connect directly through Steam:</p>
                      <a href={generateSteamConnectLink(server.ip, server.port)} target="_blank" rel="noopener noreferrer">
                        <Button className="w-full flex items-center justify-center gap-2">
                          <FaSteam className="h-5 w-5" />
                          Launch Game and Connect
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
