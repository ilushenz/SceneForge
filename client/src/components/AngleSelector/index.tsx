import { useSessionStore } from '../../stores/sessionStore'

const ANGLES = [
  { name: 'Straight-on front view',      description: 'Eye level, facing the object head-on',              icon: '⬆' },
  { name: 'Slightly elevated front view', description: 'Raised 1.5× head height, gentle downward angle',   icon: '↖' },
  { name: 'Low ground-level view',        description: 'Knee height, looking slightly upward',             icon: '↓' },
  { name: '45° left front',              description: 'Eye level, diagonal from the front-left',           icon: '↖' },
  { name: '45° right front',             description: 'Eye level, diagonal from the front-right',          icon: '↗' },
  { name: 'Side view (left)',            description: 'Directly left, showing the full side profile',      icon: '◀' },
  { name: 'Side view (right)',           description: 'Directly right, showing the full side profile',     icon: '▶' },
  { name: '45° left rear',              description: 'Eye level, diagonal from behind and to the left',   icon: '↙' },
  { name: '45° right rear',             description: 'Eye level, diagonal from behind and to the right',  icon: '↘' },
  { name: 'Wide establishing shot',      description: 'Pulled back — object small in the full context',   icon: '⊞' },
  { name: "Aerial / bird's-eye",         description: 'Elevated, looking nearly straight down',           icon: '⊙' },
  { name: 'Close-up detail',             description: 'Very close — surface texture and material detail', icon: '◎' },
]

export function AngleSelector() {
  const { selectedAngle, setSelectedAngle } = useSessionStore()

  const toggle = (name: string) => {
    // Click the active angle again to deselect (back to auto)
    setSelectedAngle(selectedAngle === name ? null : name)
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-200">Viewing angle</h3>
        {selectedAngle ? (
          <button
            onClick={() => setSelectedAngle(null)}
            className="text-[10px] font-semibold text-gray-500 hover:text-gray-300 transition-colors"
          >
            Auto from photo
          </button>
        ) : (
          <span className="text-[10px] font-semibold text-blue-400">Auto from photo</span>
        )}
      </div>

      {/* Auto option */}
      <button
        type="button"
        onClick={() => setSelectedAngle(null)}
        className={`w-full text-left px-3 py-2.5 rounded-xl border-2 transition-all
          focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
          ${!selectedAngle
            ? 'border-blue-500 bg-blue-950/40'
            : 'border-gray-700 bg-gray-800 hover:border-gray-600'
          }`}
      >
        <div className="flex items-center gap-2">
          <span className={`text-base leading-none shrink-0 ${!selectedAngle ? 'text-blue-400' : 'text-gray-600'}`}>
            ✦
          </span>
          <div>
            <p className={`text-[11px] font-semibold leading-tight ${!selectedAngle ? 'text-blue-300' : 'text-gray-300'}`}>
              Auto — infer from space photo
            </p>
            <p className="text-[10px] leading-tight mt-0.5 text-gray-500">
              Gemini determines the best angle based on the scene
            </p>
          </div>
        </div>
      </button>

      <div className="grid grid-cols-2 gap-2">
        {ANGLES.map((angle) => {
          const selected = selectedAngle === angle.name
          return (
            <button
              key={angle.name}
              type="button"
              onClick={() => toggle(angle.name)}
              aria-pressed={selected}
              className={`text-left px-3 py-2.5 rounded-xl border-2 transition-all
                focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                ${selected
                  ? 'border-blue-500 bg-blue-950/40'
                  : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }`}
            >
              <div className="flex items-start gap-2">
                <span className={`text-base leading-none mt-0.5 shrink-0 ${selected ? 'text-blue-400' : 'text-gray-600'}`}>
                  {angle.icon}
                </span>
                <div>
                  <p className={`text-[11px] font-semibold leading-tight ${selected ? 'text-blue-300' : 'text-gray-300'}`}>
                    {angle.name}
                  </p>
                  <p className="text-[10px] leading-tight mt-0.5 text-gray-500">
                    {angle.description}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
