import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Application Configuration
 * Centralized configuration management for the entire application
 */
export const config = {
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT) || 5000,
    host: process.env.HOST || 'localhost',
    apiVersion: process.env.API_VERSION || 'v1',
  },

  // Environment
  env: process.env.NODE_ENV || 'development',
  isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
  isTest: (process.env.NODE_ENV || 'development') === 'test',

  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/uniqueiit-research-center',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-fallback-secret-key',
    expiresIn: process.env.JWT_EXPIRE || '7d',
    cookieExpire: parseInt(process.env.JWT_COOKIE_EXPIRE) || 7,
    refreshSecret: process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRE || '30d',
  },

  // CORS Configuration
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    allowedOrigins: Array.from(
      new Set(
        [
          process.env.ALLOWED_ORIGINS,
          process.env.CLIENT_URL,
          'https://ebookfrontend-55ai.vercel.app', // Deployed frontend
          'https://ebookfrontend.vercel.app', // Alternative deployed frontend
        ]
          .filter(Boolean)
          .flatMap(v => v.split(','))
          .map(v => v.trim())
          .filter(Boolean)
      )
    ).length
      ? Array.from(
          new Set(
            [
              process.env.ALLOWED_ORIGINS,
              process.env.CLIENT_URL,
              'https://ebookfrontend-55ai.vercel.app',
              'https://ebookfrontend.vercel.app',
            ]
              .filter(Boolean)
              .flatMap(v => v.split(','))
              .map(v => v.trim())
              .filter(Boolean)
          )
        )
      : ['http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (process.env.NODE_ENV === 'development' ? 5000 : 100), // Much higher limit in dev
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 5,
    trustProxy: parseInt(process.env.TRUST_PROXY) || 1,
  },

  // Security Configuration
  security: {
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12,
    passwordResetExpire: parseInt(process.env.PASSWORD_RESET_EXPIRE) || 10 * 60 * 1000, // 10 minutes
    emailVerificationExpire: parseInt(process.env.EMAIL_VERIFICATION_EXPIRE) || 24 * 60 * 60 * 1000, // 24 hours
  },

  // Cloudinary Configuration
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER || 'uniqueiit-research-center',
  },

  // Email Configuration
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    },
    from: {
      email: process.env.FROM_EMAIL || process.env.SMTP_EMAIL,
      name: process.env.FROM_NAME || 'uniqueIIT Research Center',
    },
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY,
    },
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD,
    ttl: parseInt(process.env.REDIS_TTL) || 3600, // 1 hour
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
  },

  // External APIs
  externalApis: {
    youtube: {
      apiKey: process.env.YOUTUBE_API_KEY,
    },
    googleAnalytics: {
      id: process.env.GOOGLE_ANALYTICS_ID,
    },
  },

  // Admin Configuration
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@uniqueiit.example',
    password: process.env.ADMIN_PASSWORD || 'uniqueiit@123',
    name: process.env.ADMIN_NAME || 'uniqueIIT Research Center',
  },

  // File Upload Limits
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    allowedAudioTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav'],
    allowedDocumentTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },

  // Pagination
  pagination: {
    defaultLimit: 10,
    maxLimit: 100,
  },

  // Application URLs
  urls: {
    client: process.env.CLIENT_URL || 'http://localhost:3000',
    api: process.env.API_URL || 'http://localhost:5000',
  },
};

/**
 * Validate required environment variables
 */
export const validateConfig = () => {
  const required = [
    'MONGODB_URI',
    'JWT_SECRET',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('📝 Please check your .env file and ensure all required variables are set.');
    process.exit(1);
  }

  // Warn about optional but recommended variables
  const recommended = [
    'CLOUDINARY_CLOUD_NAME',
    'SMTP_EMAIL',
    'ADMIN_EMAIL',
  ];

  const missingRecommended = recommended.filter(key => !process.env[key]);
  
  if (missingRecommended.length > 0) {
    console.warn('⚠️  Missing recommended environment variables:', missingRecommended.join(', '));
    console.warn('💡 Some features may not work properly without these variables.');
  }
};

export default config;
