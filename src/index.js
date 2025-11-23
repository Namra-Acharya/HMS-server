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

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Database and start server
async function startServer() {
  try {
    console.log('[SERVER] Starting server...');

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

    // Start listening
    console.log('[SERVER] Listening on port', PORT);
    app.listen(PORT, () => {
      console.log(`[SERVER] ✅ Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('[SERVER] Startup failed:', error.message);
    console.error('[SERVER] Stack:', error.stack);
    process.exit(1);
  }
}

console.log('[SERVER] About to start server...');
startServer();
