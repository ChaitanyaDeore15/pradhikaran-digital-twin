import app from './app';
import { config } from './config';
import { StudyAreaService } from './services/studyAreaService';
import { RoutingService } from './services/routingService';
import { spatialRepo } from './repositories/spatialRepository';
import { seedInitialData } from './seed';

async function bootstrap() {
  console.log('-------------------------------------------------------------');
  console.log('Starting Pradhikaran City Digital Twin API Service...');
  console.log(`Study Area: ${config.studyArea.name}`);
  console.log(`Center: ${config.studyArea.lat}°N, ${config.studyArea.lon}°E`);
  console.log(`Radius: ${config.studyArea.radiusM}m (+ ${config.studyArea.marginM}m margin)`);
  console.log('-------------------------------------------------------------');

  // Initialize Study Area
  await StudyAreaService.initializeDefaultStudyArea();

  // Load Seed / Cached Ingestion Data
  await seedInitialData();

  // Initialize Routing Graph
  await RoutingService.buildGraph();

  app.listen(config.port, () => {
    console.log(`[API Service] Listening on http://localhost:${config.port}`);
    console.log(`[API Health]  Endpoint ready at http://localhost:${config.port}/api/v1/health`);
  });
}

bootstrap().catch(err => {
  console.error('[Bootstrap Error]:', err);
  process.exit(1);
});
