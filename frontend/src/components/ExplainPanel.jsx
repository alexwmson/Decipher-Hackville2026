import { useEffect, useState } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

function ExplainPanel({ text, requestId }) {
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchExplanation = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await axios.post('/api/explain', { text })
        setExplanation(response.data.explanation)
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to explain text')
        console.error('Explain error:', err)
      } finally {
        setLoading(false)
      }
    }

    // Only fetch when user explicitly clicks "Explain"
    if (requestId && text) {
      fetchExplanation()
    }
  }, [requestId])

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Explanation</h2>

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Explaining...</p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {explanation && !loading && (
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
            {explanation}
          </ReactMarkdown>
        </div>
      )}
    </div>
  )
}

export default ExplainPanel

