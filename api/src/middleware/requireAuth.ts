import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthPayload {
  userId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
    });
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({
      error: { code: 'TOKEN_EXPIRED', message: 'Token expired or invalid' },
    });
  }
}
