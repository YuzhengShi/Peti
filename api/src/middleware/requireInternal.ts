/**
 * Internal API auth middleware — validates x-internal-secret header.
 * Used by MCP tools calling /api/internal/* endpoints from containers.
 */

import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export function requireInternal(req: Request, res: Response, next: NextFunction) {
  const secret = req.headers['x-internal-secret'];
  if (secret !== config.internalSecret) {
    return res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'Invalid internal secret' },
    });
  }
  next();
}
