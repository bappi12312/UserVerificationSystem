import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { verifyToken, type JwtPayload } from "./lib/jwt";
import cookieParser from "cookie-parser";
import authRoutes from "./api/auth";
import serverRoutes from "./api/servers";
import voteRoutes from "./api/votes";
import adminRoutes from "./api/admin";

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Add cookie parser middleware
  app.use(cookieParser());
  
  // Authentication middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.auth_token;
    
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        req.user = decoded;
      }
    }
    
    next();
  });
  
  // Register API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/servers', serverRoutes);
  app.use('/api/votes', voteRoutes);
  app.use('/api/admin', adminRoutes);
  
  // Status endpoint
  app.get('/api/status', (req, res) => {
    res.json({ status: 'ok' });
  });

  const httpServer = createServer(app);

  return httpServer;
}
