import { users, type User, type InsertUser, servers, type Server, type InsertServer, votes, type Vote, type InsertVote, games, type Game, type InsertGame } from "@shared/schema";

// Storage interface with CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser & { verificationToken?: string }): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Server operations
  getServer(id: number): Promise<Server | undefined>;
  getServersByUser(userId: number): Promise<Server[]>;
  getServers(filters: {
    search?: string;
    game?: string;
    region?: string;
    status?: string;
    sort?: "votes" | "players" | "newest" | "name";
    isFeatured?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ servers: Server[]; total: number }>;
  createServer(server: InsertServer): Promise<Server>;
  updateServer(id: number, server: Partial<Server>): Promise<Server | undefined>;
  deleteServer(id: number): Promise<boolean>;
  
  // Vote operations
  getVote(userId: number, serverId: number): Promise<Vote | undefined>;
  getVotesByServer(serverId: number): Promise<Vote[]>;
  getVoteCount(serverId: number): Promise<number>;
  createVote(vote: InsertVote): Promise<Vote>;
  deleteVote(userId: number, serverId: number): Promise<boolean>;
  
  // Game operations
  getGames(): Promise<Game[]>;
  getGame(id: number): Promise<Game | undefined>;
  getGameByShortName(shortName: string): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private servers: Map<number, Server>;
  private votes: Map<string, Vote>;
  private games: Map<number, Game>;
  
  private userId: number;
  private serverId: number;
  private voteId: number;
  private gameId: number;

  constructor() {
    this.users = new Map();
    this.servers = new Map();
    this.votes = new Map();
    this.games = new Map();
    
    this.userId = 1;
    this.serverId = 1;
    this.voteId = 1;
    this.gameId = 1;
    
    // Initialize with sample games
    this.initGames();
  }
  
  private initGames() {
    const gameData: InsertGame[] = [
      { name: "Counter-Strike 2", shortName: "cs2" },
      { name: "Minecraft", shortName: "minecraft" },
      { name: "Rust", shortName: "rust" },
      { name: "GTA V", shortName: "gta5" },
      { name: "Valheim", shortName: "valheim" }
    ];
    
    gameData.forEach(game => this.createGame(game));
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }
  
  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.verificationToken === token,
    );
  }

  async createUser(userData: InsertUser & { verificationToken?: string }): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = { 
      ...userData, 
      id, 
      isVerified: false,
      isAdmin: false,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Server operations
  async getServer(id: number): Promise<Server | undefined> {
    return this.servers.get(id);
  }
  
  async getServersByUser(userId: number): Promise<Server[]> {
    return Array.from(this.servers.values()).filter(
      (server) => server.userId === userId,
    );
  }
  
  async getServers(filters: {
    search?: string;
    game?: string;
    region?: string;
    status?: string;
    sort?: "votes" | "players" | "newest" | "name";
    isFeatured?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ servers: Server[]; total: number }> {
    let servers = Array.from(this.servers.values());
    
    // Apply filters
    if (filters.search) {
      const search = filters.search.toLowerCase();
      servers = servers.filter(
        (server) => 
          server.name.toLowerCase().includes(search) || 
          server.description.toLowerCase().includes(search) ||
          server.ip.toLowerCase().includes(search)
      );
    }
    
    if (filters.game) {
      servers = servers.filter((server) => server.game === filters.game);
    }
    
    if (filters.region) {
      servers = servers.filter((server) => server.region === filters.region);
    }
    
    if (filters.status === 'online') {
      servers = servers.filter((server) => server.isOnline);
    }
    
    if (filters.status === 'featured') {
      servers = servers.filter((server) => server.isFeatured);
    }
    
    if (filters.isFeatured !== undefined) {
      servers = servers.filter((server) => server.isFeatured === filters.isFeatured);
    }
    
    // Must be approved
    servers = servers.filter((server) => server.isApproved);
    
    // Count total before pagination
    const total = servers.length;
    
    // Apply sorting
    if (filters.sort) {
      switch (filters.sort) {
        case 'votes':
          // We'll need to get vote count for each server
          servers = servers.sort(async (a, b) => {
            const aVotes = await this.getVoteCount(a.id);
            const bVotes = await this.getVoteCount(b.id);
            return bVotes - aVotes;
          });
          break;
        case 'players':
          servers = servers.sort((a, b) => b.currentPlayers - a.currentPlayers);
          break;
        case 'newest':
          servers = servers.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          break;
        case 'name':
          servers = servers.sort((a, b) => a.name.localeCompare(b.name));
          break;
      }
    }
    
    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    servers = servers.slice(start, end);
    
    return { servers, total };
  }
  
  async createServer(serverData: InsertServer): Promise<Server> {
    const id = this.serverId++;
    const now = new Date();
    const server: Server = { 
      ...serverData, 
      id, 
      isApproved: false, 
      isFeatured: false,
      isOnline: false,
      currentPlayers: 0,
      maxPlayers: 0,
      currentMap: null,
      lastUpdated: now,
      createdAt: now
    };
    this.servers.set(id, server);
    return server;
  }
  
  async updateServer(id: number, serverData: Partial<Server>): Promise<Server | undefined> {
    const server = await this.getServer(id);
    if (!server) return undefined;
    
    const updatedServer = { ...server, ...serverData, lastUpdated: new Date() };
    this.servers.set(id, updatedServer);
    return updatedServer;
  }
  
  async deleteServer(id: number): Promise<boolean> {
    return this.servers.delete(id);
  }
  
  // Vote operations
  async getVote(userId: number, serverId: number): Promise<Vote | undefined> {
    return this.votes.get(`${userId}:${serverId}`);
  }
  
  async getVotesByServer(serverId: number): Promise<Vote[]> {
    return Array.from(this.votes.values()).filter(
      (vote) => vote.serverId === serverId,
    );
  }
  
  async getVoteCount(serverId: number): Promise<number> {
    return (await this.getVotesByServer(serverId)).length;
  }
  
  async createVote(voteData: InsertVote): Promise<Vote> {
    const id = this.voteId++;
    const now = new Date();
    const vote: Vote = { ...voteData, id, createdAt: now };
    this.votes.set(`${vote.userId}:${vote.serverId}`, vote);
    return vote;
  }
  
  async deleteVote(userId: number, serverId: number): Promise<boolean> {
    return this.votes.delete(`${userId}:${serverId}`);
  }
  
  // Game operations
  async getGames(): Promise<Game[]> {
    return Array.from(this.games.values());
  }
  
  async getGame(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }
  
  async getGameByShortName(shortName: string): Promise<Game | undefined> {
    return Array.from(this.games.values()).find(
      (game) => game.shortName === shortName,
    );
  }
  
  async createGame(gameData: InsertGame): Promise<Game> {
    const id = this.gameId++;
    const game: Game = { ...gameData, id };
    this.games.set(id, game);
    return game;
  }
}

export const storage = new MemStorage();
