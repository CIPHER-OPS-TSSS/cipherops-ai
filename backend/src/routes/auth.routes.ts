import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { CONFIG, ROLE_PERMISSIONS, RoleType } from '../config/index.js';
import { dbStore } from '../database/store.js';
import { authMiddleware } from '../middleware/auth.js';

export const authRouter = Router();

// List demo users for quick 1-click login in development & testing
authRouter.get('/demo-users', (req: Request, res: Response) => {
  const demoUsers = dbStore.data.users.map(u => ({
    id: u.id,
    email: u.email,
    badgeNumber: u.badgeNumber,
    fullName: u.fullName,
    role: u.role,
    department: u.department,
  }));
  res.json({ users: demoUsers });
});

// Login endpoint
authRouter.post('/login', (req: Request, res: Response) => {
  const { identifier, password, role } = req.body;

  // Support direct role login or identifier/password matching
  let user = null;

  if (role) {
    user = dbStore.data.users.find(u => u.role === role);
  } else if (identifier) {
    user = dbStore.data.users.find(
      u => u.email.toLowerCase() === identifier.toLowerCase() ||
           u.badgeNumber.toLowerCase() === identifier.toLowerCase()
    );
  }

  if (!user) {
    dbStore.logAudit({
      action: 'LOGIN_FAILURE',
      targetResource: `Auth:${identifier || role || 'Unknown'}`,
      details: 'Failed login attempt with unrecognized credentials',
      ipAddress: req.ip,
    });
    return res.status(401).json({ error: 'Invalid badge number, email, or credentials' });
  }

  // Generate JWT access token
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      badgeNumber: user.badgeNumber,
      role: user.role,
    },
    CONFIG.JWT_SECRET as jwt.Secret,
    { expiresIn: CONFIG.JWT_EXPIRES_IN as any }
  );

  // Generate refresh token
  const refreshToken = jwt.sign(
    { id: user.id },
    CONFIG.JWT_REFRESH_SECRET as jwt.Secret,
    { expiresIn: CONFIG.JWT_REFRESH_EXPIRES_IN as any }
  );

  // Record audit log
  dbStore.logAudit({
    userId: user.id,
    userBadge: user.badgeNumber,
    userName: user.fullName,
    action: 'LOGIN_SUCCESS',
    targetResource: 'Auth:Session',
    details: `User ${user.fullName} (${user.role}) authenticated successfully.`,
    ipAddress: req.ip,
  });

  res.json({
    message: 'Authentication successful',
    token,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      badgeNumber: user.badgeNumber,
      fullName: user.fullName,
      role: user.role,
      department: user.department,
      mfaEnabled: user.mfaEnabled,
      permissions: ROLE_PERMISSIONS[user.role as RoleType] || [],
    },
  });
});

// Refresh token endpoint
authRouter.post('/refresh', (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, CONFIG.JWT_REFRESH_SECRET) as any;
    const user = dbStore.data.users.find(u => u.id === decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        badgeNumber: user.badgeNumber,
        role: user.role,
      },
      CONFIG.JWT_SECRET as jwt.Secret,
      { expiresIn: CONFIG.JWT_EXPIRES_IN as any }
    );

    res.json({ token });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// Me endpoint
authRouter.get('/me', authMiddleware, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

// Logout endpoint
authRouter.post('/logout', authMiddleware, (req: Request, res: Response) => {
  if (req.user) {
    dbStore.logAudit({
      userId: req.user.id,
      userBadge: req.user.badgeNumber,
      userName: req.user.fullName,
      action: 'LOGOUT',
      targetResource: 'Auth:Session',
      details: `User ${req.user.fullName} logged out.`,
      ipAddress: req.ip,
    });
  }
  res.json({ message: 'Successfully logged out' });
});
