import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; roles: string[] };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Missing Authorization header' });
  const token = header.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; email: string; roles?: string[] };
    req.user = { id: payload.sub, email: payload.email, roles: payload.roles || [] };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRoles(required: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const roles = req.user?.roles || [];
    const ok = required.some((r) => roles.includes(r));
    if (!ok) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}
