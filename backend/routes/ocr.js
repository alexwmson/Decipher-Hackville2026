import express from 'express';
import multer from 'multer';
import { getGenAI, getText, TEXT_MODEL, VISION_MODEL } from '../lib/genai.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

function blocksToMarkdown(blocks) {
  if (!Array.isArray(blocks)) return '';
  const out = [];

  const renderInlineParts = (parts) => {
    if (!Array.isArray(parts)) return '';
    return parts
      .map((p) => {
        if (!p || typeof p !== 'object') return '';
        if (p.type === 'text') return String(p.text || '');
        if (p.type === 'var' || p.type === 'inline_math') return `$${String(p.latex || '').trim()}$`;
        return '';
      })
      .join('');
  };

  for (const b of blocks) {
    if (!b || typeof b !== 'object') continue;

    if (b.type === 'heading') {
      const level = Math.min(6, Math.max(1, Number(b.level || 2)));
      const text = String(b.text || '').trim();
      if (text) out.push(`${'#'.repeat(level)} ${text}`, '');
      continue;
    }

    // Rich inline content (lets us represent variables like x, y_i inline reliably)
    if (b.type === 'rich_text') {
      const text = renderInlineParts(b.parts).trim();
      if (text) out.push(text, '');
      continue;
    }

    if (b.type === 'paragraph') {
      const text = String(b.text || '').trim();
      if (text) out.push(text, '');
      continue;
    }

    if (b.type === 'equation') {
      const latex = String(b.latex || '').trim();
      const display = b.display !== false; // default true
      if (!latex) continue;
      if (display) out.push('$$', latex, '$$', '');
      else out.push(`$${latex}$`, '');
      continue;
    }

    if (b.type === 'list') {
      const ordered = Boolean(b.ordered);
      const items = Array.isArray(b.items) ? b.items : [];
      items.forEach((it, idx) => {
        // Allow either a plain string item or a rich item with parts.
        if (typeof it === 'string') {
          const text = it.trim();
          if (!text) return;
          out.push(ordered ? `${idx + 1}. ${text}` : `- ${text}`);
          return;
        }
        if (it && typeof it === 'object' && Array.isArray(it.parts)) {
          const text = renderInlineParts(it.parts).trim();
          if (!text) return;
          out.push(ordered ? `${idx + 1}. ${text}` : `- ${text}`);
        }
      });
      out.push('');
    }
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function promoteStandaloneInlineMathToDisplay(md) {
  if (typeof md !== 'string') return md;

  const lines = md.split(/\r?\n/);
  const out = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();

    // If the entire line is a single inline-math expression like `$...$`,
    // promote it to display math `$$...$$` so it renders like a textbook.
    // (We skip if it's already $$...$$.)
    const isSingleInlineMathLine =
      trimmed.startsWith('$') &&
      trimmed.endsWith('$') &&
      !trimmed.startsWith('$$') &&
      !trimmed.endsWith('$$') &&
      trimmed.length >= 2 &&
      // Avoid converting currency/other uses: require some LaTeX-ish content.
      /[\\^_=]|\\frac|\\sqrt|\\sum|\\int|\\left|\\right|[0-9]/.test(trimmed);

    if (isSingleInlineMathLine) {
      const inner = trimmed.slice(1, -1).trim();
      out.push('');
      out.push('$$');
      out.push(inner);
      out.push('$$');
      out.push('');
      continue;
    }

    out.push(line);
  }

  // Normalize: collapse 3+ blank lines to 2.
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

function normalizeBlockMath(md) {
  if (typeof md !== 'string') return md;

  let out = md;

  // If someone writes $$...$$ on one line, remark-math will often not treat it as block.
  // Promote single-line $$...$$ to multi-line display blocks.
  out = out.replace(/\$\$\s*([^\n]+?)\s*\$\$/g, (_m, inner) => {
    const content = String(inner || '').trim();
    return `\n\n$$\n${content}\n$$\n\n`;
  });

  // Ensure $$ fences are on their own lines (common model mistake: text $$\n ...).
  out = out.replace(/([^\n])\$\$/g, '$1\n$$');
  out = out.replace(/\$\$([^\n])/g, '$$\n$1');

  // Normalize blank lines.
  out = out.replace(/\n{3,}/g, '\n\n');
  return out;
}

/**
 * POST /api/ocr
 * Accepts an image file and returns extracted text as Markdown
 */
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Convert image to base64
    const imageBase64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    const ai = getGenAI();

    // STEP 1: Extract content as faithful Markdown (prioritize fidelity over prettiness).
    const extractPrompt = `
Extract all text and mathematical equations from this textbook page.

REQUIREMENTS:
- Preserve the exact wording, order, and content. Do NOT paraphrase.
- Do NOT add any explanations, examples, summaries, or interpretation.
- Do NOT remove content.
- Keep line breaks only when they appear to exist in the source (avoid "pretty" reflow).

MATH:
- Use $ for inline math and $$ for block math.
- Keep equations exactly as they appear.
- If an equation is displayed / set apart from a sentence in the source, output it as $$...$$ on its own lines.

OUTPUT:
- Return ONLY Markdown (no fences, no commentary).
`;

    const extractionResult = await ai.models.generateContent({
      model: VISION_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { text: extractPrompt },
            {
              inlineData: {
                data: imageBase64,
                mimeType,
              },
            },
          ],
        },
      ],
      config: {
        temperature: 0,
        topP: 1,
      },
    });

    const extractedMarkdown = getText(extractionResult);

    // STEP 2: Reformat for readability/accessibility WITHOUT changing wording/meaning.
    // This should only adjust layout (headings/spacing), never rewrite sentences.
    const formatPrompt = `
You are given raw extracted textbook text.

TASK:
Reformat the text to be easier to read and more accessible, without changing the meaning or wording.

RULES:
- Do NOT paraphrase.
- Do NOT remove content.
- Do NOT add explanations.
- You MAY merge lines into paragraphs.
- You MAY improve spacing and layout.
- For any equation, use display math with $$ ... $$ and blank lines around it.

FORMAT:
- Output Markdown.
- Use clear paragraphs.
- Keep equations properly formatted using LaTeX.

INPUT MARKDOWN:
${extractedMarkdown}
`;

    let formattedMarkdown = '';
    try {
      const formatResult = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: [{ role: 'user', parts: [{ text: formatPrompt }] }],
        config: {
          temperature: 0,
          topP: 1,
        },
      });
      formattedMarkdown = getText(formatResult);
    } catch (e) {
      // If formatting fails, still return the extracted Markdown so the user isn't blocked.
      console.error('OCR Formatting Error:', e);
    }

    const markdown = normalizeBlockMath(
      promoteStandaloneInlineMathToDisplay(formattedMarkdown || extractedMarkdown)
    );

    // EXTRA (more consistent output for you to render yourself):
    // Ask Gemini for a strict JSON "blocks" layout, so the frontend can format deterministically.
    const schema = {
      type: 'object',
      required: ['blocks'],
      properties: {
        blocks: {
          type: 'array',
          items: {
            type: 'object',
            required: ['type'],
            properties: {
              type: { type: 'string', enum: ['heading', 'paragraph', 'rich_text', 'equation', 'list'] },
              level: { type: 'integer', minimum: 1, maximum: 6 },
              text: { type: 'string' },
              parts: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['type'],
                  properties: {
                    type: { type: 'string', enum: ['text', 'var', 'inline_math'] },
                    text: { type: 'string' },
                    latex: { type: 'string' },
                  },
                  additionalProperties: false,
                },
              },
              latex: { type: 'string' },
              display: { type: 'boolean' },
              ordered: { type: 'boolean' },
              items: {
                type: 'array',
                items: {
                  anyOf: [
                    { type: 'string' },
                    {
                      type: 'object',
                      required: ['parts'],
                      properties: {
                        parts: {
                          type: 'array',
                          items: {
                            type: 'object',
                            required: ['type'],
                            properties: {
                              type: { type: 'string', enum: ['text', 'var', 'inline_math'] },
                              text: { type: 'string' },
                              latex: { type: 'string' },
                            },
                            additionalProperties: false,
                          },
                        },
                      },
                      additionalProperties: false,
                    },
                  ],
                },
              },
            },
            additionalProperties: false,
          },
        },
      },
      additionalProperties: false,
    };

    let blocks = null;
    try {
      const blocksPrompt = `
Convert the following textbook content into a JSON layout so the frontend can render it consistently.

CRITICAL RULES:
- Preserve the exact wording. Do NOT paraphrase or summarize.
- Do NOT add explanations.
- Do NOT remove content.
- Keep the original reading order as best as possible.

BLOCK TYPES (use only these):
- heading: { "type":"heading", "level":1-6, "text":"..." }
- paragraph: { "type":"paragraph", "text":"..." }
- rich_text: { "type":"rich_text", "parts":[ { "type":"text","text":"..." }, { "type":"var","latex":"y" } ] }
- equation: { "type":"equation", "latex":"...", "display":true|false }
- list: { "type":"list", "ordered":true|false, "items":["..."] }

MATH RULES:
- For inline variable names in a sentence (x, y, y_i, f(x), etc.), prefer rich_text parts with {type:"var", latex:"..."}.
- For other inline math inside a sentence, you may use {type:"inline_math", latex:"..."} in rich_text parts.
- Do NOT create a separate equation block for single-letter variables that appear inline in a sentence.
- Inline math that is part of a sentence must remain inline (rich_text), not display.
- Standalone/display equation => equation block with display=true.
- Put ONLY LaTeX in latex (no $ or $$ delimiters).

OUTPUT:
- Return ONLY JSON matching the provided schema. No markdown fences, no commentary.

INPUT:
${markdown}
`;

      const blocksResult = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: [{ role: 'user', parts: [{ text: blocksPrompt }] }],
        config: {
          temperature: 0,
          topP: 1,
          responseMimeType: 'application/json',
          responseJsonSchema: schema,
        },
      });

      const blocksText = getText(blocksResult);
      const parsed = JSON.parse(blocksText);
      if (Array.isArray(parsed?.blocks)) blocks = parsed.blocks;
    } catch (e) {
      // Optional enhancement only; keep main OCR flow working even if this fails.
      console.error('OCR Blocks Error:', e);
    }

    // If blocks succeeded, also provide a deterministic markdown built from blocks.
    const blocksMarkdown = blocks
      ? normalizeBlockMath(promoteStandaloneInlineMathToDisplay(blocksToMarkdown(blocks)))
      : null;

    res.json({ markdown, extractedMarkdown, formattedMarkdown, blocks, blocksMarkdown });
  } catch (error) {
    console.error('OCR Error:', error);
    res.status(500).json({ error: 'Failed to process image', details: error.message });
  }
});


export { router as ocrRouter };
