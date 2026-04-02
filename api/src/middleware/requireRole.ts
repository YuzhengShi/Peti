import { Request, Response, NextFunction } from 'express';

export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
      });
    }
    next();
  };
}
