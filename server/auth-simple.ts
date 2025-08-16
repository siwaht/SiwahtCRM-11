import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import type { User } from '@shared/schema';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    console.log('Login attempt with email:', email);

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Try to find user by email first, then by username
    let user = await storage.getUserByEmail(email);
    if (!user) {
      user = await storage.getUserByUsername(email); // Allow login with username
      console.log('User lookup by username:', user ? 'found' : 'not found');
    } else {
      console.log('User lookup by email:', user ? 'found' : 'not found');
    }

    if (!user || !user.isActive) {
      console.log('User not found or inactive');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('User found, verifying password...');
    const isValidPassword = await verifyPassword(password, user.password);
    console.log('Password verification result:', isValidPassword);
    
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Store user in session
    req.session.userId = user.id;
    req.session.userRole = user.role;
    console.log('Session created for user:', user.id);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function logout(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Could not log out' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
}

export async function getCurrentUser(req: Request, res: Response) {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const user = await storage.getUser(req.session.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
}

export function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId || !req.session.userRole) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.session.userRole)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Load full user for request
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: 'User not found' });
      }
      req.user = user;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
}

declare module 'express-session' {
  interface SessionData {
    userId?: number;
    userRole?: string;
  }
}
