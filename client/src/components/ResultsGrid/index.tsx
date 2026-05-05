import type { ResultImage } from '../../types'

interface ResultsGridProps {
  results: ResultImage[]
  onRetry: (angle: string) => void
}

function StatusCard({ result, onRetry }: { result: ResultImage; onRetry: (a: string) => void }) {
  if (result.status === 'generating') {
    return (
      <div className="aspect-square rounded-xl bg-gray-100 flex flex-col items-center justify-center gap-3 p-4">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
        <div className="text-center space-y-1">
          <p className="text-xs font-semibold text-gray-600">{result.angle}</p>
          <p className="text-[10px] text-gray-400">Generating… usually 30–90 s</p>
        </div>
      </div>
    )
  }

  if (result.status === 'error') {
    return (
      <div className="aspect-square rounded-xl bg-red-50 border-2 border-red-100 flex flex-col items-center justify-center gap-2 p-4">
        <span className="text-2xl">⚠️</span>
        <p className="text-[11px] font-semibold text-gray-600 text-center">{result.angle}</p>
        <p className="text-[10px] text-red-500 text-center leading-tight">{result.errorMessage}</p>
        <button
          onClick={() => onRetry(result.angle)}
          className="mt-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700 underline underline-offset-2"
        >
          ↺ Retry this angle
        </button>
      </div>
    )
  }

  if (result.status === 'done' && result.base64) {
    return (
      <div className="rounded-xl overflow-hidden bg-gray-100 flex flex-col">
        <div className="relative flex-1 aspect-square">
          <img
            src={`data:${result.mimeType ?? 'image/jpeg'};base64,${result.base64}`}
            alt={result.angle}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="px-3 py-2">
          <p className="text-[11px] font-semibold text-gray-700 truncate">{result.angle}</p>
        </div>
      </div>
    )
  }

  // idle
  return (
    <div className="aspect-square rounded-xl bg-gray-100 flex items-center justify-center">
      <span className="text-gray-300 text-3xl">⏳</span>
    </div>
  )
}

export function ResultsGrid({ results, onRetry }: ResultsGridProps) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
        <div className="text-5xl text-gray-200">🖼️</div>
        <p className="text-base font-medium text-gray-400">Your generated images will appear here</p>
        <p className="text-sm text-gray-300">Upload photos, configure parameters, select 4 angles, then click Generate.</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4 w-full">
      <div className="grid grid-cols-2 gap-4">
        {results.map((r) => (
          <StatusCard key={r.angle} result={r} onRetry={onRetry} />
        ))}
      </div>
    </div>
  )
}
