import express from 'express';
import { openaiService } from '../services/openai.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

router.post('/ask', asyncHandler(async (req, res) => {
  const { question, tone = 'simple' } = req.body;

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'Question is required and must be a string' });
  }

  try {
    const answer = await openaiService.generateChatCompletion(question, '', tone);
    res.json({ success: true, answer });
  } catch (err) {
    console.error('Error talking to OpenAI:', err.response?.data || err.message || err);
    res.status(500).json({ success: false, error: 'Something went wrong with OpenAI. Try again.' });
  }
}));

export default router;
