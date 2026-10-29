import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config';
import { studyAreaRouter } from './modules/study-areas/studyAreaRouter';
import { assetRouter } from './modules/assets/assetRouter';
import { gisRouter } from './modules/gis/gisRouter';
import { grievanceRouter } from './modules/grievances/grievanceRouter';
import { routingRouter } from './modules/routing/routingRouter';
import { maintenanceRouter } from './modules/maintenance/maintenanceRouter';
import { graphRouter } from './modules/knowledge-graph/graphRouter';
import { simulationRouter } from './modules/simulation/simulationRouter';
import { analyticsRouter } from './modules/analytics/analyticsRouter';
import { authRouter } from './modules/auth/authRouter';
import { departmentRouter } from './modules/departments/departmentRouter';

const app: Express = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/v1/health', (req: Request, res: Response) => {
  return res.json({
    status: 'healthy',
    service: 'pradhikaran-digital-twin-api',
    version: '1.0.0',
    studyArea: config.studyArea.name,
    center: [config.studyArea.lat, config.studyArea.lon],
    timestamp: new Date().toISOString()
  });
});

// Mount modular sub-routers
app.use('/api/v1/study-areas', studyAreaRouter);
app.use('/api/v1/assets', assetRouter);
app.use('/api/v1/gis', gisRouter);
app.use('/api/v1/grievances', grievanceRouter);
app.use('/api/v1/departments', departmentRouter);
app.use('/api/v1/admin/department-routing-rules', departmentRouter);
app.use('/api/v1/routes', routingRouter);
app.use('/api/v1/maintenance', maintenanceRouter);
app.use('/api/v1/graph', graphRouter);
app.use('/api/v1/simulations', simulationRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/auth', authRouter);

// Centralized error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[API Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      details: err.details || null
    }
  });
});

export default app;
