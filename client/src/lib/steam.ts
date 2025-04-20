import { Server } from '@shared/schema';
import { apiRequest } from './queryClient';

export interface ServerWithVotes extends Server {
  voteCount: number;
  hasVoted: boolean;
}

export interface PaginatedServers {
  servers: ServerWithVotes[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ServerFilters {
  search?: string;
  game?: string;
  region?: string;
  status?: string;
  sort?: 'votes' | 'players' | 'newest' | 'name';
  page?: number;
  limit?: number;
}

export async function getServers(filters: ServerFilters = {}): Promise<PaginatedServers> {
  // Build query string
  const params = new URLSearchParams();
  
  if (filters.search) params.append('search', filters.search);
  if (filters.game) params.append('game', filters.game);
  if (filters.region) params.append('region', filters.region);
  if (filters.status) params.append('status', filters.status);
  if (filters.sort) params.append('sort', filters.sort);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  
  const res = await fetch(`/api/servers?${params.toString()}`, {
    credentials: 'include',
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to fetch servers');
  }
  
  return await res.json();
}

export async function getFeaturedServers(): Promise<ServerWithVotes[]> {
  const res = await fetch('/api/servers/featured', {
    credentials: 'include',
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to fetch featured servers');
  }
  
  return await res.json();
}

export async function getServerDetails(id: number): Promise<ServerWithVotes> {
  const res = await fetch(`/api/servers/${id}`, {
    credentials: 'include',
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to fetch server details');
  }
  
  return await res.json();
}

export async function submitServer(serverData: Omit<Server, 'id' | 'userId' | 'isApproved' | 'isFeatured' | 'isOnline' | 'currentPlayers' | 'maxPlayers' | 'currentMap' | 'lastUpdated' | 'createdAt'>): Promise<Server> {
  const res = await apiRequest('POST', '/api/servers', serverData);
  
  return await res.json();
}

export async function voteForServer(serverId: number): Promise<{ message: string; voted: boolean; voteCount: number }> {
  const res = await apiRequest('POST', `/api/votes/${serverId}`);
  
  return await res.json();
}

export async function getGames(): Promise<{ id: number; name: string; shortName: string }[]> {
  const res = await fetch('/api/servers/games/list', {
    credentials: 'include',
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to fetch games');
  }
  
  return await res.json();
}
