import { useSessionStore } from './stores/sessionStore'
import { UploadPanel } from './components/UploadPanel'
import { ConfigForm } from './components/ConfigForm'
import { AngleSelector } from './components/AngleSelector'

export default function App() {
  const { selectedAngles, spaceImageBase64, objectImageBase64 } = useSessionStore()

  const canGenerate =
    spaceImageBase64 !== null &&
    objectImageBase64 !== null &&
    selectedAngles.length === 4

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
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — Upload & Configure */}
        <aside className="w-full md:w-96 lg:w-[420px] shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
          <div className="p-5 space-y-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Upload &amp; Configure
            </h2>

            <UploadPanel />

            <ConfigForm />

            <AngleSelector />

            {/* Generate button */}
            <button
              disabled={!canGenerate}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                canGenerate
                  ? 'bg-brand-500 text-white hover:bg-brand-600 shadow-sm'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Generate
            </button>
          </div>
        </aside>

        {/* Right panel — Results */}
        <main className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
          <div className="text-center text-gray-400 max-w-xs space-y-3">
            <div className="text-5xl">🖼️</div>
            <p className="text-base font-medium text-gray-500">
              Your generated images will appear here
            </p>
            <p className="text-sm text-gray-400">
              Upload photos, configure parameters, select 4 angles, then click Generate.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
