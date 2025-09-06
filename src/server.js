import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import our modular components
import { config, validateConfig } from './config/config.js';
import { databaseService } from './services/database.js';
import { openaiService } from './services/openai.js';
import routes from './routes/index.js';
import { 
  rateLimiter, 
  securityHeaders, 
  corsOptions 
} from './middleware/security.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

// Validate configuration before starting
try {
  validateConfig();
} catch (error) {
  console.error('❌ Configuration validation failed:', error.message);
  process.exit(1);
}

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

// Security headers
app.use(securityHeaders);

// CORS configuration
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global rate limiting
app.use(rateLimiter);

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

async function initializeDatabase() {
  try {
    await databaseService.initialize();
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// ============================================================================
// ROUTE SETUP
// ============================================================================

// API routes
app.use('/', routes);

// Serve static files from public directory
app.use(express.static('public'));

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Validate OpenAI API key
    const isOpenAIValid = await openaiService.validateAPIKey();
    if (!isOpenAIValid) {
      console.warn('⚠️ OpenAI API key validation failed. AI features may not work.');
    } else {
      console.log('✅ OpenAI API key validated successfully');
    }
    
    // Start server
    const server = app.listen(config.port, () => {
      console.log('🚀 PlastixThinker API Server Started Successfully!');
      console.log(`📍 Server running at http://localhost:${config.port}`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
      console.log(`🔒 Security: Rate limiting, Helmet, CORS enabled`);
      console.log(`📊 Database: SQLite`);
      console.log(`🤖 AI Service: ${isOpenAIValid ? 'Operational' : 'Unavailable'}`);
      console.log(`📁 Uploads: ${config.upload.dest}`);
      console.log('✨ Ready to handle requests!');
    });
    
    // Graceful shutdown handling
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully...');
      server.close(async () => {
        console.log('🔒 HTTP server closed');
        await databaseService.close();
        console.log('🗄️ Database connections closed');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      console.log('🛑 SIGINT received, shutting down gracefully...');
      server.close(async () => {
        console.log('🔒 HTTP server closed');
        await databaseService.close();
        console.log('🗄️ Database connections closed');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
