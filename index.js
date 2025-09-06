// index.js - PlastixThinker AI Server
import express from 'express';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize OpenAI
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// File path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'PlastixThinker AI Server is running',
    timestamp: new Date().toISOString()
  });
});

// Core handler used by both /api/ask and /api/ai/ask
async function handleAsk(req, res) {
  const { question } = req.body;
  
  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return res.status(400).json({ 
      success: false, 
      error: 'Question is required and must be a string' 
    });
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: `You are PlastixThinker, an expert AI specializing in microplastics, environmental science, and ocean conservation. 
          You provide accurate, helpful, and educational information about microplastics, their environmental impact, 
          and solutions for reducing pollution. Always be informative, engaging, and encourage environmental awareness. 
          Keep responses conversational but educational.` 
        },
        { role: 'user', content: question },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });
    
    res.json({ 
      success: true, 
      answer: response.choices[0].message.content 
    });
  } catch (err) {
    console.error('OpenAI API Error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Sorry, I\'m having trouble processing your request. Please try again later.' 
    });
  }
}

// AI Chat endpoints
app.post('/api/ask', handleAsk);
app.post('/api/ai/ask', handleAsk);

// Legacy endpoint for backward compatibility
app.post('/ask', async (req, res) => {
  const { question } = req.body;
  
  if (!question) {
    return res.status(400).json({ error: 'Missing question' });
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: 'You are PlastixThinker, a helpful AI who explains microplastics simply.' 
        },
        { role: 'user', content: question },
      ],
    });
    res.json({ answer: response.choices[0].message.content });
  } catch (err) {
    console.error('OpenAI error:', err);
    res.status(500).json({ 
      answer: 'Sorry, something went wrong. Please try again later.' 
    });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve the chat page
app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('🚀 PlastixThinker AI Server Started Successfully!');
  console.log(`📍 Server running at http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🤖 AI Service: ${process.env.OPENAI_API_KEY ? 'Configured' : 'Missing API Key'}`);
  console.log('✨ Ready to handle requests!');
  console.log('');
  console.log('📝 To get started:');
  console.log('   1. Visit http://localhost:3000');
  console.log('   2. Try PlastixThinker in the chat widget');
  console.log('   3. Ask questions about microplastics and environmental solutions');
});
