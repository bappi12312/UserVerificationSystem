import { users, type User, type InsertUser, servers, type Server, type InsertServer, votes, type Vote, type InsertVote, games, type Game, type InsertGame } from "@shared/schema";
import { db } from './db';
import { eq, and, like, ilike, asc, desc, sql, count, isNull, or } from 'drizzle-orm';

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
      verificationToken: userData.verificationToken || null,
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
          // For votes, we need to sort manually since it requires async
          // This isn't efficient but works for in-memory storage
          const voteCountsMap = new Map<number, number>();
          for (const server of servers) {
            voteCountsMap.set(server.id, await this.getVoteCount(server.id));
          }
          servers = servers.sort((a, b) => {
            return (voteCountsMap.get(b.id) || 0) - (voteCountsMap.get(a.id) || 0);
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

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      sql`LOWER(${users.username}) = LOWER(${username})`
    );
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      sql`LOWER(${users.email}) = LOWER(${email})`
    );
    return user;
  }
  
  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.verificationToken, token));
    return user;
  }

  async createUser(userData: InsertUser & { verificationToken?: string }): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Server operations
  async getServer(id: number): Promise<Server | undefined> {
    const [server] = await db.select().from(servers).where(eq(servers.id, id));
    return server;
  }
  
  async getServersByUser(userId: number): Promise<Server[]> {
    return await db.select().from(servers).where(eq(servers.userId, userId));
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
    // Base conditions
    let conditions = [];
    
    // Always show approved servers
    conditions.push(eq(servers.isApproved, true));
    
    // Apply filters
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(servers.name, searchTerm),
          ilike(servers.description, searchTerm),
          ilike(servers.ip, searchTerm)
        )
      );
    }
    
    if (filters.game) {
      conditions.push(eq(servers.game, filters.game));
    }
    
    if (filters.region) {
      conditions.push(eq(servers.region, filters.region));
    }
    
    if (filters.status === 'online') {
      conditions.push(eq(servers.isOnline, true));
    }
    
    if (filters.status === 'featured') {
      conditions.push(eq(servers.isFeatured, true));
    }
    
    if (filters.isFeatured !== undefined) {
      conditions.push(eq(servers.isFeatured, filters.isFeatured));
    }
    
    // Count total
    const [countResult] = await db
      .select({ count: count() })
      .from(servers)
      .where(and(...conditions));
    
    const total = Number(countResult?.count) || 0;
    
    // Handle sorting
    let serverResults: Server[] = [];
    
    if (filters.sort === 'votes') {
      // Special handling for vote sorting with a join
      const results = await db
        .select({
          server: servers,
          voteCount: sql<number>`COUNT(${votes.id})`.as('vote_count')
        })
        .from(servers)
        .leftJoin(votes, eq(servers.id, votes.serverId))
        .where(and(...conditions))
        .groupBy(servers.id)
        .orderBy(desc(sql<number>`COUNT(${votes.id})`))
        .limit(filters.limit || 10)
        .offset(((filters.page || 1) - 1) * (filters.limit || 10));
        
      serverResults = results.map(r => r.server);
    } else {
      // For other sorts, use direct queries
      const query = db.select()
        .from(servers)
        .where(and(...conditions))
        .limit(filters.limit || 10)
        .offset(((filters.page || 1) - 1) * (filters.limit || 10));
      
      // Apply specific ordering
      if (filters.sort === 'players') {
        serverResults = await query.orderBy(desc(servers.currentPlayers));
      } else if (filters.sort === 'name') {
        serverResults = await query.orderBy(asc(servers.name));
      } else {
        // Default to newest
        serverResults = await query.orderBy(desc(servers.createdAt));
      }
    }
    
    return { 
      servers: serverResults, 
      total 
    };
  }
  
  async createServer(serverData: InsertServer): Promise<Server> {
    const [server] = await db.insert(servers).values(serverData).returning();
    return server;
  }
  
  async updateServer(id: number, serverData: Partial<Server>): Promise<Server | undefined> {
    // Add lastUpdated timestamp
    const updatedData = {
      ...serverData,
      lastUpdated: new Date()
    };
    
    const [server] = await db.update(servers)
      .set(updatedData)
      .where(eq(servers.id, id))
      .returning();
    return server;
  }
  
  async deleteServer(id: number): Promise<boolean> {
    const result = await db.delete(servers).where(eq(servers.id, id));
    return !!result;
  }
  
  // Vote operations
  async getVote(userId: number, serverId: number): Promise<Vote | undefined> {
    const [vote] = await db.select()
      .from(votes)
      .where(
        and(
          eq(votes.userId, userId),
          eq(votes.serverId, serverId)
        )
      );
    return vote;
  }
  
  async getVotesByServer(serverId: number): Promise<Vote[]> {
    return await db.select()
      .from(votes)
      .where(eq(votes.serverId, serverId));
  }
  
  async getVoteCount(serverId: number): Promise<number> {
    const [result] = await db.select({ count: count() })
      .from(votes)
      .where(eq(votes.serverId, serverId));
    return Number(result?.count) || 0;
  }
  
  async createVote(voteData: InsertVote): Promise<Vote> {
    const [vote] = await db.insert(votes).values(voteData).returning();
    return vote;
  }
  
  async deleteVote(userId: number, serverId: number): Promise<boolean> {
    const result = await db.delete(votes)
      .where(
        and(
          eq(votes.userId, userId),
          eq(votes.serverId, serverId)
        )
      );
    return !!result;
  }
  
  // Game operations
  async getGames(): Promise<Game[]> {
    return await db.select().from(games);
  }
  
  async getGame(id: number): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game;
  }
  
  async getGameByShortName(shortName: string): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.shortName, shortName));
    return game;
  }
  
  async createGame(gameData: InsertGame): Promise<Game> {
    const [game] = await db.insert(games).values(gameData).returning();
    return game;
  }
}

// Initialize the database with default games if they don't exist
const initializeGames = async () => {
  const defaultGames: InsertGame[] = [
    { name: "Counter-Strike 2", shortName: "cs2" },
    { name: "Minecraft", shortName: "minecraft" },
    { name: "Rust", shortName: "rust" },
    { name: "GTA V", shortName: "gta5" },
    { name: "Valheim", shortName: "valheim" }
  ];

  try {
    // Check if games already exist
    const existingGames = await db.select().from(games);
    
    if (existingGames.length === 0) {
      console.log('Initializing games in database...');
      await db.insert(games).values(defaultGames);
      console.log('Default games initialized successfully');
    }
  } catch (error) {
    console.error('Failed to initialize games in database:', error);
  }
};

// Initialize the database
initializeGames().catch(error => {
  console.error('Failed to initialize database:', error);
});

// Switch from MemStorage to DatabaseStorage
export const storage = new DatabaseStorage();
