import http from 'node:http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { registerSocketHandlers } from './sockets/index.js';
import { settingsRoutes } from './routes/settingsRoutes.js';

const app = createApp();
app.use('/api/settings', settingsRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: env.clientUrl,
    credentials: true
  }
});

app.set('io', io);
registerSocketHandlers(io);

server.listen(env.port, () => {
  console.log(`Sentinel AI API listening on http://localhost:${env.port}`);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Received shutdown signal. Closing HTTP server...');
  server.close(async () => {
    console.log('HTTP server closed.');
    const { pool } = await import('./db/pool.js');
    await pool.end();
    console.log('Database connections closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
