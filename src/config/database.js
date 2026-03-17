import mongoose from 'mongoose';
import { config } from './index.js';

/**
 * MongoDB Connection Configuration
 * Handles database connection with proper error handling and events
 */
class Database {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  /**
   * Connect to MongoDB
   */
  async connect() {
    try {
      // Mongoose connection options
      const options = {
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds
        bufferCommands: false, // Disable mongoose buffering
      };

      // Connect to MongoDB
      this.connection = await mongoose.connect(config.database.uri, options);
      this.isConnected = true;

      console.log(`🍃 MongoDB Connected: ${this.connection.connection.host}`);
      console.log(`📊 Database: ${this.connection.connection.name}`);

      // Set up connection event listeners
      this.setupEventListeners();

      return this.connection;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      this.handleConnectionError(error);
    }
  }

  /**
   * Set up MongoDB connection event listeners
   */
  setupEventListeners() {
    const db = mongoose.connection;

    // Connection events
    db.on('connected', () => {
      console.log('🟢 MongoDB connection established');
      this.isConnected = true;
    });

    db.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      this.isConnected = false;
    });

    db.on('disconnected', () => {
      console.log('🔴 MongoDB disconnected');
      this.isConnected = false;
    });

    db.on('reconnected', () => {
      console.log('🟡 MongoDB reconnected');
      this.isConnected = true;
    });

    // Application termination events
    process.on('SIGINT', this.gracefulShutdown.bind(this));
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
    process.on('SIGUSR2', this.gracefulShutdown.bind(this)); // For nodemon
  }

  /**
   * Handle connection errors
   */
  handleConnectionError(error) {
    if (error.name === 'MongoServerError') {
      console.error('🔐 MongoDB authentication failed. Check your credentials.');
    } else if (error.name === 'MongoNetworkError') {
      console.error('🌐 MongoDB network error. Check your connection.');
    } else if (error.name === 'MongoParseError') {
      console.error('🔗 MongoDB URI parse error. Check your connection string.');
    }

    // Exit process in production, retry in development
    if (config.env === 'production') {
      process.exit(1);
    } else {
      console.log('🔄 Retrying connection in 5 seconds...');
      setTimeout(() => this.connect(), 5000);
    }
  }

  /**
   * Graceful shutdown
   */
  async gracefulShutdown(signal) {
    console.log(`\n🛑 Received ${signal}. Graceful shutdown initiated...`);
    
    try {
      await mongoose.connection.close();
      console.log('🍃 MongoDB connection closed through app termination');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during graceful shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      await mongoose.connection.db.admin().ping();
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error.message, 
        timestamp: new Date().toISOString() 
      };
    }
  }
}

// Create and export database instance
const database = new Database();

export default database;
