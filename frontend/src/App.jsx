import { useState } from 'react'
import ImageUpload from './components/ImageUpload'
import MarkdownViewer from './components/MarkdownViewer'
import SimplificationPanel from './components/SimplificationPanel'
import KnowledgeTreePanel from './components/KnowledgeTreePanel'
import ExplainPanel from './components/ExplainPanel'

function App() {
  const [markdown, setMarkdown] = useState('')
  const [selectedText, setSelectedText] = useState('')
  const [showSimplify, setShowSimplify] = useState(false)
  const [showKnowledgeTree, setShowKnowledgeTree] = useState(false)
  const [showExplain, setShowExplain] = useState(false)
  const [simplifyRequestId, setSimplifyRequestId] = useState(0)
  const [knowledgeTreeRequestId, setKnowledgeTreeRequestId] = useState(0)
  const [explainRequestId, setExplainRequestId] = useState(0)

  const handleImageProcessed = (extractedMarkdown) => {
    setMarkdown(extractedMarkdown)
    setSelectedText('')
    setShowSimplify(false)
    setShowKnowledgeTree(false)
    setShowExplain(false)
    setSimplifyRequestId(0)
    setKnowledgeTreeRequestId(0)
    setExplainRequestId(0)
  }

  const handleTextSelected = (text) => {
    setSelectedText(text)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Decipher</h1>
          <p className="text-blue-100 mt-2">Accessibility-focused learning tool</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Upload and Controls */}
          <div className="lg:col-span-1 space-y-6">
            <ImageUpload onImageProcessed={handleImageProcessed} />
            
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-semibold mb-3">Selected Text</h3>
              {selectedText ? (
                <p className="text-sm text-gray-600 mb-4 p-2 bg-gray-50 rounded border">
                  {selectedText.substring(0, 100)}...
                </p>
              ) : (
                <p className="text-sm text-gray-500 mb-4">
                  Highlight text in the extracted content to enable actions.
                </p>
              )}

              <div className="flex gap-2">
                <button
                  disabled={!selectedText}
                  onClick={() => {
                    if (!selectedText) return
                    setShowSimplify(true)
                    setShowKnowledgeTree(false)
                    setShowExplain(false)
                    setSimplifyRequestId((x) => x + 1)
                  }}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Simplify
                </button>
                <button
                  disabled={!selectedText}
                  onClick={() => {
                    if (!selectedText) return
                    setShowExplain(true)
                    setShowSimplify(false)
                    setShowKnowledgeTree(false)
                    setExplainRequestId((x) => x + 1)
                  }}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Explain
                </button>
                <button
                  disabled={!selectedText}
                  onClick={() => {
                    if (!selectedText) return
                    setShowKnowledgeTree(true)
                    setShowSimplify(false)
                    setShowExplain(false)
                    setKnowledgeTreeRequestId((x) => x + 1)
                  }}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Knowledge Tree
                </button>
              </div>
            </div>
          </div>

          {/* Middle Column - Markdown Viewer */}
          <div className="lg:col-span-1">
            <MarkdownViewer 
              markdown={markdown} 
              onTextSelected={handleTextSelected}
            />
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-1">
            {showSimplify && selectedText && (
              <SimplificationPanel text={selectedText} requestId={simplifyRequestId} />
            )}
            {showExplain && selectedText && (
              <ExplainPanel text={selectedText} requestId={explainRequestId} />
            )}
            {showKnowledgeTree && selectedText && (
              <KnowledgeTreePanel text={selectedText} requestId={knowledgeTreeRequestId} />
            )}
            {!showSimplify && !showExplain && !showKnowledgeTree && (
              <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
                <p>Select text and choose an action to see results here</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
