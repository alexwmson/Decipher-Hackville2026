import { useEffect, useRef, useState } from 'react'
import axios from 'axios'

function KnowledgeTreePanel({ text, fullText, requestId, onBusyChange }) {
  const [knowledgeTree, setKnowledgeTree] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const lastHandledRequestIdRef = useRef(0)
  const abortRef = useRef(null)

  useEffect(() => {
    const fetchKnowledgeTree = async () => {
      setLoading(true)
      setError('')
      onBusyChange?.(true)

      try {
        abortRef.current?.abort?.()
        const controller = new AbortController()
        abortRef.current = controller

        const response = await axios.post('/api/knowledge-tree', {
          highlightedText: text,
          fullText,
        }, { signal: controller.signal })
        setKnowledgeTree(response.data.knowledgeTree)
      } catch (err) {
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
          onBusyChange?.(false)
          return
        }
        setError(err.response?.data?.error || 'Failed to generate knowledge tree')
        console.error('Knowledge tree error:', err)
      } finally {
        setLoading(false)
        onBusyChange?.(false)
      }
    }

    // Only fetch when the user explicitly clicks "Knowledge Tree" (requestId changes),
    // not on every highlight/selection change.
    if (requestId && text) {
      if (lastHandledRequestIdRef.current === requestId) return
      lastHandledRequestIdRef.current = requestId
      fetchKnowledgeTree()
    }
  }, [requestId])

  const renderTree = (node, level = 0) => {
    if (!node) return null

    return (
      <div
        key={node.concept || 'root'}
        className="ml-4 border-l-2 border-white/10 pl-4 py-2"
      >
        <div className="flex items-start">
          <div className={`w-3 h-3 rounded-full mt-1.5 ${
            level === 0 ? 'bg-cyan-400' :
            level === 1 ? 'bg-emerald-400' :
            'bg-fuchsia-400'
          }`}></div>
          <div className="ml-2 flex-1">
            <h4 className="font-semibold text-white/90">{node.concept || node.root}</h4>
            {node.description && (
              <p className="text-sm text-white/70 mt-1">{node.description}</p>
            )}
          </div>
        </div>
        {node.subPrerequisites && node.subPrerequisites.length > 0 && (
          <div className="mt-2">
            {node.subPrerequisites.map((sub, idx) => renderTree(sub, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full">
      <h2 className="text-lg font-semibold mb-3 text-white/90">Knowledge Tree</h2>
      
      {loading && (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-fuchsia-300"></div>
          <p className="mt-3 text-white/70 text-sm">Generating knowledge tree...</p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-400/20 text-red-200 rounded-xl text-sm">
          {error}
        </div>
      )}

      {knowledgeTree && !loading && (
        <div className="space-y-2 text-white/85 text-sm">
          {knowledgeTree.root && (
            <div className="mb-4 p-3 bg-cyan-500/10 rounded-xl border border-cyan-300/20">
              <h3 className="font-bold text-cyan-200">Main Concept</h3>
              <p className="text-white/90">{knowledgeTree.root}</p>
            </div>
          )}
          
          {knowledgeTree.prerequisites && knowledgeTree.prerequisites.length > 0 ? (
            <div>
              <h3 className="font-semibold mb-3 text-white/80">Prerequisites</h3>
              {knowledgeTree.prerequisites.map((prereq, idx) => (
                <div key={idx} className="mb-3">
                  {renderTree(prereq, 1)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-white/60 text-sm">No prerequisites identified</p>
          )}

          {knowledgeTree.rawResponse && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-white/70">Raw Response</summary>
              <pre className="mt-2 p-3 bg-black/30 border border-white/10 rounded-xl text-xs overflow-auto">
                {knowledgeTree.rawResponse}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

export default KnowledgeTreePanel
