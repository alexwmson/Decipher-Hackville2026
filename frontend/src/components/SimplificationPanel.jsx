import { useState, useEffect } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

function SimplificationPanel({ text, requestId }) {
  const [simplified, setSimplified] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchSimplified = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await axios.post('/api/simplify', { text })
        setSimplified(response.data.simplified)
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to simplify text')
        console.error('Simplify error:', err)
      } finally {
        setLoading(false)
      }
    }

    // Only fetch when the user explicitly clicks "Simplify" (requestId changes),
    // not on every highlight/selection change.
    if (requestId && text) {
      fetchSimplified()
    }
  }, [requestId])

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Simplified Explanation</h2>
      
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Simplifying...</p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {simplified && !loading && (
        <div className="prose prose-sm max-w-none">
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
