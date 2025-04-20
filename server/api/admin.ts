import { Router } from 'express';
import { storage } from '../storage';
import { sendServerApprovalEmail } from '../lib/email';

const router = Router();

// Middleware to ensure user is an admin
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}

// Get all pending servers
router.get('/servers/pending', requireAdmin, async (req, res) => {
  try {
    const { servers } = await storage.getServers({
      isApproved: false
    });
    
    return res.status(200).json(servers);
  } catch (error) {
    console.error('Error getting pending servers:', error);
    return res.status(500).json({ message: 'An error occurred while fetching pending servers' });
  }
});

// Approve or reject a server
router.patch('/servers/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid server ID' });
    }
    
    const { approve } = req.body;
    if (typeof approve !== 'boolean') {
      return res.status(400).json({ message: 'Approve parameter must be a boolean' });
    }
    
    // Get server
    const server = await storage.getServer(id);
    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }
    
    // Update server
    const updatedServer = await storage.updateServer(id, {
      isApproved: approve
    });
    
    if (!updatedServer) {
      return res.status(500).json({ message: 'Failed to update server' });
    }
    
    // Get server owner
    const user = await storage.getUser(server.userId);
    if (user) {
      // Send email notification
      await sendServerApprovalEmail(user, server.name, approve);
    }
    
    return res.status(200).json({
      message: `Server ${approve ? 'approved' : 'rejected'} successfully`,
      server: updatedServer
    });
  } catch (error) {
    console.error('Error approving/rejecting server:', error);
    return res.status(500).json({ message: 'An error occurred while processing the server' });
  }
});

// Set a server as featured
router.patch('/servers/:id/feature', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid server ID' });
    }
    
    const { featured } = req.body;
    if (typeof featured !== 'boolean') {
      return res.status(400).json({ message: 'Featured parameter must be a boolean' });
    }
    
    // Get server
    const server = await storage.getServer(id);
    if (!server) {
      return res.status(404).json({ message: 'Server not found' });
    }
    
    // Update server
    const updatedServer = await storage.updateServer(id, {
      isFeatured: featured
    });
    
    if (!updatedServer) {
      return res.status(500).json({ message: 'Failed to update server' });
    }
    
    return res.status(200).json({
      message: `Server ${featured ? 'featured' : 'unfeatured'} successfully`,
      server: updatedServer
    });
  } catch (error) {
    console.error('Error featuring server:', error);
    return res.status(500).json({ message: 'An error occurred while featuring the server' });
  }
});

export default router;
