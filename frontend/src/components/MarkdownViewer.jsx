import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

function MarkdownViewer({ markdown, onTextSelected }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseUp = () => {
      const selection = window.getSelection()
      const selectedText = selection.toString().trim()
      
      if (selectedText) {
        onTextSelected(selectedText)
      }
    }

    container.addEventListener('mouseup', handleMouseUp)

    return () => {
      container.removeEventListener('mouseup', handleMouseUp)
    }
  }, [onTextSelected])

  if (!markdown) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
        <p>Upload an image to see extracted content here</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Extracted Content</h2>
      <div
        ref={containerRef}
        className="prose prose-sm max-w-none markdown-content"
        style={{
          userSelect: 'text',
          cursor: 'text',
          lineHeight: '1.6',
        }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {markdown}
        </ReactMarkdown>
      </div>
      
      <style>{`
        .markdown-content ::selection {
          background-color: #bfdbfe;
        }
        /* Ensure display math renders like a textbook even if prose styles interfere */
        .markdown-content .katex-display {
          display: block;
          text-align: center;
          margin: 1em 0;
          overflow-x: auto;
          overflow-y: hidden;
        }
        .markdown-content .katex-display > .katex {
          display: inline-block;
          margin: 0 auto;
        }
        .markdown-content h1,
        .markdown-content h2,
        .markdown-content h3 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        .markdown-content p {
          margin-bottom: 1em;
        }
        .markdown-content code {
          background-color: #f3f4f6;
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
        }
      `}</style>
    </div>
  )
}

export default MarkdownViewer
