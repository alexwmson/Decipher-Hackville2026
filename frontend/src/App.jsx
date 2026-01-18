import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import MarkdownViewer from './components/MarkdownViewer'
import SimplificationPanel from './components/SimplificationPanel'
import KnowledgeTreePanel from './components/KnowledgeTreePanel'
import ExplainPanel from './components/ExplainPanel'
import ImageSourcePicker from './components/ImageSourcePicker'
import GlassPanel from './components/ui/GlassPanel'
import LoadingOverlay from './components/ui/LoadingOverlay'

function App() {
  const [view, setView] = useState('landing') // 'landing' | 'main'
  const [markdown, setMarkdown] = useState('')
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

      const resp = await axios.post('/api/ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const md = resp.data.blocksMarkdown || resp.data.markdown || ''
      setMarkdown(md)
      setView('main')
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to process image')
    } finally {
      setProcessing(false)
    }
  }

  const canUseTools = useMemo(() => selectedText && selectedText.trim().length > 0, [selectedText])

  const Brand = (
    <div>
      <div className="inline-flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.65)]" />
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Decipher</h1>
      </div>
      <p className="text-white/60 text-sm mt-2">Space-grade readability for tough textbook pages.</p>
    </div>
  )

  return (
    <div className="h-dvh overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 py-6 h-full flex flex-col">
        {view === 'main' && (
          <header className="flex items-center justify-between mb-4 shrink-0">
            {Brand}
            <button
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition"
              onClick={() => {
                setView('landing')
                setMarkdown('')
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

        <main className="flex-1 min-h-0">
          {view === 'landing' ? (
            <div
              className={`grid grid-cols-1 ${imageUrl ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-4 items-stretch h-full`}
            >
              <div className="lg:h-full lg:min-h-0 lg:flex lg:flex-col lg:justify-center">
                <div className="mb-4 lg:mb-6">{Brand}</div>
                <GlassPanel className="relative p-6 sm:p-7 w-full">
                  <div className="mb-5">
                    <h2 className="text-xl sm:text-2xl font-bold text-white/95">
                      Upload a page. Get clarity.
                    </h2>
                    <p className="text-white/60 text-sm mt-2">
                      Take a photo or upload an image. We’ll extract text + math and format it for reading.
                    </p>
                  </div>

                  <ImageSourcePicker disabled={processing} onPick={uploadToOcr} />

                  {error && (
                    <div className="mt-4 text-sm text-red-200 bg-red-500/10 border border-red-400/20 rounded-xl px-3 py-2">
                      {error}
                    </div>
                  )}

                  <LoadingOverlay show={processing} label="Processing..." />
                </GlassPanel>
              </div>

              {imageUrl ? (
                <GlassPanel className="relative p-6 sm:p-7 overflow-hidden flex flex-col">
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full min-h-0">
              {/* Left column: extracted (gets the most vertical room) */}
              <div className="lg:col-span-7 min-h-0">
                <GlassPanel className="p-5 h-full flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-3 shrink-0">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-white/50">Extracted</div>
                      <div className="text-sm text-white/80 mt-1">Highlight text to use tools</div>
                    </div>
                    {selectedText ? (
                      <button
                        onClick={() => setSelectedText('')}
                        className="text-xs text-white/70 hover:text-white/90 transition"
                      >
                        Clear selection
                      </button>
                    ) : null}
                  </div>

                  {/* Scrollable extracted content that fills remaining height */}
                  <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-4">
                    <MarkdownViewer markdown={markdown} onTextSelected={handleTextSelected} />
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

              {/* Right column: input (top) + output (bottom) */}
              <div className="lg:col-span-5 min-h-0 flex flex-col gap-4">
                <GlassPanel className="relative p-5 shrink-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-xs uppercase tracking-wider text-white/50">Input</div>
                      <div className="text-sm text-white/80 mt-1">Your textbook page</div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-5 gap-4 items-start">
                    <div className="sm:col-span-3">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt="Uploaded"
                          className="w-full max-h-[200px] object-contain rounded-xl border border-white/10 bg-black/20"
                        />
                      ) : (
                        <div className="h-[180px] rounded-xl border border-dashed border-white/15 bg-white/5" />
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <ImageSourcePicker disabled={processing} onPick={uploadToOcr} stackButtons />
                    </div>
                  </div>

                  {error && (
                    <div className="mt-4 text-sm text-red-200 bg-red-500/10 border border-red-400/20 rounded-xl px-3 py-2">
                      {error}
                    </div>
                  )}

                  <LoadingOverlay show={processing} label="Processing..." />
                </GlassPanel>

                <GlassPanel className="p-5 flex-1 min-h-0 flex flex-col">
                  <div className="text-xs uppercase tracking-wider text-white/50 mb-2 shrink-0">Output</div>
                  <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-4">
                    {!activeTool && (
                      <div className="text-white/60 text-sm py-10 text-center">
                        Choose a tool below the extracted content to see results here.
                      </div>
                    )}

                    {activeTool === 'simplify' && canUseTools && (
                      <SimplificationPanel text={selectedText} requestId={simplifyRequestId} />
                    )}
                    {activeTool === 'explain' && canUseTools && (
                      <ExplainPanel text={selectedText} requestId={explainRequestId} />
                    )}
                    {activeTool === 'tree' && canUseTools && (
                      <KnowledgeTreePanel text={selectedText} requestId={knowledgeTreeRequestId} />
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
