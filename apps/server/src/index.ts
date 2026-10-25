import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { initializeSocketIO } from './socket';
import { disconnectPrisma } from './prisma';

// Import route handlers
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import conversationRoutes from './routes/conversations';
import messageRoutes from './routes/messages';
import searchRoutes from './routes/search';
import uploadRoutes from './routes/upload';
import aiRoutes from './routes/ai';

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO engine
export const io = initializeSocketIO(server);

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow local development and same-origin proxy
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads serving
app.use('/uploads', express.static(config.uploadDir));

// System Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'OPERATIONAL',
    system: 'ARCK Core Engine',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes);

// Static client production bundle serving (if built)
const clientDistPath = path.resolve(__dirname, '../../web/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/uploads') ||
      req.path.startsWith('/socket.io')
    ) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error occurred.',
  });
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
  server.listen(config.port, () => {
    console.log(`
  ══════════════════════════════════════════════════════════
  🌌  ARCK // QUANTUM REAL-TIME ENGINE INITIALIZED
  ══════════════════════════════════════════════════════════
  • HTTP Server   : http://localhost:${config.port}
  • Socket.IO     : ws://localhost:${config.port}
  • Health Check  : http://localhost:${config.port}/api/health
  • Storage Path  : ${config.uploadDir}
  • Mode          : ${config.nodeEnv.toUpperCase()}
  ══════════════════════════════════════════════════════════
    `);
  });
}

// Graceful Shutdown
async function handleShutdown() {
  console.log('\n🌌 Terminating ARCK engine...');
  await disconnectPrisma();
  server.close(() => {
    console.log('🌌 Systems offline.');
    process.exit(0);
  });
}

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);

export { app, server };
