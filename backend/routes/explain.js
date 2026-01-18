import express from 'express';
import { getGenAI, getText, TEXT_MODEL } from '../lib/genai.js';

const router = express.Router();

/**
 * POST /api/explain
 * Takes selected text and returns an easy-to-understand explanation as Markdown
 */
router.post('/', async (req, res) => {
  try {
    const { text, highlightedText, fullText } = req.body;
    const selected = highlightedText || text;

    if (!selected) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const ai = getGenAI();

    const prompt = `
You are a math/science tutor. Explain the MATHEMATICAL IDEAS behind the highlighted textbook text.
Do NOT merely paraphrase the English sentence-by-sentence, focus on the concepts, meaning of symbols, and what the statement is asserting mathematically.

RULES:
- Keep the meaning the same.
- Do NOT rewrite the highlighted text; explain it.
- Use the FULL PAGE context to resolve what variables/symbols refer to and to find any relevant equations/definitions near the highlighted excerpt.
- If the highlighted text references "this", "the formula", "theorem", "first/second formula", etc., identify *what* it refers to using the context.
- If there is math (explicit or implied), explain:
  - what each variable/symbol represents,
  - what the relationship/equation is claiming,
  - the intuition: why it should be true / what to picture.
- If helpful, include a tiny worked example with simple numbers (only if consistent with the page’s meaning).

OUTPUT (Markdown only):
- **What this is about**: name the concept/theorem/goal in 1 line.
- **Key definitions / symbols**: bullet list of variables and what they mean (use context).
- **What the statement means mathematically**: 2–6 sentences.
- **How it connects to the formulas on the page**: refer to the relevant formula/equation from context (quote it if present).
- **Mini example (optional)**: 2–6 lines.

FULL PAGE (CONTEXT):
${fullText ? fullText : '(no additional context provided)'}

HIGHLIGHTED TEXT:
${selected}
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

