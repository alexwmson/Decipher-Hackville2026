import express from 'express';
import { getGenAI, getText, TEXT_MODEL } from '../lib/genai.js';

const router = express.Router();

/**
 * POST /api/knowledge-tree
 * Takes selected text and returns a prerequisite knowledge tree as JSON
 */
router.post('/', async (req, res) => {
  try {
    const { text, highlightedText, fullText } = req.body;
    const selected = highlightedText || text;

    if (!selected) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const prompt = `You are given a highlighted excerpt from a textbook page. Create a prerequisite knowledge tree showing what concepts a student needs BEFORE they can understand the highlighted excerpt.

CONTEXT (entire extracted page(s); use for disambiguation only):
${fullText ? fullText : '(no additional context provided)'}

    Return the response as a JSON object with the following structure:
    {
      "root": "main concept name",
      "prerequisites": [
        {
          "concept": "prerequisite concept name",
          "description": "brief description",
          "subPrerequisites": [
            {
              "concept": "sub-concept name",
              "description": "brief description"
            }
          ]
        }
      ]
    }

    HIGHLIGHTED TEXT TO ANALYZE:
    ${selected}`;

    const ai = getGenAI();
    const result = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const responseText = getText(result);

    // Try to extract JSON from the response
    let knowledgeTree;
    try {
      // Remove markdown code blocks if present
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       responseText.match(/```\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : responseText;
      knowledgeTree = JSON.parse(jsonString);
    } catch (parseError) {
      // If parsing fails, return a structured error response
      console.error('JSON Parse Error:', parseError);
      knowledgeTree = {
        root: "Unable to parse",
        prerequisites: [],
        rawResponse: responseText
      };
    }

    res.json({ knowledgeTree });
  } catch (error) {
    console.error('Knowledge Tree Error:', error);
    res.status(500).json({ error: 'Failed to generate knowledge tree', details: error.message });
  }
});

export { router as knowledgeTreeRouter };
