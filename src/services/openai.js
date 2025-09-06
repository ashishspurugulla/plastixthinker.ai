import OpenAI from 'openai';
import { config } from '../config/config.js';

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  /**
   * Generate embeddings for text chunks
   */
  async generateEmbeddings(chunks) {
    const embeddings = [];
    
    try {
      for (const chunk of chunks) {
        const response = await this.openai.embeddings.create({
          model: config.openai.embeddingModel,
          input: chunk,
          encoding_format: 'float'
        });
        
        embeddings.push(response.data[0].embedding);
      }
      
      return embeddings;
    } catch (error) {
      console.error('❌ Error generating embeddings:', error);
      throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
  }

  /**
   * Generate chat completion with context-aware responses
   */
  async generateChatCompletion(userQuestion, context = '', tone = 'simple') {
    try {
      // Define tone-specific system prompts
      const tonePrompts = {
        simple: 'You are PlastixThinker, a friendly and enthusiastic AI environmental expert who loves teaching about microplastics! Speak in a cheerful, warm tone with occasional environmental references. Use everyday language that anyone can understand, and avoid complex jargon. Break down complex concepts into easy-to-grasp parts. Be encouraging and supportive - you want to inspire people to care about ocean conservation!',
        scientific: 'You are PlastixThinker, a knowledgeable and enthusiastic AI environmental expert with deep scientific expertise about microplastics! While maintaining your friendly personality, provide detailed, accurate, and scientifically rigorous answers. Use proper scientific terminology when appropriate, but always explain complex terms. Be thorough and precise in your explanations while keeping your warm, encouraging tone.',
        teen: 'You are PlastixThinker, a super cool and relatable AI environmental expert who speaks to teenagers! Use trendy language, include relevant examples that teens can connect with, and keep explanations engaging and accessible. Use emojis occasionally, make environmental references, and maintain an upbeat, encouraging tone. You want to inspire the next generation of ocean protectors!'
      };
      
      const baseSystemPrompt = tonePrompts[tone] || tonePrompts.simple;
      const systemPrompt = context ? 
        `${baseSystemPrompt} Use the provided context when relevant to give more accurate and detailed answers.` :
        baseSystemPrompt;
      
      const userPrompt = context ? 
        `Context: ${context}\n\nQuestion: ${userQuestion}` :
        userQuestion;
      
      const response = await this.openai.chat.completions.create({
        model: config.openai.model,
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
        temperature: 0.7,
        max_tokens: 1000,
      });
      
      return response.choices[0].message.content;
    } catch (error) {
      console.error('❌ OpenAI API error:', error);
      
      // Provide user-friendly error messages
      if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      } else if (error.status === 401) {
        throw new Error('Authentication failed. Please check your API key.');
      } else if (error.status === 500) {
        throw new Error('OpenAI service is temporarily unavailable. Please try again later.');
      } else {
        throw new Error('Sorry, I encountered an error. Please try again.');
      }
    }
  }

  /**
   * Generate embedding for a single query (for semantic search)
   */
  async generateQueryEmbedding(query) {
    try {
      const response = await this.openai.embeddings.create({
        model: config.openai.embeddingModel,
        input: query,
        encoding_format: 'float'
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('❌ Error generating query embedding:', error);
      throw new Error(`Failed to generate query embedding: ${error.message}`);
    }
  }

  /**
   * Validate API key
   */
  async validateAPIKey() {
    try {
      await this.openai.models.list();
      return true;
    } catch (error) {
      console.error('❌ OpenAI API key validation failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const openaiService = new OpenAIService();
