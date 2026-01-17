import { useState, useEffect } from 'react'
import axios from 'axios'

function KnowledgeTreePanel({ text, requestId }) {
  const [knowledgeTree, setKnowledgeTree] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchKnowledgeTree = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await axios.post('/api/knowledge-tree', { text })
        setKnowledgeTree(response.data.knowledgeTree)
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to generate knowledge tree')
        console.error('Knowledge tree error:', err)
      } finally {
        setLoading(false)
      }
    }

    // Only fetch when the user explicitly clicks "Knowledge Tree" (requestId changes),
    // not on every highlight/selection change.
    if (requestId && text) {
      fetchKnowledgeTree()
    }
  }, [requestId])

  const renderTree = (node, level = 0) => {
    if (!node) return null

    return (
      <div key={node.concept || 'root'} className="ml-4 border-l-2 border-blue-200 pl-4 py-2">
        <div className="flex items-start">
          <div className={`w-3 h-3 rounded-full mt-1.5 ${
            level === 0 ? 'bg-blue-500' : 
            level === 1 ? 'bg-green-500' : 
            'bg-purple-500'
          }`}></div>
          <div className="ml-2 flex-1">
            <h4 className="font-semibold text-gray-800">{node.concept || node.root}</h4>
            {node.description && (
              <p className="text-sm text-gray-600 mt-1">{node.description}</p>
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Prerequisite Knowledge Tree</h2>
      
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <p className="mt-2 text-gray-600">Generating knowledge tree...</p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {knowledgeTree && !loading && (
        <div className="space-y-2">
          {knowledgeTree.root && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-bold text-blue-800">Main Concept</h3>
              <p className="text-blue-700">{knowledgeTree.root}</p>
            </div>
          )}
          
          {knowledgeTree.prerequisites && knowledgeTree.prerequisites.length > 0 ? (
            <div>
              <h3 className="font-semibold mb-3 text-gray-700">Prerequisites:</h3>
              {knowledgeTree.prerequisites.map((prereq, idx) => (
                <div key={idx} className="mb-3">
                  {renderTree(prereq, 1)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No prerequisites identified</p>
          )}

          {knowledgeTree.rawResponse && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-600">Raw Response</summary>
              <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
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
