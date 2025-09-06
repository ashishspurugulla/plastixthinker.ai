import fs from 'fs';
import path from 'path';
import { openaiService } from './openai.js';
import { databaseService } from './database.js';

class FileProcessorService {
  /**
   * Process uploaded file and generate embeddings
   */
  async processFileAndGenerateEmbeddings(filePath, datasetId) {
    try {
      console.log(`🔄 Processing file: ${filePath}`);
      
      // Extract text from file
      const text = await this.extractTextFromFile(filePath);
      
      // Split text into chunks
      const chunks = this.splitTextIntoChunks(text);
      
      console.log(`📄 Extracted ${chunks.length} text chunks`);
      
      // Generate embeddings for each chunk
      const embeddings = await openaiService.generateEmbeddings(chunks);
      
      console.log(`🧠 Generated ${embeddings.length} embeddings`);
      
      // Store embeddings in database
      await databaseService.storeEmbeddings(datasetId, chunks, embeddings);
      
      // Update dataset status to completed
      await databaseService.updateDatasetStatus(datasetId, 'completed');
      
      console.log(`✅ File processing completed successfully`);
      
      return chunks.length;
    } catch (error) {
      console.error('❌ Error processing file:', error);
      
      // Update dataset status to failed
      await databaseService.updateDatasetStatus(datasetId, 'failed');
      
      throw error;
    }
  }

  /**
   * Extract text from various file types
   */
  async extractTextFromFile(filePath) {
    const fileExtension = path.extname(filePath).toLowerCase();
    
    try {
      if (fileExtension === '.txt') {
        return fs.readFileSync(filePath, 'utf8');
      } else if (fileExtension === '.pdf') {
        // For PDF, we'll use a simple text extraction
        // In production, you'd want to use a proper PDF parser like pdf-parse
        const content = fs.readFileSync(filePath);
        // Simple text extraction - replace with proper PDF parsing
        return content.toString().replace(/[^\x00-\x7F]/g, '').replace(/\s+/g, ' ').trim();
      } else if (fileExtension === '.csv') {
        const content = fs.readFileSync(filePath, 'utf8');
        // Convert CSV to readable text
        return content.split('\n').map(line => line.replace(/,/g, ', ')).join('\n');
      } else {
        // For other file types, try to extract text
        const content = fs.readFileSync(filePath);
        return content.toString().replace(/[^\x00-\x7F]/g, '').replace(/\s+/g, ' ').trim();
      }
    } catch (error) {
      throw new Error(`Failed to extract text from file: ${error.message}`);
    }
  }

  /**
   * Split text into manageable chunks for embedding
   */
  splitTextIntoChunks(text, maxChunkSize = 1000, overlap = 200) {
    if (!text || text.length === 0) {
      return [];
    }

    const chunks = [];
    let start = 0;
    
    while (start < text.length) {
      let end = start + maxChunkSize;
      
      // Try to break at sentence boundaries for better chunk quality
      if (end < text.length) {
        const nextPeriod = text.indexOf('.', end - 100);
        const nextNewline = text.indexOf('\n', end - 100);
        const breakPoint = Math.max(nextPeriod, nextNewline);
        
        if (breakPoint > end - 200 && breakPoint < end + 200) {
          end = breakPoint + 1;
        }
      }
      
      const chunk = text.substring(start, end).trim();
      
      // Only add chunks that have meaningful content
      if (chunk.length > 50) {
        chunks.push(chunk);
      }
      
      start = end - overlap;
    }
    
    return chunks;
  }

  /**
   * Find similar chunks using semantic search
   */
  async findSimilarChunks(query, limit = 5) {
    try {
      // Generate embedding for the query
      const queryEmbedding = await openaiService.generateQueryEmbedding(query);
      
      // Get all embeddings from all datasets
      const storedChunks = await databaseService.findSimilarChunks(limit);
      
      if (storedChunks.length === 0) {
        return [];
      }
      
      // Calculate cosine similarity for each chunk
      const similarities = storedChunks.map(row => {
        const storedEmbedding = new Float32Array(row.embedding.buffer);
        const similarity = this.cosineSimilarity(queryEmbedding, Array.from(storedEmbedding));
        return {
          text: row.chunk_text,
          similarity,
          source: row.original_name
        };
      });
      
      // Sort by similarity and return top results
      similarities.sort((a, b) => b.similarity - a.similarity);
      return similarities.slice(0, limit);
    } catch (error) {
      console.error('❌ Error finding similar chunks:', error);
      return [];
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      return 0;
    }
    
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (normA * normB);
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Cleaned up temporary file: ${filePath}`);
      }
    } catch (error) {
      console.error('❌ Error cleaning up temporary file:', error);
    }
  }
}

// Export singleton instance
export const fileProcessorService = new FileProcessorService();
