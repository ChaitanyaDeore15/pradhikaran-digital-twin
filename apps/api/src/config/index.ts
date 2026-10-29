import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'pradhikaran_digital_twin_secret_key_2026',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  
  // Reference Center: PCCOE Sector 26 Pradhikaran Nigdi Pune
  studyArea: {
    id: 'sa-pccoe-1km',
    name: 'PCCOE Pradhikaran 1 km Study Area',
    lat: parseFloat(process.env.STUDY_AREA_LAT || '18.651674'),
    lon: parseFloat(process.env.STUDY_AREA_LON || '73.761536'),
    radiusM: parseFloat(process.env.STUDY_AREA_RADIUS_M || '1000'),
    marginM: parseFloat(process.env.STUDY_AREA_MARGIN_M || '150'),
  },

  // Database / Spatial Engine
  postgisEnabled: process.env.POSTGIS_ENABLED === 'true',
  databaseUrl: process.env.DATABASE_URL || 'postgres://pradhikaran_user:pradhikaran_pass@localhost:5432/pradhikaran_twin',

  // AI Microservice
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
};
