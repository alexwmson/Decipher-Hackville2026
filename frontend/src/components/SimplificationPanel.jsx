import { useRef, useState, useEffect } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

function SimplificationPanel({ text, fullText, requestId }) {
  const [simplified, setSimplified] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const lastHandledRequestIdRef = useRef(0)
  const abortRef = useRef(null)

  useEffect(() => {
    const fetchSimplified = async () => {
      setLoading(true)
      setError('')

      try {
        abortRef.current?.abort?.()
        const controller = new AbortController()
        abortRef.current = controller

        const response = await axios.post('/api/simplify', {
          highlightedText: text,
          fullText,
        }, { signal: controller.signal })
        setSimplified(response.data.simplified)
      } catch (err) {
        // Ignore cancellations (React 18 StrictMode can re-run effects in dev)
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return
        setError(err.response?.data?.error || 'Failed to simplify text')
        console.error('Simplify error:', err)
      } finally {
        setLoading(false)
      }
    }

    // Only fetch when the user explicitly clicks "Simplify" (requestId changes),
    // not on every highlight/selection change.
    if (requestId && text) {
      if (lastHandledRequestIdRef.current === requestId) return
      lastHandledRequestIdRef.current = requestId
      fetchSimplified()
    }
  }, [requestId])

  return (
    <div className="h-full">
      <h2 className="text-lg font-semibold mb-3 text-white/90">Simplified</h2>
      
      {loading && (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-emerald-300"></div>
          <p className="mt-3 text-white/70 text-sm">Simplifying...</p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-400/20 text-red-200 rounded-xl text-sm">
          {error}
        </div>
      )}

      {simplified && !loading && (
        <div className="markdown-content text-white/85 text-sm">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {simplified}
          </ReactMarkdown>
        </div>
      )}
    </div>
  )
}

export default SimplificationPanel
