import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config';
import authRoutes from './routes/auth';
import memoriesRoutes from './routes/memories';
import adminRoutes from './routes/admin';
import petsRoutes from './routes/pets';
import profilesRoutes from './routes/profiles';
import weatherRoutes from './routes/weather';
import messagesRoutes from './routes/messages';
import chatRoutes from './routes/chat';

const app = express();

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.get('/api/ping', (_req, res) => {
  res.json({ data: { message: 'pong' } });
});

app.use('/api/auth', authRoutes);
app.use('/api/memories', memoriesRoutes);
app.use('/api/admin/users', adminRoutes);
app.use('/api/pets', petsRoutes);
app.use('/api/profiles', profilesRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/chat', chatRoutes);

// Start server
app.listen(config.port, () => {
  console.log(`Peti API running on http://localhost:${config.port}`);
});
