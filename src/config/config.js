import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // OpenAI configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'
  },
  
  // Database configuration
  database: {
    users: process.env.USERS_DB_PATH || 'users.sqlite'
  },
  
  // File upload configuration
  upload: {
    dest: 'uploads/',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['text/plain', 'application/pdf', 'text/csv']
  },
  
  // Security configuration
  security: {
    bcryptRounds: 10,
    rateLimitWindow: 15 * 60 * 1000, // 15 minutes
    rateLimitMax: 100 // requests per window
  }
};

// Validate required environment variables
export function validateConfig() {
  const required = ['OPENAI_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  console.log('✅ Configuration loaded successfully');
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🔑 OpenAI API Key: ${config.openai.apiKey ? 'Loaded' : 'Missing'}`);
}
