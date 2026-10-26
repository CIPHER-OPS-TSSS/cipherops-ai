import { Router, Request, Response } from 'express';
import { dbStore } from '../database/store.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { ROLES, RoleType } from '../config/index.js';

export const adminRouter = Router();

adminRouter.use(authMiddleware);

// GET /api/admin/users
adminRouter.get('/users', requireRole(ROLES.SYSTEM_ADMINISTRATOR, ROLES.INVESTIGATION_SUPERVISOR), (req: Request, res: Response) => {
  const users = dbStore.data.users.map(u => ({
    id: u.id,
    email: u.email,
    badgeNumber: u.badgeNumber,
    fullName: u.fullName,
    role: u.role,
    department: u.department,
    isActive: u.isActive,
    mfaEnabled: u.mfaEnabled,
  }));

  res.json({ users, count: users.length });
});

// PATCH /api/admin/users/:id/role
adminRouter.patch('/users/:id/role', requireRole(ROLES.SYSTEM_ADMINISTRATOR), (req: Request, res: Response) => {
  const { role } = req.body;
  const user = dbStore.data.users.find(u => u.id === req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const oldRole = user.role;
  user.role = role as RoleType;
  dbStore.persist();

  dbStore.logAudit({
    userId: req.user?.id,
    userBadge: req.user?.badgeNumber,
    userName: req.user?.fullName,
    action: 'PERMISSION_CHANGE',
    targetResource: `User:${user.badgeNumber}`,
    details: `Updated role for user ${user.fullName} (${user.badgeNumber}) from ${oldRole} to ${role}`,
    ipAddress: req.ip,
  });

  res.json({ message: 'User role updated successfully', user });
});

// POST /api/admin/system/reset-demo - Resets to baseline fictional demo dataset
adminRouter.post('/system/reset-demo', requireRole(ROLES.SYSTEM_ADMINISTRATOR), (req: Request, res: Response) => {
  const fresh = dbStore.resetToSeed();

  dbStore.logAudit({
    userId: req.user?.id,
    userBadge: req.user?.badgeNumber,
    userName: req.user?.fullName,
    action: 'RECORD_CREATE',
    targetResource: 'System:DatabaseStore',
    details: 'Reset system database to baseline fictional demo dataset',
    ipAddress: req.ip,
  });

  res.json({ message: 'Demo database reset to original fictional seed successfully', counts: {
    cases: fresh.cases.length,
    persons: fresh.persons.length,
    incidents: fresh.incidents.length,
    locations: fresh.locations.length,
    documents: fresh.documents.length,
    evidence: fresh.evidenceItems.length,
  }});
});
