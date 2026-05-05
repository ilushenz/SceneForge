interface Option {
  value: string
  label: string
  description?: string
  icon?: string
}

interface RadioCardGroupProps {
  label: string
  options: Option[]
  value: string
  onChange: (value: string) => void
  columns?: 2 | 3 | 4 | 6
}

export function RadioCardGroup({ label, options, value, onChange, columns = 2 }: RadioCardGroupProps) {
  const gridClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
    6: 'grid-cols-3',
  }[columns]

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500">{label}</p>
      <div className={`grid ${gridClass} gap-2`}>
        {options.map((opt) => {
          const selected = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.value)}
              className={`text-left px-3 py-2.5 rounded-xl border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                ${selected
                  ? 'border-blue-500 bg-blue-950/40 text-blue-300'
                  : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600 hover:bg-gray-750'
                }`}
            >
              {opt.icon && <span className="block text-base mb-0.5 leading-none">{opt.icon}</span>}
              <span className="block text-xs font-semibold leading-tight">{opt.label}</span>
              {opt.description && (
                <span className="block text-[10px] leading-tight mt-0.5 text-gray-500">{opt.description}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
