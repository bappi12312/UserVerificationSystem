import { Router } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { insertUserSchema, loginSchema, registerUserSchema } from '@shared/schema';
import { storage } from '../storage';
import { generateToken } from '../lib/jwt';
import { sendVerificationEmail } from '../lib/email';
import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';

const router = Router();
const SALT_ROUNDS = 10;

// Register a new user
router.post('/register', async (req, res) => {
  try {
    // Validate request body
    const validatedData = registerUserSchema.parse(req.body);
    
    // Check if user already exists
    const existingByEmail = await storage.getUserByEmail(validatedData.email);
    if (existingByEmail) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    
    const existingByUsername = await storage.getUserByUsername(validatedData.username);
    if (existingByUsername) {
      return res.status(400).json({ message: 'Username already taken' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, SALT_ROUNDS);
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Create user
    const userData = insertUserSchema.parse({
      username: validatedData.username,
      email: validatedData.email,
      password: hashedPassword,
    });
    
    const user = await storage.createUser({
      ...userData,
      verificationToken
    });
    
    // Send verification email
    await sendVerificationEmail(user, verificationToken);
    
    return res.status(201).json({ 
      message: 'User registered successfully. Please check your email to verify your account.' 
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    console.error('Error registering user:', error);
    return res.status(500).json({ message: 'An error occurred during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    // Validate request body
    const { email, password } = loginSchema.parse(req.body);
    
    // Find user
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in' });
    }
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Set HTTP-only cookie with JWT
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'strict'
    });
    
    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    console.error('Error logging in:', error);
    return res.status(500).json({ message: 'An error occurred during login' });
  }
});

// Verify email
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: 'Invalid token' });
    }
    
    // Find user by verification token
    const user = await storage.getUserByVerificationToken(token);
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
    // Update user
    await storage.updateUser(user.id, {
      isVerified: true,
      verificationToken: null
    });
    
    return res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    console.error('Error verifying email:', error);
    return res.status(500).json({ message: 'An error occurred during email verification' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  // Clear auth cookie
  res.clearCookie('auth_token');
  return res.status(200).json({ message: 'Logged out successfully' });
});

// Get current user
router.get('/me', async (req, res) => {
  // User should be attached to request by auth middleware
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  const user = await storage.getUser(req.user.userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  return res.status(200).json({
    id: user.id,
    username: user.username,
    email: user.email,
    isAdmin: user.isAdmin
  });
});

export default router;
