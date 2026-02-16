// Load environment variables BEFORE any other imports
// This import immediately executes dotenv.config()
import 'dotenv/config';

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';
import { cleanupOldImages } from './services/imageStorage.js';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    CLIENT_URL
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Allow large base64 image uploads

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API routes
app.use('/api', apiRoutes);

// Static file serving for images
app.use('/images', express.static(path.join(__dirname, '../public/images')));

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   Destiny Match Server                                ║
║   Running on port ${PORT}                             ║
║                                                        ║
║   Environment: ${process.env.NODE_ENV || 'development'}                         ║
║   Mock Mode: ${(!process.env.DREAMINA_API_KEY || !process.env.SILICONFLOW_API_KEY) ? 'Enabled' : 'Disabled'}                              ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);

  // Run cleanup on startup
  console.log('[Server] Running initial image cleanup...');
  cleanupOldImages();

  // Schedule daily cleanup check (runs every minute to check if it's midnight)
  setInterval(() => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
      console.log('[Server] Running scheduled daily cleanup...');
      cleanupOldImages();
    }
  }, 60 * 1000); // Check every minute
});

export default app;
