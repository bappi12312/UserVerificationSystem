import { Server } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatVoteCount, formatPlayerCount, getRegionDisplay, getRegionLocation, generateSteamConnectLink } from '@/lib/utils';
import { Gamepad, Users, MapPin, Server as ServerIcon, Copy, ArrowUp, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { voteForServer } from '@/lib/steam';
import { useState } from 'react';
import { queryClient } from '@/lib/queryClient';
import { FaSteam } from 'react-icons/fa';

interface ServerCardProps {
  server: Server & { 
    voteCount: number;
    hasVoted?: boolean;
  };
  isFeatured?: boolean;
  onLoginRequired?: () => void;
  refetch?: () => void;
}

export function ServerCard({ server, isFeatured, onLoginRequired, refetch }: ServerCardProps) {
  const { toast } = useToast();
  const [isVoting, setIsVoting] = useState(false);
  const [localVoteCount, setLocalVoteCount] = useState(server.voteCount);
  const [localHasVoted, setLocalHasVoted] = useState(server.hasVoted || false);

  const handleCopyIP = () => {
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
      const result = await voteForServer(server.id);
      
      setLocalVoteCount(result.voteCount);
      setLocalHasVoted(result.voted);
      
      toast({
        title: result.voted ? "Vote Added" : "Vote Removed",
        description: result.message,
      });
      
      // Invalidate queries that might contain this server
      queryClient.invalidateQueries({ queryKey: ['/api/servers'] });
      if (refetch) refetch();
    } catch (error: any) {
      if (error.message.includes('Authentication required')) {
        if (onLoginRequired) onLoginRequired();
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

  return (
    <Card className={`overflow-hidden ${isFeatured ? 'border-l-4 border-amber-500' : ''}`}>
      <CardContent className="p-6">
        <div className="flex justify-between">
          <h3 className="text-lg font-medium text-gray-900 truncate">{server.name}</h3>
          <Badge variant={server.isOnline ? "success" : "destructive"} className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${server.isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
            {server.isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>
        
        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{server.description}</p>
        
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <Gamepad className="mr-1.5 h-4 w-4 text-gray-400" />
          {server.game}
        </div>
        
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <Users className="mr-1.5 h-4 w-4 text-gray-400" />
          {formatPlayerCount(server.currentPlayers, server.maxPlayers)}
        </div>
        
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <MapPin className="mr-1.5 h-4 w-4 text-gray-400" />
          {getRegionLocation(server.region)}
        </div>
        
        <div className="mt-2 flex items-center text-sm font-mono text-gray-500">
          <ServerIcon className="mr-1.5 h-4 w-4 text-gray-400" />
          <span className="select-all">{server.ip}:{server.port}</span>
        </div>
        
        <div className="mt-3 flex justify-between items-center">
          <div className="flex items-center">
            <Button
              size="sm"
              variant={localHasVoted ? "default" : "outline"}
              className={`flex items-center gap-1 ${localHasVoted ? 'bg-primary-50' : ''}`}
              onClick={handleVote}
              disabled={isVoting}
            >
              <ArrowUp className="h-4 w-4" />
              <span>{formatVoteCount(localVoteCount)}</span>
            </Button>
          </div>
          
          <div className="flex space-x-2">
            <Link href={`/servers/${server.id}`}>
              <Button size="sm" variant="outline" className="flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                Details
              </Button>
            </Link>
            
            {server.game === 'minecraft' ? (
              <Button size="sm" onClick={handleCopyIP} className="flex items-center gap-1">
                <Copy className="h-3 w-3" />
                Copy IP
              </Button>
            ) : (
              <a href={generateSteamConnectLink(server.ip, server.port)} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="flex items-center gap-1">
                  <FaSteam className="h-3 w-3" />
                  Connect
                </Button>
              </a>
            )}
          </div>
        </div>
        
        {isFeatured && (
          <div className="mt-2">
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
              <span className="mr-1">★</span>
              Featured
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
