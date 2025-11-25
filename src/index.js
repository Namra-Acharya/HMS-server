// Load environment variables FIRST before anything else
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

console.log('[SERVER] Starting initialization...');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from server root directory
const envPath = resolve(__dirname, '../.env');
const envResult = dotenv.config({ path: envPath });

// Verify env file was loaded
if (envResult.error && envResult.error.code !== 'ENOENT') {
  console.error('Environment file read failed:', envResult.error.message);
}

console.log('[SERVER] Environment loaded. PORT:', process.env.PORT || 3001);

import express from 'express';
import cors from 'cors';
import routes from './routes.js';
import { initializeStorage } from './storageDb.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const corsOptions = {
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Database and start server
async function startServer() {
  try {
    console.log('[SERVER] Starting server...');

    // Initialize persistent storage for authentication
    try {
      initializeStorage();
      console.log('[SERVER] Persistent storage initialized');
    } catch (error) {
      console.error('[SERVER] Failed to initialize persistent storage:', error.message);
      throw error;
    }

    // Initialize Database only if MONGO_URI is set
    if (process.env.MONGO_URI) {
      console.log('[SERVER] Connecting to MongoDB...');
      const { initializeDatabase } = await import('./database.js');
      await initializeDatabase();
      console.log('[SERVER] MongoDB connected successfully');
    } else {
      console.log('[SERVER] MONGO_URI not set - running in offline mode');
    }

    console.log('[SERVER] Setting up routes...');
    // Routes
    app.use('/api', routes);

    // Health check
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error('[SERVER] Error:', err.message);
      res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
    });

    // Start listening with fallback ports
    const portOptions = [PORT, 3005, 3006, 3007, 3008, 3009];
    let portIndex = 0;

    const startServer = () => {
      if (portIndex >= portOptions.length) {
        throw new Error('No available ports found');
      }

      const attemptPort = portOptions[portIndex];
      const server = app.listen(attemptPort, () => {
        console.log(`[SERVER] ✅ Server running on port ${attemptPort}`);
        // Save the port that the server is actually running on
        process.env.ACTUAL_PORT = attemptPort;
        console.log(`[SERVER] Server accessible at http://localhost:${attemptPort}`);
      }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`[SERVER] Port ${attemptPort} in use, trying next port...`);
          portIndex++;
          startServer();
        } else {
          throw err;
        }
      });
    };

    console.log('[SERVER] Listening on port', PORT);
    startServer();
  } catch (error) {
    console.error('[SERVER] Startup failed:', error.message);
    console.error('[SERVER] Stack:', error.stack);
    process.exit(1);
  }
}

console.log('[SERVER] About to start server...');
startServer();
