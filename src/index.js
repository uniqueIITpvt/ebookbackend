import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import 'express-async-errors';

// Import configurations
import { config, validateConfig } from './config/index.js';
import database from './config/database.js';
import cloudinaryConfig from './config/cloudinary.js';

// Import shared middleware
import { errorHandler } from './shared/middleware/errorHandler.js';
import { notFound } from './shared/middleware/notFound.js';

// Import routes
import routes from './routes/index.js';

class Server {
  constructor() {
    this.app = express();
    this.port = config.server.port;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    // Trust proxy settings for rate limiting behind proxies
    this.app.set('trust proxy', config.rateLimit.trustProxy);

    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    // CORS configuration
    this.app.use(cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        // In development, allow all origins to avoid LAN/IP issues during local testing
        if (config.isDevelopment) {
          return callback(null, true);
        }
        
        if (config.cors.allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        callback(new Error(`Not allowed by CORS: ${origin}`));
      },
      credentials: config.cors.credentials,
      optionsSuccessStatus: config.cors.optionsSuccessStatus,
    }));

    // Compression middleware
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.max,
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(config.rateLimit.windowMs / 1000 / 60) + ' minutes',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    this.app.use(limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(cookieParser());

    // Logging middleware
    if (config.isDevelopment) {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }
  }

  /**
   * Setup application routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      const dbHealth = await database.healthCheck();
      const cloudinaryHealth = await cloudinaryConfig.healthCheck();

      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.env,
        version: process.env.npm_package_version || '1.0.0',
        services: {
          database: dbHealth,
          cloudinary: cloudinaryHealth,
        },
      });
    });

    // API information endpoint
    this.app.get('/', (req, res) => {
      res.json({
        message: 'TechUniqueIIT Research Center Backend API',
        description: 'Books API Server',
        version: '1.0.0',
        author: 'TechUniqueIIT Research Center',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/health',
          api: `/api/${config.server.apiVersion}`,
          docs: '/docs',
        },
      });
    });

    // API routes with debugging
    console.log('🔧 Loading API routes...');
    console.log(`🔗 Mounting routes at: /api/${config.server.apiVersion}`);
    try {
      this.app.use(`/api/${config.server.apiVersion}`, routes);
      console.log('✅ API routes loaded successfully');
      
      // List all registered routes for debugging
      console.log('📋 Registered routes:');
      this.app._router.stack.forEach((middleware) => {
        if (middleware.route) {
          console.log(`   ${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
        } else if (middleware.name === 'router') {
          console.log(`   Router mounted at: ${middleware.regexp}`);
        }
      });
    } catch (error) {
      console.error('❌ Failed to load API routes:', error.message);
      console.error(error.stack);
    }

    // Serve static files (if needed)
    if (config.isDevelopment) {
      this.app.use('/static', express.static('public'));
    }
  }

  /**
   * Setup error handling middleware
   */
  setupErrorHandling() {
    // 404 handler
    this.app.use(notFound);

    // Global error handler
    this.app.use(errorHandler);
  }

  /**
   * Start the server
   */
  async start() {
    try {
      // Validate configuration
      validateConfig();

      // Connect to database
      await database.connect();

      // Start server
      this.app.listen(this.port, () => {
        console.log('🚀 =====================================');
        console.log(`📚 TechUniqueIIT Research Center Backend Server`);
        console.log('🚀 =====================================');
        console.log(`🌐 Server running on port ${this.port}`);
        console.log(`📱 Environment: ${config.env}`);
        console.log(`🔗 API Base URL: http://localhost:${this.port}/api/${config.server.apiVersion}`);
        console.log(`🏥 Health Check: http://localhost:${this.port}/health`);
        console.log(`🔒 Trust Proxy: ${this.app.get('trust proxy')}`);
        console.log(`⏱️  Rate Limit: ${config.rateLimit.max} requests per ${config.rateLimit.windowMs / 60000} minutes`);
        console.log(`☁️  Cloudinary: ${cloudinaryConfig.getStatus().isConfigured ? 'Configured' : 'Not Configured'}`);
        console.log(`🌍 CORS allowed origins: ${config.cors.allowedOrigins.join(', ')}`);
        console.log('🚀 =====================================');
        
        if (config.isDevelopment) {
          console.log('💡 Development mode - Additional logging enabled');
          console.log('📝 API Documentation: http://localhost:' + this.port + '/docs');
        }
      });

    } catch (error) {
      console.error('❌ Failed to start server:', error.message);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('🛑 Shutting down server gracefully...');
    
    try {
      await database.gracefulShutdown();
      console.log('✅ Server shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err.message);
  console.error(err.stack);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  console.error(err.stack);
  process.exit(1);
});

// Create and start server
const server = new Server();

// Handle graceful shutdown
process.on('SIGTERM', () => server.shutdown());
process.on('SIGINT', () => server.shutdown());

// Start the server
server.start();
