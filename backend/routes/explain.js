import express from 'express';
import { getGenAI, getText, TEXT_MODEL } from '../lib/genai.js';

const router = express.Router();

/**
 * POST /api/explain
 * Takes selected text and returns an easy-to-understand explanation as Markdown
 */
router.post('/', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const ai = getGenAI();

    const prompt = `
Explain the following highlighted textbook text in a way that is easy to understand.

REQUIREMENTS:
- Keep the meaning the same.
- Do NOT change or rewrite the original quoted text; instead, explain it.
- Use simple language and short paragraphs.
- If there is math, explain what each symbol/term represents and what the equation is saying.
- If helpful, include a tiny example (only if it does not change the meaning).

OUTPUT:
- Return Markdown only (no code fences, no commentary).

HIGHLIGHTED TEXT:
${text}
`;

    const result = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.2,
        topP: 1,
      },
    });

    const explanation = getText(result);
    res.json({ explanation });
  } catch (error) {
    console.error('Explain Error:', error);
    res.status(500).json({ error: 'Failed to explain text', details: error.message });
  }
});

export { router as explainRouter };

