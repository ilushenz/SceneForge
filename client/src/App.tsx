import { useState, useCallback } from 'react'
import { useSessionStore } from './stores/sessionStore'
import { UploadPanel } from './components/UploadPanel'
import { ConfigForm } from './components/ConfigForm'
import { AngleSelector } from './components/AngleSelector'
import { ObjectRotationControl } from './components/ObjectRotationControl'
import { ResultsGrid } from './components/ResultsGrid'
import { compositeAnnotatedImage, getAnnotationDescription } from './utils/compositeImage'

const RATE_LIMIT_WAIT_MS = 62_000
const MAX_AUTO_RETRIES = 3

/** Calls the generate endpoint, auto-retrying up to MAX_AUTO_RETRIES times on rate-limit errors. */
async function generateWithRetry(
  spaceImageBase64: string,
  objectImageBase64: string,
  params: object,
  angle: string | null,
  onRateLimited: (retriesLeft: number, waitSecs: number) => void,
  annotationDescription?: string,
  objectRotationDegrees?: number,
): Promise<{ base64: string; mimeType: string }> {
  for (let attempt = 0; attempt <= MAX_AUTO_RETRIES; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 210_000)  // 3.5 min
    try {
      const res = await fetch('/api/generate/single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spaceImageBase64,
          objectImageBase64,
          params,
          angle,
          annotationDescription,
          objectRotationDegrees,
        }),
        signal: controller.signal,
      })
      const data = await res.json() as { base64?: string; mimeType?: string; message?: string; error?: string }

      if ((res.status === 429 || data.error === 'RATE_LIMIT') && attempt < MAX_AUTO_RETRIES) {
        const retriesLeft = MAX_AUTO_RETRIES - attempt
        onRateLimited(retriesLeft, Math.ceil(RATE_LIMIT_WAIT_MS / 1000))
        await new Promise((r) => setTimeout(r, RATE_LIMIT_WAIT_MS))
        continue
      }

      if (!res.ok) throw new Error(data.message ?? `Server error ${res.status}`)
      if (!data.base64) throw new Error('No image returned from server.')
      return { base64: data.base64, mimeType: data.mimeType ?? 'image/jpeg' }
    } finally {
      clearTimeout(timeout)
    }
  }
  throw new Error('Rate limit persists after retries. Wait a few minutes and try again.')
}


export default function App() {
  const {
    selectedAngle, spaceImageBase64, objectImageBase64,
    params, results, setResults, updateResult,
    annotation, objectRotation, setObjectRotation,
  } = useSessionStore()
  const [generating, setGenerating] = useState(false)

  const canGenerate = spaceImageBase64 !== null && objectImageBase64 !== null

  const runGeneration = useCallback(async () => {
    if (!spaceImageBase64 || !objectImageBase64) return
    setGenerating(true)

    const composedSpaceImage = await compositeAnnotatedImage(spaceImageBase64, annotation)
    const annotationDescription = getAnnotationDescription(annotation) ?? undefined
    const rotationArg = objectRotation !== null ? objectRotation : undefined

    setResults([{ angle: selectedAngle ?? 'Auto', status: 'generating' }])

    try {
      const { base64, mimeType } = await generateWithRetry(
        composedSpaceImage,
        objectImageBase64,
        params,
        selectedAngle,
        (retriesLeft, waitSecs) => updateResult(selectedAngle ?? 'Auto', {
          status: 'retrying',
          errorMessage: `Rate limited — auto-retrying in ${waitSecs}s (${retriesLeft} attempt${retriesLeft !== 1 ? 's' : ''} left)`,
        }),
        annotationDescription,
        rotationArg,
      )
      updateResult(selectedAngle ?? 'Auto', { status: 'done', base64, mimeType })
    } catch (err) {
      updateResult(selectedAngle ?? 'Auto', {
        status: 'error',
        errorMessage: err instanceof Error ? err.message : 'Generation failed.',
      })
    }

    setGenerating(false)
  }, [spaceImageBase64, objectImageBase64, params, selectedAngle, annotation, objectRotation, setResults, updateResult])

  const handleRetry = (angle: string) => {
    if (!spaceImageBase64 || !objectImageBase64) return
    updateResult(angle, { status: 'generating', base64: undefined, errorMessage: undefined })
    const annotationDescription = getAnnotationDescription(annotation) ?? undefined
    const rotationArg = objectRotation !== null ? objectRotation : undefined
    compositeAnnotatedImage(spaceImageBase64, annotation)
      .then((composedSpaceImage) =>
        generateWithRetry(
          composedSpaceImage,
          objectImageBase64,
          params,
          selectedAngle,
          (retriesLeft, waitSecs) => updateResult(angle, {
            status: 'retrying',
            errorMessage: `Rate limited — auto-retrying in ${waitSecs}s (${retriesLeft} attempt${retriesLeft !== 1 ? 's' : ''} left)`,
          }),
          annotationDescription,
          rotationArg,
        )
      )
      .then(({ base64, mimeType }) => updateResult(angle, { status: 'done', base64, mimeType }))
      .catch((err) => updateResult(angle, { status: 'error', errorMessage: err instanceof Error ? err.message : 'Generation failed.' }))
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">SceneForge</span>
          <span className="hidden sm:inline text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider ml-2">
            AI Scene Compositor
          </span>
        </div>
        <button
          aria-label="Help"
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 px-3 py-1 rounded-md border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
        >
          ? Help
        </button>
      </header>

      {/* Two-panel body */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Left panel */}
        <aside className="w-full md:w-96 lg:w-[420px] shrink-0 bg-white dark:bg-gray-900 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-y-auto">
          <div className="p-5 space-y-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              Upload &amp; Configure
            </h2>
            <UploadPanel />
            <ObjectRotationControl value={objectRotation} onChange={setObjectRotation} />
            <ConfigForm />
            <AngleSelector />

            <button
              onClick={() => { if (!generating && canGenerate) runGeneration() }}
              disabled={!canGenerate || generating}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                canGenerate && !generating
                  ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-sm'
                  : generating
                    ? 'bg-blue-700 text-white cursor-not-allowed opacity-80'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
              }`}
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Generating…
                </span>
              ) : 'Generate'}
            </button>
          </div>
        </aside>

        {/* Right panel */}
        <main className="flex-1 overflow-y-auto flex items-start justify-center bg-gray-50 dark:bg-gray-950">
          <ResultsGrid results={results} onRetry={handleRetry} />
        </main>
      </div>
    </div>
  )
}
