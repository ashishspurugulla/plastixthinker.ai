import express from 'express';
import datasetRoutes from './datasets.js';
import aiRoutes from './ai.js';

const router = express.Router();

// API version prefix
const API_VERSION = '/api';

// Mount route modules
router.use(`${API_VERSION}/datasets`, datasetRoutes);
router.use(`${API_VERSION}/ai`, aiRoutes);

// Legacy route support for backward compatibility
// These routes will be deprecated in future versions
router.use('/ask', aiRoutes); // Keep the old /ask endpoint working

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'PlastixThinker API is running',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API documentation endpoint
router.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'PlastixThinker API Documentation',
    version: '2.0.0',
    endpoints: {
      datasets: {
        'POST /api/datasets/upload-dataset': 'Upload and process dataset',
        'GET /api/datasets': 'Get all datasets',
        'DELETE /api/datasets/remove-dataset/:id': 'Remove dataset'
      },
      ai: {
        'POST /api/ai/ask': 'Ask AI with optional context',
        'POST /api/ai/chat': 'Chat with AI',
        'GET /api/ai/status': 'Check AI service status'
      },
      legacy: {
        'POST /ask': 'Legacy ask endpoint (deprecated)'
      }
    }
  });
});

export default router;
