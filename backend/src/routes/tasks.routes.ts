import { Router, Request, Response } from 'express';
import { dbStore } from '../database/store.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import { PERMISSIONS } from '../config/index.js';

export const tasksRouter = Router();

tasksRouter.use(authMiddleware);

// GET /api/tasks
tasksRouter.get('/', requirePermission(PERMISSIONS.CASE_VIEW), (req: Request, res: Response) => {
  const { caseId, status, priority } = req.query;
  let tasks = [...dbStore.data.tasks];

  if (caseId) {
    tasks = tasks.filter(t => t.caseId === caseId);
  }
  if (status) {
    tasks = tasks.filter(t => t.status === status);
  }
  if (priority) {
    tasks = tasks.filter(t => t.priority === priority);
  }

  const enriched = tasks.map(t => ({
    ...t,
    case: dbStore.data.cases.find(c => c.id === t.caseId) || null,
    assignedTo: dbStore.data.users.find(u => u.id === t.assignedToId) || null,
    createdBy: dbStore.data.users.find(u => u.id === t.createdById) || null,
  }));

  res.json({ tasks: enriched, count: enriched.length });
});

// POST /api/tasks
tasksRouter.post('/', requirePermission(PERMISSIONS.CASE_EDIT), (req: Request, res: Response) => {
  const { title, description, priority, dueDate, caseId, assignedToId } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const id = `tsk-${Date.now().toString(36)}`;
  const newTask = {
    id,
    title,
    description: description || '',
    status: 'TODO',
    priority: priority || 'MEDIUM',
    dueDate: dueDate || null,
    caseId: caseId || null,
    assignedToId: assignedToId || req.user?.id,
    createdById: req.user?.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  dbStore.data.tasks.push(newTask);
  dbStore.persist();

  res.status(201).json({ message: 'Investigation task created', task: newTask });
});

// PATCH /api/tasks/:id
tasksRouter.patch('/:id', requirePermission(PERMISSIONS.CASE_EDIT), (req: Request, res: Response) => {
  const task = dbStore.data.tasks.find(t => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  Object.assign(task, req.body, { updatedAt: new Date().toISOString() });
  dbStore.persist();

  res.json({ message: 'Task updated successfully', task });
});
