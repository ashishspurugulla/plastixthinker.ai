import sqlite3 from 'sqlite3';
import { config } from '../config/config.js';

class DatabaseService {
  constructor() {
    this.usersDb = null;
  }

  /**
   * Initialize database connections and create tables
   */
  async initialize() {
    try {
      // Initialize users database
      this.usersDb = new sqlite3.Database(config.database.users);
      
      // Create tables
      await this.createTables();
      
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create all necessary database tables
   */
  async createTables() {
    return new Promise((resolve, reject) => {
      this.usersDb.serialize(() => {
        // Datasets table
        this.usersDb.run(`
          CREATE TABLE IF NOT EXISTS datasets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            original_name TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            file_type TEXT NOT NULL,
            uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'processing'
          )
        `);

        // Embeddings table
        this.usersDb.run(`
          CREATE TABLE IF NOT EXISTS embeddings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dataset_id INTEGER NOT NULL,
            chunk_text TEXT NOT NULL,
            embedding BLOB NOT NULL,
            chunk_index INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
          )
        `);

        // Create indexes for better performance
        this.usersDb.run('CREATE INDEX IF NOT EXISTS idx_datasets_id ON datasets(id)');
        this.usersDb.run('CREATE INDEX IF NOT EXISTS idx_embeddings_dataset_id ON embeddings(dataset_id)');

        resolve();
      });
    });
  }



  /**
   * Get all datasets
   */
  async getAllDatasets() {
    return new Promise((resolve, reject) => {
      this.usersDb.all(
        'SELECT id, original_name, file_size, file_type, uploaded_at, status FROM datasets ORDER BY uploaded_at DESC',
        (err, datasets) => {
          if (err) reject(err);
          else resolve(datasets);
        }
      );
    });
  }

  /**
   * Get dataset chunk count
   */
  async getDatasetChunkCount(datasetId) {
    return new Promise((resolve, reject) => {
      this.usersDb.get(
        'SELECT COUNT(*) as count FROM embeddings WHERE dataset_id = ?',
        [datasetId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result ? result.count : 0);
        }
      );
    });
  }

  /**
   * Create dataset record
   */
  async createDataset(filename, originalName, fileSize, fileType) {
    return new Promise((resolve, reject) => {
      this.usersDb.run(
        'INSERT INTO datasets (filename, original_name, file_size, file_type) VALUES (?, ?, ?, ?)',
        [filename, originalName, fileSize, fileType],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  /**
   * Update dataset status
   */
  async updateDatasetStatus(datasetId, status) {
    return new Promise((resolve, reject) => {
      this.usersDb.run(
        'UPDATE datasets SET status = ? WHERE id = ?',
        [status, datasetId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  /**
   * Delete dataset and related data
   */
  async deleteDataset(datasetId) {
    return new Promise((resolve, reject) => {
      this.usersDb.run(
        'DELETE FROM datasets WHERE id = ?',
        [datasetId],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  }

  /**
   * Store embeddings for a dataset
   */
  async storeEmbeddings(datasetId, chunks, embeddings) {
    return new Promise((resolve, reject) => {
      const stmt = this.usersDb.prepare(
        'INSERT INTO embeddings (dataset_id, chunk_text, embedding, chunk_index) VALUES (?, ?, ?, ?)'
      );
      
      chunks.forEach((chunk, index) => {
        const embeddingBuffer = Buffer.from(new Float32Array(embeddings[index]).buffer);
        stmt.run(datasetId, chunk, embeddingBuffer, index);
      });
      
      stmt.finalize((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Find similar chunks for semantic search
   */
  async findSimilarChunks(limit = 5) {
    return new Promise((resolve, reject) => {
      this.usersDb.all(
        `SELECT e.chunk_text, e.embedding, d.original_name 
         FROM embeddings e 
         JOIN datasets d ON e.dataset_id = d.id`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  /**
   * Close database connections
   */
  async close() {
    if (this.usersDb) {
      this.usersDb.close();
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
