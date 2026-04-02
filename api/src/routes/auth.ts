import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';
import { config } from '../config';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { email, username, password } = req.body;

  // Server-side validation
  const errors: Record<string, string> = {};
  if (!email || typeof email !== 'string') {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Invalid email format';
  }
  if (!username || typeof username !== 'string') {
    errors.username = 'Username is required';
  } else if (username.length < 3 || username.length > 20) {
    errors.username = 'Username must be 3-20 characters';
  }
  if (!password || typeof password !== 'string') {
    errors.password = 'Password is required';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  } else if (!/[A-Z]/.test(password)) {
    errors.password = 'Password must contain at least one uppercase letter';
  } else if (!/[0-9]/.test(password)) {
    errors.password = 'Password must contain at least one number';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors },
    });
  }

  // Check uniqueness
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    const field = existing.email === email ? 'email' : 'username';
    return res.status(409).json({
      error: { code: 'CONFLICT', message: `${field} already exists` },
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, username, passwordHash, role: 'user' },
  });

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    config.jwtSecret,
    { expiresIn: config.accessTokenExpirySeconds }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  return res.status(201).json({
    data: { id: user.id, email: user.email, username: user.username, role: user.role },
  });
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' },
    });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' },
    });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' },
    });
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    config.jwtSecret,
    { expiresIn: config.accessTokenExpirySeconds }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
  });

  return res.json({
    data: { id: user.id, email: user.email, username: user.username, role: user.role },
  });
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token');
  return res.json({ data: { message: 'Logged out' } });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, email: true, username: true, role: true, createdAt: true },
  });
  if (!user) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'User not found' },
    });
  }
  return res.json({ data: user });
});

export default router;
