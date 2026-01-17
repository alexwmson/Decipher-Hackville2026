import express from 'express';
import { getGenAI, getText, TEXT_MODEL } from '../lib/genai.js';

const router = express.Router();

/**
 * POST /api/simplify
 * Takes selected text and returns a simplified explanation
 */
router.post('/', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const prompt = `Simplify the following text to make it easier to understand for a student. 
    Keep the mathematical notation and equations intact, but explain concepts in simpler terms.
    Return the simplified explanation as Markdown with proper formatting.
    
    Text to simplify:
    ${text}`;

    const ai = getGenAI();
    const result = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const simplified = getText(result);

    res.json({ simplified });
  } catch (error) {
    console.error('Simplify Error:', error);
    res.status(500).json({ error: 'Failed to simplify text', details: error.message });
  }
});

export { router as simplifyRouter };
