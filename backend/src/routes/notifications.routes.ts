import { Router, Request, Response } from 'express';
import { dbStore } from '../database/store.js';
import { authMiddleware } from '../middleware/auth.js';

export const notificationsRouter = Router();

notificationsRouter.use(authMiddleware);

// GET /api/notifications
notificationsRouter.get('/', (req: Request, res: Response) => {
  const userNotifications = dbStore.data.notifications.filter(
    n => !n.userId || n.userId === req.user?.id
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    notifications: userNotifications,
    unreadCount: userNotifications.filter(n => !n.isRead).length,
  });
});

// PATCH /api/notifications/:id/read
notificationsRouter.patch('/:id/read', (req: Request, res: Response) => {
  const notif = dbStore.data.notifications.find(n => n.id === req.params.id);
  if (notif) {
    notif.isRead = true;
    dbStore.persist();
  }
  res.json({ message: 'Notification marked as read' });
});

// POST /api/notifications/mark-all-read
notificationsRouter.post('/mark-all-read', (req: Request, res: Response) => {
  dbStore.data.notifications.forEach(n => {
    if (!n.userId || n.userId === req.user?.id) {
      n.isRead = true;
    }
  });
  dbStore.persist();
  res.json({ message: 'All notifications marked as read' });
});
