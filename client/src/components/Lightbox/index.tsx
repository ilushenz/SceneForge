import { useEffect } from 'react'

interface LightboxProps {
  src: string
  mimeType: string
  angle: string
  onClose: () => void
}

/** Full-screen image overlay. Closes on Escape or click outside the image. */
export function Lightbox({ src, mimeType, angle, onClose }: LightboxProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Full size view: ${angle}`}
    >
      {/* Clicking the image itself shouldn't close */}
      <div className="relative max-w-full max-h-full flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
        <img
          src={`data:${mimeType};base64,${src}`}
          alt={angle}
          className="max-w-[90vw] max-h-[85vh] rounded-xl object-contain shadow-2xl"
        />
        <p className="text-sm text-gray-400 font-medium">{angle}</p>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full
          bg-white/10 hover:bg-white/20 text-white text-xl transition-colors"
      >
        ×
      </button>
    </div>
  )
}
