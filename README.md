# Decipher (Hackville 2026)

Live demo: `https://decipherhv.ca`

Decipher turns photos of textbook pages into readable, accessible Markdown (including math), and then helps students interact with that content using three tools:

- Simplify: rewrite a highlighted passage in simpler terms while preserving math
- Explain: explain the underlying mathematical ideas behind a highlighted passage (using full-page context)
- Knowledge Tree: generate a prerequisite concept tree for a highlighted passage (using full-page context)

The main view supports multi-page workflows: each additional upload/capture appends a new “page” that you can flip through.

## Tech stack

- Frontend: React + Vite + Tailwind, `react-markdown`, KaTeX
- Backend: Node.js + Express, `multer` for uploads
- AI: Google Gemini Vision / Google Gemini via `@google/genai`

## Local development

### Prerequisites

- Node.js 20+ required
- A Gemini API key

### 1) Backend

Create `Decipher-Hackville2026/backend/.env`:

```bash
GEMINI_API_KEY=your_key_here
# Optional:
# GEMINI_TEXT_MODEL=gemini-2.5-flash
# GEMINI_VISION_MODEL=gemini-2.5-flash
# PORT=3001
```

Install and run:

```bash
cd Decipher-Hackville2026/backend
npm install
npm run dev
```

Backend runs at `http://localhost:3001`.

### 2) Frontend

Install and run:

```bash
cd Decipher-Hackville2026/frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000` and proxies `/api/*` to the backend (`vite.config.js`).

## API endpoints (backend)

- `POST /api/ocr` (multipart form-data)
  - field: `image` (file)
  - returns: `markdown` / `blocksMarkdown` + other debug fields
  - behavior: if no readable text is detected, returns **422** with a friendly error message
- `POST /api/simplify` (JSON)
  - body: `{ highlightedText, fullText }` (legacy `{ text }` still supported)
- `POST /api/explain` (JSON)
  - body: `{ highlightedText, fullText }` (legacy `{ text }` still supported)
- `POST /api/knowledge-tree` (JSON)
  - body: `{ highlightedText, fullText }` (legacy `{ text }` still supported)
- `GET /health`

## Notes / troubleshooting

- Camera capture requires HTTPS on real devices (or `localhost`). The hosted demo uses HTTPS.
- If OCR returns “No readable text detected”, try better lighting, less blur, and moving closer.
- OCR is instructed to ignore non-text figures/diagrams (it will not describe them).

## Deployment

This project is hosted on DigitalOcean and served at `https://decipherhv.ca`.

