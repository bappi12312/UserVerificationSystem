import * as jwt from 'jsonwebtoken';
import { type User } from '@shared/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'development_secret_key';
const JWT_EXPIRES_IN = '7d';

export interface JwtPayload {
  userId: number;
  username: string;
  email: string;
  isAdmin: boolean;
}

export function generateToken(user: User): string {
  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    email: user.email,
    isAdmin: user.isAdmin
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
}
