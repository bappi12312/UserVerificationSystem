import { Router } from 'express';
import { insertServerSchema, serverSearchSchema } from '@shared/schema';
import { storage } from '../storage';
import { queryServer } from '../lib/steam-query';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

const router = Router();

// Get all servers with filtering
router.get('/', async (req, res) => {
  try {
    const {
      search,
      game,
      region,
      status,
      sort = 'votes',
      page = 1,
      limit = 9
    } = serverSearchSchema.parse({
      ...req.query,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 9
    });
    
    const { servers, total } = await storage.getServers({
      search,
      game,
      region,
      status,
      sort: sort as 'votes' | 'players' | 'newest' | 'name',
      page,
      limit
    });
    
    // Get vote counts for each server
    const serversWithVotes = await Promise.all(
      servers.map(async (server) => {
        const voteCount = await storage.getVoteCount(server.id);
        // Check if user has voted
        let hasVoted = false;
        if (req.user) {
          const vote = await storage.getVote(req.user.userId, server.id);
          hasVoted = !!vote;
        }
        return {
          ...server,
          voteCount,
          hasVoted
        };
      })
    );
    
    return res.status(200).json({
      servers: serversWithVotes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    console.error('Error getting servers:', error);
    return res.status(500).json({ message: 'An error occurred while fetching servers' });
  }
});

// Get featured servers
router.get('/featured', async (req, res) => {
  try {
    const { servers } = await storage.getServers({
      isFeatured: true,
      limit: 3
    });
    
    // Get vote counts for each server
    const serversWithVotes = await Promise.all(
      servers.map(async (server) => {
        const voteCount = await storage.getVoteCount(server.id);
        // Check if user has voted
        let hasVoted = false;
        if (req.user) {
          const vote = await storage.getVote(req.user.userId, server.id);
          hasVoted = !!vote;
        }
        return {
          ...server,
          voteCount,
          hasVoted
        };
      })
    );
    
    return res.status(200).json(serversWithVotes);
  } catch (error) {
    console.error('Error getting featured servers:', error);
    return res.status(500).json({ message: 'An error occurred while fetching featured servers' });
  }
});

// Get single server by ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid server ID' });
    }
    
    const server = await storage.getServer(id);
    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }
    
    // Get vote count
    const voteCount = await storage.getVoteCount(server.id);
    
    // Check if user has voted
    let hasVoted = false;
    if (req.user) {
      const vote = await storage.getVote(req.user.userId, server.id);
      hasVoted = !!vote;
    }
    
    // Get real-time server data if possible
    let serverData = { ...server };
    try {
      const queryResult = await queryServer(server);
      if (queryResult) {
        // Update server with latest data
        const updatedServer = await storage.updateServer(server.id, queryResult);
        if (updatedServer) {
          serverData = updatedServer;
        }
      }
    } catch (error) {
      console.error(`Error querying server ${server.ip}:${server.port}:`, error);
    }
    
    return res.status(200).json({
      ...serverData,
      voteCount,
      hasVoted
    });
  } catch (error) {
    console.error('Error getting server:', error);
    return res.status(500).json({ message: 'An error occurred while fetching the server' });
  }
});

// Add a new server (requires authentication)
router.post('/', async (req, res) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  try {
    // Validate request body
    const serverData = insertServerSchema.parse({
      ...req.body,
      userId: req.user.userId
    });
    
    // Create server
    const server = await storage.createServer(serverData);
    
    return res.status(201).json({
      ...server,
      message: 'Server submitted successfully and is pending approval'
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    console.error('Error creating server:', error);
    return res.status(500).json({ message: 'An error occurred while creating the server' });
  }
});

// Get available games
router.get('/games/list', async (req, res) => {
  try {
    const games = await storage.getGames();
    return res.status(200).json(games);
  } catch (error) {
    console.error('Error getting games:', error);
    return res.status(500).json({ message: 'An error occurred while fetching games' });
  }
});

export default router;
