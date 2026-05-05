import { useSessionStore } from '../../stores/sessionStore'

const ANGLES: { name: string; description: string; icon: string }[] = [
  { name: 'Straight-on front view',      description: 'Eye level, facing the object head-on',                    icon: '⬆' },
  { name: 'Slightly elevated front view', description: 'Raised 1.5× head height, gentle downward angle',         icon: '↖' },
  { name: 'Low ground-level view',        description: 'Knee height, looking slightly upward',                   icon: '↓' },
  { name: '45° left front',              description: 'Eye level, diagonal from the front-left',                 icon: '↖' },
  { name: '45° right front',             description: 'Eye level, diagonal from the front-right',                icon: '↗' },
  { name: 'Side view (left)',            description: 'Directly left, showing the full side profile',            icon: '◀' },
  { name: 'Side view (right)',           description: 'Directly right, showing the full side profile',           icon: '▶' },
  { name: '45° left rear',              description: 'Eye level, diagonal from behind and to the left',          icon: '↙' },
  { name: '45° right rear',             description: 'Eye level, diagonal from behind and to the right',         icon: '↘' },
  { name: 'Wide establishing shot',      description: 'Pulled back — object small in the full context of space', icon: '⊞' },
  { name: "Aerial / bird's-eye",         description: 'Elevated, looking nearly straight down',                  icon: '⊙' },
  { name: 'Close-up detail',             description: 'Very close — surface texture and material detail',        icon: '◎' },
]

const MAX_SELECTED = 4

export function AngleSelector() {
  const { selectedAngles, setSelectedAngles } = useSessionStore()

  const toggle = (name: string) => {
    if (selectedAngles.includes(name)) {
      // Deselect
      setSelectedAngles(selectedAngles.filter((a) => a !== name))
    } else if (selectedAngles.length < MAX_SELECTED) {
      setSelectedAngles([...selectedAngles, name])
    } else {
      // Already at 4 — drop the oldest, add the new one
      setSelectedAngles([...selectedAngles.slice(1), name])
    }
  }

  const count = selectedAngles.length
  const exact = count === MAX_SELECTED

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Select Angles</h3>
        <span className={`text-xs font-semibold tabular-nums ${exact ? 'text-green-600' : 'text-red-400'}`}>
          {count} of {MAX_SELECTED} selected
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {ANGLES.map((angle) => {
          const selected = selectedAngles.includes(angle.name)
          return (
            <button
              key={angle.name}
              type="button"
              onClick={() => toggle(angle.name)}
              aria-pressed={selected}
              className={`text-left px-3 py-2.5 rounded-xl border-2 transition-all
                focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500
                ${selected
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
            >
              <div className="flex items-start gap-2">
                <span className={`text-base leading-none mt-0.5 shrink-0 ${selected ? 'text-brand-500' : 'text-gray-300'}`}>
                  {angle.icon}
                </span>
                <div>
                  <p className={`text-[11px] font-semibold leading-tight ${selected ? 'text-brand-700' : 'text-gray-700'}`}>
                    {angle.name}
                  </p>
                  <p className="text-[10px] leading-tight mt-0.5 text-gray-400">
                    {angle.description}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {count === 0 && (
        <p className="text-[11px] text-gray-400 text-center pt-1">
          Select exactly 4 angles to enable generation
        </p>
      )}
    </section>
  )
}
