import { Router } from 'express';
import { storage } from '../storage';

const router = Router();

// Vote for a server (requires authentication)
router.post('/:serverId', async (req, res) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required to vote' });
  }
  
  try {
    const serverId = parseInt(req.params.serverId);
    if (isNaN(serverId)) {
      return res.status(400).json({ message: 'Invalid server ID' });
    }
    
    // Check if server exists
    const server = await storage.getServer(serverId);
    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }
    
    // Check if user has already voted
    const existingVote = await storage.getVote(req.user.userId, serverId);
    if (existingVote) {
      // If already voted, remove the vote (toggle)
      await storage.deleteVote(req.user.userId, serverId);
      return res.status(200).json({ 
        message: 'Vote removed successfully',
        voted: false
      });
    }
    
    // Add vote
    await storage.createVote({
      userId: req.user.userId,
      serverId
    });
    
    // Get updated vote count
    const voteCount = await storage.getVoteCount(serverId);
    
    return res.status(201).json({
      message: 'Vote added successfully',
      voted: true,
      voteCount
    });
  } catch (error) {
    console.error('Error voting for server:', error);
    return res.status(500).json({ message: 'An error occurred while voting' });
  }
});

// Get vote count for a server
router.get('/:serverId/count', async (req, res) => {
  try {
    const serverId = parseInt(req.params.serverId);
    if (isNaN(serverId)) {
      return res.status(400).json({ message: 'Invalid server ID' });
    }
    
    // Check if server exists
    const server = await storage.getServer(serverId);
    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }
    
    // Get vote count
    const voteCount = await storage.getVoteCount(serverId);
    
    // Check if user has voted
    let hasVoted = false;
    if (req.user) {
      const vote = await storage.getVote(req.user.userId, serverId);
      hasVoted = !!vote;
    }
    
    return res.status(200).json({
      voteCount,
      hasVoted
    });
  } catch (error) {
    console.error('Error getting vote count:', error);
    return res.status(500).json({ message: 'An error occurred while fetching vote count' });
  }
});

export default router;
