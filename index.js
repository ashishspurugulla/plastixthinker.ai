import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import SQLiteStore from 'connect-sqlite3';
import passport from 'passport';
// import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Load environment variables
dotenv.config();

// ✅ Check that your API key is actually loading
console.log("Loaded OPENAI_API_KEY:", process.env.OPENAI_API_KEY);

const app = express();
app.use(express.json());

// File upload configuration
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// --- SESSION SETUP ---
const SQLiteStoreSession = SQLiteStore(session);
app.use(session({
  store: new SQLiteStoreSession({ db: 'sessions.sqlite' }),
  secret: process.env.SESSION_SECRET || 'supersecret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 1 week
}));

// --- PASSPORT SETUP ---
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser((id, done) => {
  db.get('SELECT id, username, google_id FROM users WHERE id = ?', [id], (err, user) => {
    done(err, user);
  });
});

// passport.use(new GoogleStrategy({
//   clientID: process.env.GOOGLE_CLIENT_ID,
//   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//   callbackURL: '/auth/google/callback',
// }, (accessToken, refreshToken, profile, done) => {
//   db.get('SELECT * FROM users WHERE google_id = ?', [profile.id], (err, user) => {
//     if (user) return done(null, user);
//     // If not found, create user
//     db.run('INSERT INTO users (username, google_id) VALUES (?, ?)', [profile.displayName, profile.id], function(err) {
//       if (err) return done(err);
//       db.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err, newUser) => {
//         done(err, newUser);
//       });
//     });
//   });
// }));

// --- DATABASE SETUP ---
const db = new sqlite3.Database('users.sqlite');
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    password TEXT,
    google_id TEXT UNIQUE
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS chatlogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    message TEXT,
    response TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS datasets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    filename TEXT,
    original_name TEXT,
    file_size INTEGER,
    file_type TEXT,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'processing',
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS embeddings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dataset_id INTEGER,
    chunk_text TEXT,
    embedding BLOB,
    chunk_index INTEGER,
    FOREIGN KEY(dataset_id) REFERENCES datasets(id)
  )`);
});

// --- AUTH ENDPOINTS ---
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required.' });
  db.get('SELECT id FROM users WHERE username = ?', [username], (err, row) => {
    if (row) return res.status(409).json({ error: 'Username already exists.' });
    const hash = bcrypt.hashSync(password, 10);
    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash], function(err) {
      if (err) return res.status(500).json({ error: 'Database error.' });
      req.session.userId = this.lastID;
      res.json({ success: true });
    });
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required.' });
  db.get('SELECT id, password FROM users WHERE username = ?', [username], (err, user) => {
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });
    if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials.' });
    req.session.userId = user.id;
    res.json({ success: true });
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.get('/api/me', (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  db.get('SELECT id, username FROM users WHERE id = ?', [req.session.userId], (err, user) => {
    if (!user) return res.json({ user: null });
    res.json({ user });
  });
});

app.get('/api/check-auth', (req, res) => {
  if (!req.session.userId) {
    return res.json({ loggedIn: false });
  }
  
  db.get('SELECT id, username FROM users WHERE id = ?', [req.session.userId], (err, user) => {
    if (!user) {
      return res.json({ loggedIn: false });
    }
    res.json({ loggedIn: true, username: user.username });
  });
});

// --- DATASET MANAGEMENT ENDPOINTS ---
app.post('/api/upload-dataset', upload.single('file'), async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  try {
    const { originalname, filename, size, mimetype } = req.file;
    
    // Insert dataset record
    db.run(
      'INSERT INTO datasets (user_id, filename, original_name, file_size, file_type) VALUES (?, ?, ?, ?, ?)',
      [req.session.userId, filename, originalname, size, mimetype],
      function(err) {
        if (err) {
          return res.status(500).json({ success: false, error: 'Database error' });
        }
        
        const datasetId = this.lastID;
        
        // Process file and generate embeddings
        processFileAndGenerateEmbeddings(req.file.path, datasetId, req.session.userId)
          .then(chunks => {
            res.json({ 
              success: true, 
              datasetId, 
              chunks,
              message: `Successfully processed ${chunks} chunks`
            });
          })
          .catch(error => {
            console.error('Processing error:', error);
            res.status(500).json({ success: false, error: 'File processing failed' });
          });
      }
    );
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: 'Upload failed' });
  }
});

app.get('/api/datasets', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }

  db.all(
    'SELECT id, original_name, file_size, file_type, uploaded_at, status FROM datasets WHERE user_id = ? ORDER BY uploaded_at DESC',
    [req.session.userId],
    (err, datasets) => {
      if (err) {
        return res.status(500).json({ success: false, error: 'Database error' });
      }
      
      // Get chunk count for each dataset
      const datasetsWithChunks = datasets.map(dataset => {
        return new Promise((resolve) => {
          db.get(
            'SELECT COUNT(*) as count FROM embeddings WHERE dataset_id = ?',
            [dataset.id],
            (err, result) => {
              resolve({
                ...dataset,
                chunks: result ? result.count : 0
              });
            }
          );
        });
      });

      Promise.all(datasetsWithChunks).then(results => {
        res.json({ success: true, datasets: results });
      });
    }
  );
});

app.delete('/api/remove-dataset/:datasetId', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }

  const datasetId = req.params.datasetId;

  // Verify ownership
  db.get(
    'SELECT filename FROM datasets WHERE id = ? AND user_id = ?',
    [datasetId, req.session.userId],
    (err, dataset) => {
      if (err || !dataset) {
        return res.status(404).json({ success: false, error: 'Dataset not found' });
      }

      // Delete file
      const filePath = path.join(__dirname, 'uploads', dataset.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete from database (cascade will handle embeddings)
      db.run(
        'DELETE FROM datasets WHERE id = ?',
        [datasetId],
        function(err) {
          if (err) {
            return res.status(500).json({ success: false, error: 'Database error' });
          }
          res.json({ success: true });
        }
      );
    }
  );
});

// --- GOOGLE OAUTH ROUTES ---
// app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));
// app.get('/auth/google/callback', passport.authenticate('google', {
//   failureRedirect: '/auth.html?error=google',
//   session: true
// }), (req, res) => {
//   req.session.userId = req.user.id;
//   res.redirect('/ai.html');
// });

// --- OPENAI ENDPOINT ---
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// File processing and embedding functions
async function processFileAndGenerateEmbeddings(filePath, datasetId, userId) {
  try {
    // Extract text from file
    const text = await extractTextFromFile(filePath);
    
    // Split text into chunks
    const chunks = splitTextIntoChunks(text);
    
    // Generate embeddings for each chunk
    const embeddings = await generateEmbeddings(chunks);
    
    // Store embeddings in database
    await storeEmbeddings(datasetId, chunks, embeddings);
    
    // Update dataset status
    db.run('UPDATE datasets SET status = ? WHERE id = ?', ['completed', datasetId]);
    
    return chunks.length;
  } catch (error) {
    console.error('Error processing file:', error);
    db.run('UPDATE datasets SET status = ? WHERE id = ?', ['failed', datasetId]);
    throw error;
  }
}

async function extractTextFromFile(filePath) {
  const fileExtension = path.extname(filePath).toLowerCase();
  
  if (fileExtension === '.txt') {
    return fs.readFileSync(filePath, 'utf8');
  } else if (fileExtension === '.pdf') {
    // For PDF, we'll use a simple text extraction
    // In production, you'd want to use a proper PDF parser like pdf-parse
    const content = fs.readFileSync(filePath);
    // Simple text extraction - replace with proper PDF parsing
    return content.toString().replace(/[^\x00-\x7F]/g, '').replace(/\s+/g, ' ').trim();
  } else {
    // For other file types, try to extract text
    const content = fs.readFileSync(filePath);
    return content.toString().replace(/[^\x00-\x7F]/g, '').replace(/\s+/g, ' ').trim();
  }
}

function splitTextIntoChunks(text, maxChunkSize = 1000, overlap = 200) {
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    let end = start + maxChunkSize;
    
    // Try to break at sentence boundaries
    if (end < text.length) {
      const nextPeriod = text.indexOf('.', end - 100);
      const nextNewline = text.indexOf('\n', end - 100);
      const breakPoint = Math.max(nextPeriod, nextNewline);
      
      if (breakPoint > end - 200 && breakPoint < end + 200) {
        end = breakPoint + 1;
      }
    }
    
    chunks.push(text.substring(start, end).trim());
    start = end - overlap;
  }
  
  return chunks.filter(chunk => chunk.length > 50); // Filter out very short chunks
}

async function generateEmbeddings(chunks) {
  const embeddings = [];
  
  for (const chunk of chunks) {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: chunk,
        encoding_format: 'float'
      });
      
      embeddings.push(response.data[0].embedding);
    } catch (error) {
      console.error('Error generating embedding:', error);
      // Use a simple fallback embedding (zeros)
      embeddings.push(new Array(1536).fill(0));
    }
  }
  
  return embeddings;
}

async function storeEmbeddings(datasetId, chunks, embeddings) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(
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

async function findSimilarChunks(query, userId, limit = 5) {
  try {
    // Generate embedding for the query
    const queryResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
      encoding_format: 'float'
    });
    
    const queryEmbedding = queryResponse.data[0].embedding;
    
    // Get all embeddings for the user's datasets
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT e.chunk_text, e.embedding, d.original_name 
         FROM embeddings e 
         JOIN datasets d ON e.dataset_id = d.id 
         WHERE d.user_id = ?`,
        [userId],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          
          // Calculate cosine similarity
          const similarities = rows.map(row => {
            const storedEmbedding = new Float32Array(row.embedding.buffer);
            const similarity = cosineSimilarity(queryEmbedding, Array.from(storedEmbedding));
            return {
              text: row.chunk_text,
              similarity,
              source: row.original_name
            };
          });
          
          // Sort by similarity and return top results
          similarities.sort((a, b) => b.similarity - a.similarity);
          resolve(similarities.slice(0, limit));
        }
      );
    });
  } catch (error) {
    console.error('Error finding similar chunks:', error);
    return [];
  }
}

function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (normA * normB);
}

app.post('/ask', async (req, res) => {
  const userQuestion = req.body.question;
  const useContext = req.body.useContext || false;
  const tone = req.body.tone || 'simple';
  
  try {
    let context = '';
    
    // If user is logged in and has datasets, find relevant context
    if (useContext && req.session.userId) {
      try {
        const similarChunks = await findSimilarChunks(userQuestion, req.session.userId, 3);
        if (similarChunks.length > 0) {
          context = '\n\nRelevant information from your uploaded documents:\n' +
            similarChunks.map(chunk => 
              `[From: ${chunk.source}]\n${chunk.text}\n`
            ).join('\n');
        }
      } catch (error) {
        console.error('Error finding context:', error);
      }
    }
    
    // Define tone-specific system prompts
    const tonePrompts = {
      simple: 'You are Microplastic, a friendly and enthusiastic anti-plastic whale who loves teaching about microplastics! Speak in a cheerful, warm tone with occasional whale puns and ocean references. Use everyday language that anyone can understand, and avoid complex jargon. Break down complex concepts into easy-to-grasp parts. Be encouraging and supportive - you want to inspire people to care about ocean conservation!',
      scientific: 'You are Microplastic, a knowledgeable and enthusiastic anti-plastic whale with deep scientific expertise about microplastics! While maintaining your friendly whale personality, provide detailed, accurate, and scientifically rigorous answers. Use proper scientific terminology when appropriate, but always explain complex terms. Be thorough and precise in your explanations while keeping your warm, encouraging tone.',
      teen: 'You are Microplastic, a super cool and relatable anti-plastic whale who speaks to teenagers! Use trendy language, include relevant examples that teens can connect with, and keep explanations engaging and accessible. Use emojis occasionally, make whale puns, and maintain an upbeat, encouraging tone. You want to inspire the next generation of ocean protectors!'
    };
    
    const baseSystemPrompt = tonePrompts[tone] || tonePrompts.simple;
    const systemPrompt = context ? 
      `${baseSystemPrompt} Use the provided context when relevant to give more accurate and detailed answers.` :
      baseSystemPrompt;
    
    const userPrompt = context ? 
      `Context: ${context}\n\nQuestion: ${userQuestion}` :
      userQuestion;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });
    
    res.json({ answer: response.choices[0].message.content });
  } catch (error) {
    console.error("OpenAI API error:", error);
    if (error.response) {
      console.error("OpenAI API response:", error.response.status, error.response.data);
    }
    res.status(500).json({
      answer: 'Oops! Something went wrong. Check your server log for details.',
    });
  }
});

// ✅ Serve your webpage from /public (move this AFTER all API/auth routes)
app.use(express.static('public'));

// --- SERVER START ---
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

