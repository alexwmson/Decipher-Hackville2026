# Textbook Helper - Accessibility-Focused Learning Tool

A full-stack web application that helps students understand difficult textbook pages by extracting text and equations, and providing simplified explanations and prerequisite knowledge trees.

## Features

- 📸 **Image Upload & Camera Capture**: Upload textbook pages or take photos directly
- 📝 **OCR with Math Support**: Extract text and mathematical equations using Google Gemini Vision API
- 📖 **Markdown Rendering**: Display extracted content with LaTeX math equation support (KaTeX)
- ✨ **Text Highlighting**: Select text from the extracted content
- 🎯 **Simplification**: Get simplified explanations of selected text
- 🌳 **Knowledge Tree**: Generate prerequisite concept trees to understand what you need to learn first

## Tech Stack

- **Frontend**: React + Vite + JavaScript + Tailwind CSS
- **Backend**: Node.js + Express
- **LLM/OCR**: Google Gemini Vision API
- **Math Rendering**: KaTeX

## Project Structure

```
.
├── frontend/          # React + Vite application
│   ├── src/
│   │   ├── components/
│   │   │   ├── ImageUpload.jsx
│   │   │   ├── MarkdownViewer.jsx
│   │   │   ├── SimplificationPanel.jsx
│   │   │   └── KnowledgeTreePanel.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── backend/          # Express API server
│   ├── routes/
│   │   ├── ocr.js
│   │   ├── simplify.js
│   │   └── knowledge-tree.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with the following content:
   ```
   PORT=3001
   GEMINI_API_KEY=your-actual-api-key-here
   ```
   
   Replace `your-actual-api-key-here` with your actual Google Gemini API key.

5. Start the backend server:
   ```bash
   npm run dev
   ```

   The server will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory (in a new terminal):
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:3000`

## API Endpoints

### `POST /api/ocr`
Extracts text and equations from an image.

**Request:**
- Content-Type: `multipart/form-data`
- Body: `image` (file)

**Response:**
```json
{
  "markdown": "Extracted text as Markdown..."
}
```

### `POST /api/simplify`
Simplifies selected text for easier understanding.

**Request:**
```json
{
  "text": "Text to simplify..."
}
```

**Response:**
```json
{
  "simplified": "Simplified explanation as Markdown..."
}
```

### `POST /api/knowledge-tree`
Generates a prerequisite knowledge tree.

**Request:**
```json
{
  "text": "Text to analyze..."
}
```

**Response:**
```json
{
  "knowledgeTree": {
    "root": "Main concept",
    "prerequisites": [
      {
        "concept": "Prerequisite concept",
        "description": "Description...",
        "subPrerequisites": [...]
      }
    ]
  }
}
```

## Usage

1. Start both the backend and frontend servers
2. Open `http://localhost:3000` in your browser
3. Upload a textbook page image or take a photo
4. Wait for the content to be extracted and displayed
5. Select any text you want to understand better
6. Click "Simplify" for a simpler explanation or "Knowledge Tree" to see prerequisites

## Development Notes

- The app uses placeholder API keys in the code - make sure to set up your `.env` file with a real Gemini API key
- The frontend proxies API requests to the backend during development
- Camera access requires HTTPS in production (works on localhost for development)

## License

MIT
