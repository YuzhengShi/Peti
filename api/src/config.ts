import dotenv from 'dotenv';
dotenv.config({ override: true });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  accessTokenExpirySeconds: 7 * 24 * 60 * 60, // 7 days
  openWeatherMapKey: process.env.OPENWEATHERMAP_API_KEY || '',
  internalSecret: process.env.INTERNAL_SECRET || 'dev-internal-secret',
  containerImage: process.env.CONTAINER_IMAGE || 'peti-agent:latest',
  agentCharacterDir: process.env.AGENT_CHARACTER_DIR || '../agent/character',
  frameworkDir: process.env.FRAMEWORK_DIR || '../docs/framework',
};
