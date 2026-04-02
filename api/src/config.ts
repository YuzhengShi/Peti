import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  accessTokenExpirySeconds: 15 * 60, // 15 minutes
  refreshTokenExpirySeconds: 7 * 24 * 60 * 60, // 7 days
  openWeatherMapKey: process.env.OPENWEATHERMAP_API_KEY || '',
};
