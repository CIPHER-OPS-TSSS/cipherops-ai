import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { CONFIG } from './config/index.js';
import { authRouter } from './routes/auth.routes.js';
import { casesRouter } from './routes/cases.routes.js';
import { personsRouter } from './routes/persons.routes.js';
import { incidentsRouter } from './routes/incidents.routes.js';
import { mapRouter } from './routes/map.routes.js';
import { evidenceRouter } from './routes/evidence.routes.js';
import { documentsRouter } from './routes/documents.routes.js';
import { aiRouter } from './routes/ai.routes.js';
import { graphRouter } from './routes/graph.routes.js';
import { dashboardRouter } from './routes/dashboard.routes.js';
import { reportsRouter } from './routes/reports.routes.js';
import { tasksRouter } from './routes/tasks.routes.js';
import { notificationsRouter } from './routes/notifications.routes.js';
import { auditRouter } from './routes/audit.routes.js';
import { dataQualityRouter } from './routes/dataquality.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { entitiesRouter } from './routes/entities.routes.js';

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: false, // allow static previews
}));

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Demo-Role'],
}));

// Request logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' },
});
app.use('/api/auth/login', authLimiter);

// Serve uploaded documents safely
if (!fs.existsSync(CONFIG.UPLOAD_DIR)) {
  fs.mkdirSync(CONFIG.UPLOAD_DIR, { recursive: true });
}
app.use('/uploads', express.static(CONFIG.UPLOAD_DIR));

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    system: 'CipherOps AI Platform',
    version: '2.4.0-enterprise',
    mode: 'ACTIVE_DECISION_SUPPORT',
    timestamp: new Date().toISOString(),
    aiProvider: CONFIG.AI_PROVIDER,
  });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/cases', casesRouter);
app.use('/api/persons', personsRouter);
app.use('/api/incidents', incidentsRouter);
app.use('/api/map', mapRouter);
app.use('/api/evidence', evidenceRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/graph', graphRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/data-quality', dataQualityRouter);
app.use('/api/admin', adminRouter);
app.use('/api/entities', entitiesRouter);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    traceId: Date.now().toString(36),
  });
});

export { app };

// Start server if run directly
if (process.env.NODE_ENV !== 'test') {
  app.listen(CONFIG.PORT, () => {
    console.log(`=======================================================`);
    console.log(`🛡️  CipherOps AI Backend Online`);
    console.log(`📡  Listening on port http://localhost:${CONFIG.PORT}`);
    console.log(`🔒  Environment: ${CONFIG.NODE_ENV}`);
    console.log(`🤖  AI Provider: ${CONFIG.AI_PROVIDER} (Mock grounder ready)`);
    console.log(`=======================================================`);
  });
}
