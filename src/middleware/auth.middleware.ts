import { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';

/**
 * Lightweight middleware that checks if the request has a valid admin token in the header.
 */
export function adminAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-admin-token'];

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: "Missing 'x-admin-token' authentication header.",
    });
    return;
  }

  if (token !== config.ADMIN_TOKEN) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid administration token provided.',
    });
    return;
  }

  next();
}
