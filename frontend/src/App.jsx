import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import MarkdownViewer from './components/MarkdownViewer'
import SimplificationPanel from './components/SimplificationPanel'
import KnowledgeTreePanel from './components/KnowledgeTreePanel'
import ExplainPanel from './components/ExplainPanel'
import ImageSourcePicker from './components/ImageSourcePicker'
import GlassPanel from './components/ui/GlassPanel'
import LoadingOverlay from './components/ui/LoadingOverlay'
import logoUrl from './assets/logo.svg'

function App() {
  const [view, setView] = useState('landing') // 'landing' | 'main'
  const [pages, setPages] = useState([]) // [{ markdown: string }]
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [selectedText, setSelectedText] = useState('')
  const [activeTool, setActiveTool] = useState(null) // 'simplify' | 'explain' | 'tree' | null
  const [simplifyRequestId, setSimplifyRequestId] = useState(0)
  const [knowledgeTreeRequestId, setKnowledgeTreeRequestId] = useState(0)
  const [explainRequestId, setExplainRequestId] = useState(0)

  const [imageUrl, setImageUrl] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl)
    }
  }, [imageUrl])

  const resetToolState = () => {
    setSelectedText('')
    setActiveTool(null)
    setSimplifyRequestId(0)
    setKnowledgeTreeRequestId(0)
    setExplainRequestId(0)
  }

  const handleTextSelected = (text) => {
    setSelectedText(text)
  }

  const uploadToOcr = async (fileOrBlob) => {
    setProcessing(true)
    setError('')
    const fullTextForContext = pages.map((p) => p?.markdown || '').filter(Boolean).join('\n\n')
    const highlightedTextForContext = selectedText
    resetToolState()

    // preview
    const nextUrl = URL.createObjectURL(fileOrBlob)
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    setImageUrl(nextUrl)

    try {
      const formData = new FormData()
      const fileName =
        typeof fileOrBlob?.name === 'string' && fileOrBlob.name.length > 0 ? fileOrBlob.name : 'upload.jpg'
      formData.append('image', fileOrBlob, fileName)
      // Provide context if the user is re-scanning from the main view.
      formData.append('highlightedText', highlightedTextForContext || '')
      formData.append('fullText', fullTextForContext || '')

      const resp = await axios.post('/api/ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const md = resp.data.blocksMarkdown || resp.data.markdown || ''
      if (!md || md.trim().length === 0) {
        setError('No readable text detected. Try a clearer photo (more light, closer, less blur).')
        return
      }
      setPages((prev) => {
        const next = Array.isArray(prev) ? prev.slice() : []
        next.push({ markdown: md })
        return next
      })
      setCurrentPageIndex((prev) => {
        // jump to newly added page
        const base = Array.isArray(pages) ? pages.length : 0
        return Math.max(0, base)
      })
      setView('main')
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to process image')
    } finally {
      setProcessing(false)
    }
  }

  const currentPageMarkdown = useMemo(() => {
    const page = Array.isArray(pages) ? pages[currentPageIndex] : null
    return (page?.markdown || '').trim()
  }, [pages, currentPageIndex])

  const allPagesText = useMemo(() => {
    return (Array.isArray(pages) ? pages : [])
      .map((p, idx) => {
        const text = (p?.markdown || '').trim()
        if (!text) return ''
        return `--- Page ${idx + 1} ---\n${text}`
      })
      .filter(Boolean)
      .join('\n\n')
  }, [pages])

  const canUseTools = useMemo(() => selectedText && selectedText.trim().length > 0, [selectedText])

  const Brand = (
    <div>
      <div className="inline-flex items-center gap-2">
        <img src={logoUrl} alt="Decipher logo" className="h-10 w-10" />
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Decipher</h1>
      </div>
      <p className="text-white/60 text-sm mt-2">Study the indecipherable with ease.</p>
    </div>
  )

  return (
    <div className="min-h-dvh lg:h-dvh lg:overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:py-6 lg:h-full flex flex-col">
        {view === 'main' && (
          <header className="flex items-center justify-between mb-4 shrink-0">
            {Brand}
            <button
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition"
              onClick={() => {
                setView('landing')
                setPages([])
                setCurrentPageIndex(0)
                setError('')
                setProcessing(false)
                if (imageUrl) URL.revokeObjectURL(imageUrl)
                setImageUrl('')
                resetToolState()
              }}
            >
              New scan
            </button>
          </header>
        )}

        {/* On mobile, allow the main area to scroll. On desktop, keep the fixed-height layout. */}
        <main className="flex-1 lg:min-h-0 overflow-y-auto lg:overflow-hidden">
          {view === 'landing' ? (
            <div
              className={`grid grid-cols-1 ${imageUrl ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-4 items-stretch lg:h-full`}
            >
              <div className="lg:h-full lg:min-h-0 lg:flex lg:flex-col lg:justify-center">
                <div className="mb-4 lg:mb-6">{Brand}</div>
                <GlassPanel className="relative p-5 sm:p-7 w-full">
                  <div className="mb-5">
                    <h2 className="text-xl sm:text-2xl font-bold text-white/95">
                      Upload a page. Get clarity.
                    </h2>
                    <p className="text-white/60 text-sm mt-2">
                      Take a photo or upload an image. We’ll extract text + equations and format it for reading.
                    </p>
                  </div>

                  <ImageSourcePicker
                    disabled={processing}
                    onPick={uploadToOcr}
                    uploadTopNote="* Recommended for desktop"
                  />

                  {error && (
                    <div className="mt-4 text-sm text-red-200 bg-red-500/10 border border-red-400/20 rounded-xl px-3 py-2">
                      {error}
                    </div>
                  )}

                  <LoadingOverlay show={processing} label="Processing..." />
                </GlassPanel>
              </div>

              {imageUrl ? (
                <GlassPanel className="relative p-5 sm:p-7 overflow-hidden flex flex-col">
                  <div className="text-sm text-white/60 mb-3 shrink-0">Preview</div>
                  <div className="flex-1 min-h-0">
                    <div className="relative h-full">
                      <img
                        src={imageUrl}
                        alt="Uploaded"
                        className="w-full h-full object-contain rounded-xl border border-white/10 bg-black/20"
                      />
                    </div>
                  </div>
                </GlassPanel>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-[auto,1fr] gap-4 lg:h-full lg:min-h-0">
              {/* Mobile order: Add pages -> Extracted -> Output. Desktop stays 2-column. */}

              {/* Add additional pages (right column, top on desktop; first on mobile) */}
              <div className="order-1 lg:order-2 lg:col-span-5 lg:row-start-1">
                <GlassPanel className="relative p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-xs uppercase tracking-wider text-white/50">Add additional pages</div>
                      <div className="text-sm text-white/80 mt-1">Upload or take another photo to append a new page</div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <ImageSourcePicker disabled={processing} onPick={uploadToOcr} />
                  </div>

                  {error && (
                    <div className="mt-4 text-sm text-red-200 bg-red-500/10 border border-red-400/20 rounded-xl px-3 py-2">
                      {error}
                    </div>
                  )}

                  <LoadingOverlay show={processing} label="Processing..." />
                </GlassPanel>
              </div>

              {/* Extracted (left column; spans both rows on desktop; second on mobile) */}
              <div className="order-2 lg:order-1 lg:col-span-7 lg:row-span-2 lg:min-h-0">
                <GlassPanel className="p-4 sm:p-5 lg:h-full flex flex-col lg:min-h-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 shrink-0">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-white/50">Extracted</div>
                      <div className="text-sm text-white/80 mt-1 whitespace-nowrap">Highlight text to use tools</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedText ? (
                        <button
                          onClick={() => setSelectedText('')}
                          className="text-xs text-white/70 hover:text-white/90 transition"
                        >
                          Clear selection
                        </button>
                      ) : null}
                      <div className="text-xs text-white/55 whitespace-nowrap">
                        Page <span className="text-white/80">{Math.min(currentPageIndex + 1, Math.max(1, pages.length))}</span>
                        {' '}of <span className="text-white/80">{Math.max(1, pages.length)}</span>
                      </div>
                      <button
                        disabled={currentPageIndex <= 0}
                        onClick={() => {
                          const nextIdx = Math.max(0, currentPageIndex - 1)
                          setCurrentPageIndex(nextIdx)
                          resetToolState()
                        }}
                        className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80 hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Prev
                      </button>
                      <button
                        disabled={currentPageIndex >= pages.length - 1}
                        onClick={() => {
                          const nextIdx = Math.min(Math.max(0, pages.length - 1), currentPageIndex + 1)
                          setCurrentPageIndex(nextIdx)
                          resetToolState()
                        }}
                        className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80 hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>

                  {/* Scrollable extracted content that fills remaining height */}
                  <div className="flex-1 lg:min-h-0 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-4">
                    <MarkdownViewer markdown={currentPageMarkdown} onTextSelected={handleTextSelected} />
                  </div>

                  <div className="mt-4 flex flex-col gap-3 shrink-0">
                    <div className="text-xs text-white/55">
                      Selected:{' '}
                      <span className="text-white/80">
                        {selectedText ? `${selectedText.substring(0, 80)}...` : '—'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <button
                        disabled={!canUseTools}
                        onClick={() => {
                          if (!canUseTools) return
                          setActiveTool('simplify')
                          setSimplifyRequestId((x) => x + 1)
                        }}
                        className="rounded-xl bg-emerald-500/90 hover:bg-emerald-500 text-white font-semibold px-4 py-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Simplify
                      </button>
                      <button
                        disabled={!canUseTools}
                        onClick={() => {
                          if (!canUseTools) return
                          setActiveTool('explain')
                          setExplainRequestId((x) => x + 1)
                        }}
                        className="rounded-xl bg-cyan-500/90 hover:bg-cyan-500 text-white font-semibold px-4 py-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Explain
                      </button>
                      <button
                        disabled={!canUseTools}
                        onClick={() => {
                          if (!canUseTools) return
                          setActiveTool('tree')
                          setKnowledgeTreeRequestId((x) => x + 1)
                        }}
                        className="rounded-xl bg-fuchsia-500/90 hover:bg-fuchsia-500 text-white font-semibold px-4 py-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Knowledge Tree
                      </button>
                    </div>
                  </div>
                </GlassPanel>
              </div>

              {/* Output (right column bottom on desktop; third on mobile) */}
              <div className="order-3 lg:order-3 lg:col-span-5 lg:row-start-2 lg:min-h-0">
                <GlassPanel className="p-4 sm:p-5 lg:h-full flex flex-col lg:min-h-0">
                  <div className="text-xs uppercase tracking-wider text-white/50 mb-2 shrink-0">Output</div>
                  <div className="flex-1 lg:min-h-0 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-4">
                    {!activeTool && (
                      <div className="text-white/60 text-sm py-10 text-center">
                        Choose a tool below the extracted content to see results here.
                      </div>
                    )}

                    {activeTool === 'simplify' && canUseTools && (
                      <SimplificationPanel text={selectedText} fullText={allPagesText} requestId={simplifyRequestId} />
                    )}
                    {activeTool === 'explain' && canUseTools && (
                      <ExplainPanel text={selectedText} fullText={allPagesText} requestId={explainRequestId} />
                    )}
                    {activeTool === 'tree' && canUseTools && (
                      <KnowledgeTreePanel text={selectedText} fullText={allPagesText} requestId={knowledgeTreeRequestId} />
                    )}
                  </div>
                </GlassPanel>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
