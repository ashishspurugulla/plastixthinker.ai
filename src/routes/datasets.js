import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  rateLimiter, 
  validateFileUpload, 
  sanitizeInput 
} from '../middleware/security.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { databaseService } from '../services/database.js';
import { fileProcessorService } from '../services/fileProcessor.js';
import { ValidationError } from '../middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

/**
 * POST /api/upload-dataset - Upload and process a dataset
 */
router.post('/upload-dataset', 
  rateLimiter,
  upload.single('file'),
  validateFileUpload,
  sanitizeInput,
  asyncHandler(async (req, res) => {
    const { originalname, filename, size, mimetype } = req.file;
    
    try {
      // Create dataset record in database
      const datasetId = await databaseService.createDataset(
        filename,
        originalname,
        size,
        mimetype
      );
      
      // Process file and generate embeddings asynchronously
      // Don't wait for completion to respond to user
      processFileAndGenerateEmbeddings(req.file.path, datasetId)
        .then(chunks => {
          console.log(`✅ Dataset ${datasetId} processed successfully with ${chunks} chunks`);
        })
        .catch(error => {
          console.error(`❌ Error processing dataset ${datasetId}:`, error);
        });
      
      res.json({ 
        success: true, 
        datasetId,
        message: 'File uploaded successfully. Processing in background...'
      });
    } catch (error) {
      // Clean up uploaded file if database operation fails
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      throw error;
    }
  })
);

/**
 * GET /api/datasets - Get user's datasets
 */
router.get('/datasets', 
  rateLimiter,
  asyncHandler(async (req, res) => {
    // Get all datasets
    const datasets = await databaseService.getAllDatasets();
    
    // Get chunk count for each dataset
    const datasetsWithChunks = await Promise.all(
      datasets.map(async (dataset) => {
        const chunkCount = await databaseService.getDatasetChunkCount(dataset.id);
        return {
          ...dataset,
          chunks: chunkCount
        };
      })
    );
    
    res.json({ 
      success: true, 
      datasets: datasetsWithChunks 
    });
  })
);

/**
 * DELETE /api/remove-dataset/:datasetId - Remove a dataset
 */
router.delete('/remove-dataset/:datasetId', 
  rateLimiter,
  sanitizeInput,
  asyncHandler(async (req, res) => {
    const datasetId = parseInt(req.params.datasetId);
    
    if (isNaN(datasetId)) {
      throw new ValidationError('Invalid dataset ID');
    }
    
    // Get dataset info for file cleanup
    const datasets = await databaseService.getAllDatasets();
    const dataset = datasets.find(d => d.id === datasetId);
    
    if (!dataset) {
      throw new ValidationError('Dataset not found');
    }
    
    // Delete physical file
    const filePath = path.join(__dirname, '../../uploads', dataset.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete from database (cascade will handle embeddings)
    const deleted = await databaseService.deleteDataset(datasetId);
    
    if (!deleted) {
      throw new ValidationError('Failed to delete dataset');
    }
    
    res.json({ 
      success: true, 
      message: 'Dataset removed successfully' 
    });
  })
);

/**
 * Helper function to process file and generate embeddings
 */
async function processFileAndGenerateEmbeddings(filePath, datasetId) {
  try {
    const chunks = await fileProcessorService.processFileAndGenerateEmbeddings(
      filePath, 
      datasetId
    );
    
    // Clean up temporary file after processing
    await fileProcessorService.cleanupTempFile(filePath);
    
    return chunks;
  } catch (error) {
    console.error('Error processing file:', error);
    
    // Clean up temporary file on error
    await fileProcessorService.cleanupTempFile(filePath);
    
    throw error;
  }
}

export default router;
