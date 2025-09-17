import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import https from 'https';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import emailRoutes from './routes/email';
import subteamRoutes from './routes/subteams';
import sponsorRoutes from './routes/sponsors';
import resourceRoutes from './routes/resources';
import slideshowRoutes from './routes/slideshow';
import maintenanceRoutes from './routes/maintenance';
import robotsRoutes from './routes/robots';
import configRoutes from './routes/config';
import rosterRoutes from './routes/roster';
import pagesRoutes from './routes/pages';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { testConnection, gracefulShutdown } from './utils/database';
import { AdminInitService } from './services/adminInitService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const limiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});


app.use(helmet());

var whitelist = [process.env.FRONTEND_URL || 'http://localhost:3000', process.env.BACKEND_URL]
app.use(cors({
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS:' + origin))
    }
  },
  credentials: true,
  
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(limiter);
// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/subteams', subteamRoutes);
app.use('/api/sponsors', sponsorRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/slideshow', slideshowRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/robots', robotsRoutes);
app.use('/api/config', configRoutes);
app.use('/api/roster', rosterRoutes);
app.use('/api/pages', pagesRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Initialize system tables and admin account
    console.log('🔧 Initializing system tables...');
    await AdminInitService.createSystemLogsTable();
    
    console.log('👤 Checking admin account initialization...');
    await AdminInitService.checkAndInitializeAdmin();

    // Check for HTTPS configuration
    const sslKeyPath = process.env.SSL_KEY_PATH;
    const sslCertPath = process.env.SSL_CERT_PATH;
    const useHttps = sslKeyPath && sslCertPath && fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath);

    if (useHttps) {
      // Start HTTPS server
      const httpsOptions = {
        key: fs.readFileSync(sslKeyPath),
        cert: fs.readFileSync(sslCertPath)
      };

      https.createServer(httpsOptions, app).listen(PORT, () => {
        console.log(`🚀 HTTPS Server running on port ${PORT}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log('🔒 SSL/TLS encryption enabled');
        console.log('✅ System initialization complete');
      });
    } else {
      // Start HTTP server
      app.listen(PORT, () => {
        console.log(`🚀 HTTP Server running on port ${PORT}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        if (process.env.NODE_ENV === 'production') {
          console.log('⚠️  WARNING: Running HTTP in production. Consider enabling HTTPS.');
        }
        console.log('✅ System initialization complete');
      });
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await gracefulShutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await gracefulShutdown();
  process.exit(0);
});

startServer();