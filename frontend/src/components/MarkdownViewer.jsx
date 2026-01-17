import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

function MarkdownViewer({ markdown, onTextSelected, className = '' }) {
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
      <div className="text-center text-white/60 text-sm py-8">
        Upload an image to see extracted content here
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={['markdown-content text-white/90 text-sm leading-relaxed', className].join(' ')}
      style={{ userSelect: 'text', cursor: 'text' }}
    >
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {markdown}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownViewer
