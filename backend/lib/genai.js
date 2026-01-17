import { GoogleGenAI } from '@google/genai';

// Defaults based on the @google/genai README quickstart in node_modules.
export const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash';
export const VISION_MODEL =
  process.env.GEMINI_VISION_MODEL || process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash';

export function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Missing GEMINI_API_KEY. Create backend/.env with GEMINI_API_KEY=... (server-only).'
    );
  }
  return new GoogleGenAI({ apiKey });
}

export function getText(result) {
  if (!result) return '';

  // @google/genai typically provides a convenience `text` field.
  if (typeof result.text === 'string') return result.text;
  if (typeof result.text === 'function') return result.text();

  // Fallback: stitch together candidate parts.
  const parts = result.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    return parts.map((p) => (typeof p?.text === 'string' ? p.text : '')).join('');
  }

  return '';
}

