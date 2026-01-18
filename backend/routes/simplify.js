import express from 'express';
import { getGenAI, getText, TEXT_MODEL } from '../lib/genai.js';

const router = express.Router();

/**
 * POST /api/simplify
 * Takes selected text and returns a simplified explanation
 */
router.post('/', async (req, res) => {
  try {
    const { text, highlightedText, fullText } = req.body;
    const selected = highlightedText || text;

    if (!selected) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const prompt = `You are a math/science tutor. Simplify the following highlighted excerpt to make it easier to understand for a student.

CONTEXT (entire extracted page; use only for disambiguation, definitions, and variable meanings):
${fullText ? fullText : '(This means no additional context provided)'}

REQUIREMENTS:
- Keep the meaning the same.
- Keep mathematical notation and equations intact.
- Use simple language and short paragraphs.
- If the excerpt references symbols/variables defined elsewhere on the page, use the context to explain them correctly.
- Don't include any openings such as "Hi Im the tutor", go right to the simplification.

OUTPUT:
- Return Markdown only (no code fences, no commentary).

HIGHLIGHTED TEXT TO SIMPLIFY:
${selected}`;

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
