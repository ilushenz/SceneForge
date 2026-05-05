import { useState, useCallback } from 'react'
import { useSessionStore } from './stores/sessionStore'
import { UploadPanel } from './components/UploadPanel'
import { ConfigForm } from './components/ConfigForm'
import { AngleSelector } from './components/AngleSelector'
import { ResultsGrid } from './components/ResultsGrid'
import type { ResultImage } from './types'

/** Calls POST /api/generate/single for one angle and returns the result. */
async function generateOne(
  spaceImageBase64: string,
  objectImageBase64: string,
  params: object,
  angle: string,
): Promise<{ base64: string; mimeType: string }> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 130_000)

  try {
    const res = await fetch('/api/generate/single', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spaceImageBase64, objectImageBase64, params, angle }),
      signal: controller.signal,
    })

    const data = await res.json() as { base64?: string; mimeType?: string; message?: string }

    if (!res.ok) {
      throw new Error(data.message ?? `Server error ${res.status}`)
    }

    if (!data.base64) throw new Error('No image returned from server.')
    return { base64: data.base64, mimeType: data.mimeType ?? 'image/jpeg' }
  } finally {
    clearTimeout(timeout)
  }
}

export default function App() {
  const {
    selectedAngles,
    spaceImageBase64,
    objectImageBase64,
    params,
    results,
    setResults,
    updateResult,
  } = useSessionStore()

  const [generating, setGenerating] = useState(false)

  const canGenerate =
    spaceImageBase64 !== null &&
    objectImageBase64 !== null &&
    selectedAngles.length === 4

  /** Runs generation for a list of angles concurrently, updating each slot as it resolves. */
  const runGeneration = useCallback(async (angles: string[]) => {
    if (!spaceImageBase64 || !objectImageBase64) return

    setGenerating(true)

    // Initialise all slots as 'generating'
    const initial: ResultImage[] = angles.map((angle) => ({ angle, status: 'generating' }))
    setResults(initial)

    await Promise.all(
      angles.map(async (angle) => {
        try {
          const { base64, mimeType } = await generateOne(
            spaceImageBase64,
            objectImageBase64,
            params,
            angle,
          )
          updateResult(angle, { status: 'done', base64, mimeType })
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Generation failed.'
          updateResult(angle, { status: 'error', errorMessage: message })
        }
      }),
    )

    setGenerating(false)
  }, [spaceImageBase64, objectImageBase64, params, setResults, updateResult])

  const handleGenerate = () => {
    if (!generating && canGenerate) runGeneration(selectedAngles)
  }

  const handleRetry = (angle: string) => {
    if (!spaceImageBase64 || !objectImageBase64) return
    updateResult(angle, { status: 'generating', base64: undefined, errorMessage: undefined })
    generateOne(spaceImageBase64, objectImageBase64, params, angle)
      .then(({ base64, mimeType }) => updateResult(angle, { status: 'done', base64, mimeType }))
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Generation failed.'
        updateResult(angle, { status: 'error', errorMessage: message })
      })
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-gray-900">SceneForge</span>
          <span className="hidden sm:inline text-xs text-gray-400 font-medium uppercase tracking-wider ml-2">
            AI Scene Compositor
          </span>
        </div>
        <button
          aria-label="Help"
          className="text-sm text-gray-500 hover:text-gray-800 px-3 py-1 rounded-md border border-gray-200 hover:border-gray-300 transition-colors"
        >
          ? Help
        </button>
      </header>

      {/* Two-panel body */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Left panel — Upload & Configure */}
        <aside className="w-full md:w-96 lg:w-[420px] shrink-0 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex flex-col overflow-y-auto">
          <div className="p-5 space-y-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Upload &amp; Configure
            </h2>

            <UploadPanel />
            <ConfigForm />
            <AngleSelector />

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={!canGenerate || generating}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all relative ${
                canGenerate && !generating
                  ? 'bg-brand-500 text-white hover:bg-brand-600 shadow-sm'
                  : generating
                    ? 'bg-brand-400 text-white cursor-not-allowed'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Generating…
                </span>
              ) : (
                'Generate'
              )}
            </button>
          </div>
        </aside>

        {/* Right panel — Results */}
        <main className="flex-1 overflow-y-auto flex items-start justify-center">
          <ResultsGrid results={results} onRetry={handleRetry} />
        </main>
      </div>
    </div>
  )
}
