import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ocrRouter } from './routes/ocr.js';
import { simplifyRouter } from './routes/simplify.js';
import { knowledgeTreeRouter } from './routes/knowledge-tree.js';
import { explainRouter } from './routes/explain.js';
import { getGenAI, getText, TEXT_MODEL } from './lib/genai.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/ocr', ocrRouter);
app.use('/api/simplify', simplifyRouter);
app.use('/api/knowledge-tree', knowledgeTreeRouter);
app.use('/api/explain', explainRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/test-text', async (req, res) => {
  try {
    const ai = getGenAI();
    const result = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: [{ role: 'user', parts: [{ text: 'Reply with the word OK.' }] }],
    });

    res.json({ output: getText(result) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});