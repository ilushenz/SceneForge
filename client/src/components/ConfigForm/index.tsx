import { useRef, useEffect } from 'react'
import { useSessionStore } from '../../stores/sessionStore'
import type { ObjectType, ObjectSize, Placement, TimeOfDay, Weather } from '../../types'
import { RadioCardGroup } from './RadioCardGroup'

const MAX_NOTE = 500

const OBJECT_TYPE_OPTIONS = [
  { value: 'freestanding', label: 'Freestanding 3D object', description: 'Sculpture, furniture, standalone piece', icon: '🗿' },
  { value: 'flat',         label: 'Flat / wall-mounted',   description: 'Painting, panel, wall relief',         icon: '🖼️' },
]
const SIZE_OPTIONS = [
  { value: 'small',      label: 'Small',      description: '< 50 cm',       icon: '·' },
  { value: 'medium',     label: 'Medium',     description: '50 cm – 1.5 m', icon: '○' },
  { value: 'large',      label: 'Large',      description: '1.5 – 3 m',     icon: '◎' },
  { value: 'monumental', label: 'Monumental', description: '> 3 m',          icon: '⬤' },
  { value: 'custom',     label: 'Custom',     description: 'Describe below', icon: '✎' },
]
const PLACEMENT_OPTIONS = [
  { value: 'centre',     label: 'Centre',     icon: '⊕' },
  { value: 'left',       label: 'Left side',  icon: '◁' },
  { value: 'right',      label: 'Right side', icon: '▷' },
  { value: 'background', label: 'Background', icon: '↗' },
  { value: 'foreground', label: 'Foreground', icon: '↙' },
  { value: 'wall',       label: 'On a wall',  icon: '▬' },
]
const TIME_OPTIONS = [
  { value: 'dawn',        label: 'Dawn',        icon: '🌅' },
  { value: 'morning',     label: 'Morning',     icon: '🌤️' },
  { value: 'midday',      label: 'Midday',      icon: '☀️' },
  { value: 'golden hour', label: 'Golden hour', icon: '🌇' },
  { value: 'dusk',        label: 'Dusk',        icon: '🌆' },
  { value: 'overcast',    label: 'Overcast',    icon: '☁️' },
]
const WEATHER_OPTIONS = [
  { value: 'clear sky',     label: 'Clear sky',     icon: '🔵' },
  { value: 'partly cloudy', label: 'Partly cloudy', icon: '⛅' },
  { value: 'overcast',      label: 'Overcast',      icon: '🌫️' },
  { value: 'after rain',    label: 'After rain',    icon: '🌧️' },
]

export function ConfigForm() {
  const { params, setParam, annotation } = useSessionStore()
  const noteLen = params.freeNote.length
  const customSizeRef = useRef<HTMLInputElement>(null)

  // Placement is overridden whenever the user has drawn annotations on the space photo
  const placementOverridden = annotation.strokes.length > 0 || annotation.line !== null

  useEffect(() => {
    if (params.objectSize === 'custom') customSizeRef.current?.focus()
  }, [params.objectSize])

  return (
    <section className="space-y-5">
      <h3 className="text-sm font-semibold text-gray-200">Configure</h3>

      <RadioCardGroup label="Object type" options={OBJECT_TYPE_OPTIONS} value={params.objectType}
        onChange={(v) => setParam('objectType', v as ObjectType)} columns={2} />

      <div className="space-y-2">
        <RadioCardGroup label="Object size" options={SIZE_OPTIONS} value={params.objectSize}
          onChange={(v) => setParam('objectSize', v as ObjectSize)} columns={4} />
        {params.objectSize === 'custom' && (
          <input
            ref={customSizeRef}
            type="text"
            maxLength={120}
            placeholder="e.g. 80 cm tall, about knee height"
            value={params.customSizeDescription}
            onChange={(e) => setParam('customSizeDescription', e.target.value)}
            className="w-full text-sm rounded-xl border-2 border-blue-500 bg-blue-950/30 text-gray-200
              px-3 py-2 placeholder:text-gray-600 focus:outline-none focus:border-blue-400 transition-colors"
          />
        )}
      </div>

      <RadioCardGroup
        label="Placement"
        options={PLACEMENT_OPTIONS}
        value={params.placement}
        onChange={(v) => setParam('placement', v as Placement)}
        columns={3}
        disabled={placementOverridden}
        disabledNote="set by annotation"
      />

      <RadioCardGroup label="Time of day" options={TIME_OPTIONS} value={params.timeOfDay}
        onChange={(v) => setParam('timeOfDay', v as TimeOfDay)} columns={3} />

      <RadioCardGroup label="Weather" options={WEATHER_OPTIONS} value={params.weather}
        onChange={(v) => setParam('weather', v as Weather)} columns={4} />

      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Additional note</p>
        <textarea
          rows={3}
          maxLength={MAX_NOTE}
          placeholder="Anything else? e.g. 'keep the existing furniture visible'"
          value={params.freeNote}
          onChange={(e) => setParam('freeNote', e.target.value)}
          className="w-full text-sm rounded-xl border-2 border-gray-700 bg-gray-800 text-gray-200
            px-3 py-2.5 resize-none placeholder:text-gray-600 focus:outline-none
            focus:border-blue-500 transition-colors"
        />
        <p className={`text-right text-[10px] ${noteLen >= MAX_NOTE ? 'text-red-400' : 'text-gray-600'}`}>
          {noteLen} / {MAX_NOTE}
        </p>
      </div>
    </section>
  )
}
