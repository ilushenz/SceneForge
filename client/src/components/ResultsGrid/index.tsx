import { useState, useRef } from 'react'
import JSZip from 'jszip'
import type { ResultImage } from '../../types'
import { Lightbox } from '../Lightbox'

interface ResultsGridProps {
  results: ResultImage[]
  onRetry: (angle: string) => void
}

/** Converts an angle name to a safe filename slug. */
function toFilename(angle: string): string {
  return 'sceneforge-' + angle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/** Triggers a browser download of a single base64 image as JPEG. */
function downloadImage(base64: string, mimeType: string, angle: string) {
  const link = document.createElement('a')
  link.href = `data:${mimeType};base64,${base64}`
  link.download = `${toFilename(angle)}.jpg`
  link.click()
}

/** Packages all done images into a ZIP and triggers a download. */
async function downloadZip(results: ResultImage[]) {
  const done = results.filter((r) => r.status === 'done' && r.base64)
  if (done.length === 0) return

  const zip = new JSZip()
  for (const r of done) {
    const bytes = Uint8Array.from(atob(r.base64!), (c) => c.charCodeAt(0))
    zip.file(`${toFilename(r.angle)}.jpg`, bytes)
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'sceneforge-results.zip'
  link.click()
  URL.revokeObjectURL(link.href)
}

const RETRY_COOLDOWN_MS = 60_000 // 1 minute — respects the 2 RPM free-tier limit

function ImageCard({
  result,
  onRetry,
  onOpen,
}: {
  result: ResultImage
  onRetry: (a: string) => void
  onOpen: (r: ResultImage) => void
}) {
  const lastRetry = useRef<number>(0)
  const [cooldown, setCooldown] = useState(0) // seconds remaining

  const handleRetry = () => {
    const elapsed = Date.now() - lastRetry.current
    const remaining = Math.ceil((RETRY_COOLDOWN_MS - elapsed) / 1000)
    if (remaining > 0) { setCooldown(remaining); return }
    lastRetry.current = Date.now()
    onRetry(result.angle)
    // Count down the display
    let secs = Math.ceil(RETRY_COOLDOWN_MS / 1000)
    setCooldown(secs)
    const iv = setInterval(() => {
      secs -= 1
      setCooldown(secs)
      if (secs <= 0) clearInterval(iv)
    }, 1000)
  }
  if (result.status === 'generating') {
    return (
      <div className="aspect-square rounded-xl bg-gray-800 border border-gray-700 flex flex-col items-center justify-center gap-3 p-4">
        <div className="w-8 h-8 border-4 border-blue-900 border-t-blue-500 rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-xs font-semibold text-gray-300">{result.angle}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Generating… usually 30–90 s</p>
        </div>
      </div>
    )
  }

  if (result.status === 'retrying') {
    return (
      <div className="aspect-square rounded-xl bg-amber-950/30 border border-amber-800/50 flex flex-col items-center justify-center gap-3 p-4">
        <div className="w-8 h-8 border-4 border-amber-900 border-t-amber-500 rounded-full animate-spin" />
        <div className="text-center">
          <p className="text-xs font-semibold text-gray-300">{result.angle}</p>
          <p className="text-[10px] text-amber-400 mt-0.5 leading-tight">{result.errorMessage}</p>
        </div>
      </div>
    )
  }

  if (result.status === 'error') {
    return (
      <div className="aspect-square rounded-xl bg-red-950/30 border-2 border-red-900/50 flex flex-col items-center justify-center gap-2 p-4">
        <span className="text-2xl">⚠️</span>
        <p className="text-[11px] font-semibold text-gray-300 text-center">{result.angle}</p>
        <p className="text-[10px] text-red-400 text-center leading-tight line-clamp-3">{result.errorMessage}</p>
        <button
          onClick={handleRetry}
          disabled={cooldown > 0}
          className="mt-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-2 disabled:text-gray-600 disabled:no-underline disabled:cursor-not-allowed"
        >
          {cooldown > 0 ? `Wait ${cooldown}s before retrying` : '↺ Retry this angle'}
        </button>
      </div>
    )
  }

  if (result.status === 'done' && result.base64) {
    return (
      <div className="rounded-xl overflow-hidden bg-gray-800 border border-gray-700 flex flex-col animate-fadeIn">
        {/* Clickable image */}
        <button
          className="relative aspect-square overflow-hidden cursor-zoom-in group"
          onClick={() => onOpen(result)}
          aria-label={`View ${result.angle} full size`}
        >
          <img
            src={`data:${result.mimeType ?? 'image/jpeg'};base64,${result.base64}`}
            alt={result.angle}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-2xl">⤢</span>
          </div>
        </button>

        {/* Label + download */}
        <div className="px-3 py-2 border-t border-gray-700 flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold text-gray-400 truncate">{result.angle}</p>
          <button
            onClick={() => downloadImage(result.base64!, result.mimeType ?? 'image/jpeg', result.angle)}
            aria-label={`Download ${result.angle}`}
            className="shrink-0 text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            ↓ Save
          </button>
        </div>
      </div>
    )
  }

  // idle — queued, waiting its turn
  return (
    <div className="aspect-square rounded-xl bg-gray-800 border border-gray-700 flex flex-col items-center justify-center gap-2 p-4">
      <span className="text-gray-600 text-2xl">⏳</span>
      <div className="text-center">
        <p className="text-[11px] font-semibold text-gray-500">{result.angle}</p>
        <p className="text-[10px] text-gray-600 mt-0.5">Queued — starts in ~35 s</p>
      </div>
    </div>
  )
}

export function ResultsGrid({ results, onRetry }: ResultsGridProps) {
  const [lightbox, setLightbox] = useState<ResultImage | null>(null)

  const doneCount = results.filter((r) => r.status === 'done' && r.base64).length

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8 min-h-[400px]">
        <div className="text-5xl opacity-20">🖼️</div>
        <p className="text-base font-medium text-gray-500">Your generated images will appear here</p>
        <p className="text-sm text-gray-600">Upload photos, configure parameters, select 4 angles, then click Generate.</p>
      </div>
    )
  }

  return (
    <>
      <div className="p-6 space-y-4 w-full">
        <div className="grid grid-cols-2 gap-4">
          {results.map((r) => (
            <ImageCard
              key={r.angle}
              result={r}
              onRetry={onRetry}
              onOpen={setLightbox}
            />
          ))}
        </div>

        {/* Download all button — only shown when at least one image is done */}
        {doneCount > 0 && (
          <button
            onClick={() => downloadZip(results)}
            className="w-full py-2.5 rounded-xl border border-gray-700 text-sm font-semibold
              text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            ↓ Download all as ZIP ({doneCount} image{doneCount !== 1 ? 's' : ''})
          </button>
        )}
      </div>

      {lightbox?.base64 && (
        <Lightbox
          src={lightbox.base64}
          mimeType={lightbox.mimeType ?? 'image/jpeg'}
          angle={lightbox.angle}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  )
}
