import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CONFIG, ROLE_PERMISSIONS, RoleType } from '../config/index.js';
import { dbStore } from '../database/store.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  badgeNumber: string;
  fullName: string;
  role: RoleType;
  department: string;
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Allow demo quick-role switching header for seamless testing if no auth token
  const demoRole = req.header('X-Demo-Role') as RoleType | undefined;
  const authHeader = req.header('Authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as any;
      const user = dbStore.data.users.find(u => u.id === decoded.id);

      if (!user || !user.isActive) {
        return res.status(401).json({ error: 'User session has expired or account is inactive' });
      }

      req.user = {
        id: user.id,
        email: user.email,
        badgeNumber: user.badgeNumber,
        fullName: user.fullName,
        role: user.role as RoleType,
        department: user.department,
        permissions: ROLE_PERMISSIONS[user.role as RoleType] || [],
      };
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired authentication token' });
    }
  }

  // Quick fallback if demo header is specified
  if (demoRole && ROLE_PERMISSIONS[demoRole]) {
    const matchingUser = dbStore.data.users.find(u => u.role === demoRole) || dbStore.data.users[0];
    req.user = {
      id: matchingUser.id,
      email: matchingUser.email,
      badgeNumber: matchingUser.badgeNumber,
      fullName: matchingUser.fullName,
      role: demoRole,
      department: matchingUser.department,
      permissions: ROLE_PERMISSIONS[demoRole],
    };
    return next();
  }

  return res.status(401).json({ error: 'Authentication required. Please provide a valid Bearer token.' });
}

export function requireRole(...allowedRoles: RoleType[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access Denied: Role '${req.user.role}' lacks sufficient privileges for this operation.`,
        requiredRoles: allowedRoles,
      });
    }
    next();
  };
}

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({
        error: `Access Denied: Missing required permission '${permission}'.`,
      });
    }
    next();
  };
}
