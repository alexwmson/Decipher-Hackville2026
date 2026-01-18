import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

function MarkdownViewer({ markdown, onTextSelected, className = '' }) {
  const containerRef = useRef(null)
  const lastSelectedRef = useRef('')

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const getCleanSelectedText = () => {
      const selection = window.getSelection?.()
      if (!selection || selection.rangeCount === 0) return ''

      // Only react to selections inside this container
      const anchorNode = selection.anchorNode
      const focusNode = selection.focusNode
      if (anchorNode && !container.contains(anchorNode)) return ''
      if (focusNode && !container.contains(focusNode)) return ''

      const range = selection.getRangeAt(0)
      const fragment = range.cloneContents()

      // KaTeX renders both visual HTML and hidden MathML. When selected, the MathML can
      // get included too, producing duplicates like "y y". Strip it out.
      const wrapper = document.createElement('div')
      wrapper.appendChild(fragment)
      wrapper.querySelectorAll('.katex-mathml').forEach((el) => el.remove())

      // Normalize whitespace (DOM selection often includes line breaks from layout)
      return (wrapper.textContent || '').replace(/\s+/g, ' ').trim()
    }

    const emitSelectionIfAny = () => {
      const selectedText = getCleanSelectedText()
      
      if (selectedText && selectedText !== lastSelectedRef.current) {
        lastSelectedRef.current = selectedText
        onTextSelected(selectedText)
      }
    }

    let rafId = null
    const scheduleEmit = () => {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        rafId = null
        emitSelectionIfAny()
      })
    }

    // Desktop mouse selection
    container.addEventListener('mouseup', scheduleEmit)
    // Mobile: selection happens via long-press + drag handles; touchend/selectionchange are needed.
    container.addEventListener('touchend', scheduleEmit, { passive: true })
    document.addEventListener('selectionchange', scheduleEmit)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      container.removeEventListener('mouseup', scheduleEmit)
      container.removeEventListener('touchend', scheduleEmit)
      document.removeEventListener('selectionchange', scheduleEmit)
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
