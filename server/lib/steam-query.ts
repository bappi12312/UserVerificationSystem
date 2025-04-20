import * as gamedig from 'gamedig';
import { Server } from '@shared/schema';

// Mapping of our game shortnames to Gamedig compatible types
const GAME_TYPE_MAP: Record<string, string> = {
  cs2: 'cs2',
  minecraft: 'minecraft',
  rust: 'rust',
  gta5: 'fivem',
  valheim: 'valheim'
};

interface GamedigResponse {
  name: string;
  map: string;
  players: {
    online: number;
    max: number;
  };
  ping: number;
  connect: string;
  raw?: Record<string, any>;
}

export async function queryServer(server: Server): Promise<Partial<Server> | null> {
  // Get game type from our mapping
  const gameType = GAME_TYPE_MAP[server.game];
  
  if (!gameType) {
    console.error(`Unknown game type: ${server.game}`);
    return null;
  }
  
  try {
    const result = await gamedig.query({
      type: gameType,
      host: server.ip,
      port: server.port,
      maxAttempts: 2,
      socketTimeout: 3000,
    }) as GamedigResponse;
    
    return {
      isOnline: true,
      currentPlayers: result.players.online,
      maxPlayers: result.players.max,
      currentMap: result.map || null
    };
  } catch (error) {
    console.error(`Error querying server ${server.ip}:${server.port}:`, error);
    return {
      isOnline: false,
      currentPlayers: 0,
      maxPlayers: 0,
      currentMap: null
    };
  }
}

export async function queryMultipleServers(servers: Server[]): Promise<Record<number, Partial<Server>>> {
  const results: Record<number, Partial<Server>> = {};
  
  // Use Promise.allSettled to prevent one failing query from stopping all queries
  const queries = servers.map(server => 
    queryServer(server)
      .then(result => {
        if (result) {
          results[server.id] = result;
        }
        return result;
      })
      .catch(error => {
        console.error(`Error querying server ${server.ip}:${server.port}:`, error);
        results[server.id] = {
          isOnline: false,
          currentPlayers: 0,
          maxPlayers: 0,
          currentMap: null
        };
        return null;
      })
  );
  
  await Promise.allSettled(queries);
  
  return results;
}
