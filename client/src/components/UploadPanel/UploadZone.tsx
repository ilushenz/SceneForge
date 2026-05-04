import { useRef, useState, useCallback } from 'react'

interface UploadZoneProps {
  label: string
  hint: string
  imageBase64: string | null
  imageName: string | null
  onUpload: (base64: string, name: string) => void
  onRemove: () => void
}

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png']

/** Converts a File to a base64 data URL string. */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function UploadZone({ label, hint, imageBase64, imageName, onUpload, onRemove }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processFile = useCallback(async (file: File) => {
    setError(null)

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Only JPG and PNG files are accepted.')
      return
    }

    if (file.size > MAX_SIZE_BYTES) {
      const mb = (file.size / (1024 * 1024)).toFixed(1)
      setError(`This photo is ${mb} MB. Please use a photo under 10 MB.`)
      return
    }

    const base64 = await fileToBase64(file)
    onUpload(base64, file.name)
  }, [onUpload])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    // Reset so the same file can be re-selected after removal
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = () => setDragging(false)

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setError(null)
    onRemove()
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-500">{label}</p>

      <div
        role="button"
        tabIndex={0}
        aria-label={`Upload ${label}`}
        onClick={() => !imageBase64 && inputRef.current?.click()}
        onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !imageBase64) inputRef.current?.click() }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative rounded-xl border-2 transition-all cursor-pointer select-none overflow-hidden
          ${imageBase64
            ? 'border-brand-500 bg-brand-50 cursor-default'
            : dragging
              ? 'border-brand-500 bg-brand-50'
              : 'border-dashed border-gray-200 bg-gray-50 hover:border-brand-400 hover:bg-brand-50'
          }`}
      >
        {imageBase64 ? (
          /* Preview state */
          <div className="flex items-center gap-3 p-3">
            <img
              src={imageBase64}
              alt={imageName ?? label}
              className="w-16 h-16 object-cover rounded-lg shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-700 truncate">{imageName}</p>
              <p className="text-xs text-green-600 mt-0.5">✓ Ready</p>
            </div>
            <button
              onClick={handleRemove}
              aria-label={`Remove ${label}`}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors text-lg leading-none"
            >
              ×
            </button>
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center gap-1.5 py-6 px-4 text-center">
            <div className="text-2xl text-gray-300">📷</div>
            <p className="text-sm font-medium text-gray-500">Drag photo here or click to browse</p>
            <p className="text-xs text-gray-400">{hint}</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 px-1">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handleFileChange}
        aria-hidden="true"
      />
    </div>
  )
}
