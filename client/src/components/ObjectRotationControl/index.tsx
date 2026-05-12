/**
 * ObjectRotationControl
 *
 * An optional control that lets the user specify how many degrees clockwise
 * the object should be rotated around its vertical axis before being placed
 * in the scene, relative to its orientation in the reference photo.
 *
 * Visual: a CSS 3D box that rotates in real-time as the user drags, plus
 * a degree readout and a circular drag handle track.
 */

import { useCallback, useRef } from 'react'

// ── Box dimensions ────────────────────────────────────────────────────────────
const W = 52   // width  (px)
const H = 84   // height (px)
const D = 30   // depth  (px)

// ── Face colours (dark theme) ─────────────────────────────────────────────────
const FRONT  = '#4B5563'   // gray-600
const SIDE   = '#374151'   // gray-700
const TOP    = '#6B7280'   // gray-500 (lighter — catches "light")
const BOTTOM = '#1F2937'   // gray-800

interface Props {
  /** Current rotation in degrees (0–359), or null if not set */
  value: number | null
  onChange: (degrees: number | null) => void
}

export function ObjectRotationControl({ value, onChange }: Props) {
  const enabled = value !== null
  const angle = value ?? 0

  // ── Drag state ──────────────────────────────────────────────────────────────
  const dragging = useRef(false)
  const dragStartX = useRef(0)
  const dragStartAngle = useRef(0)
  const dragAreaRef = useRef<HTMLDivElement>(null)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!enabled) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragging.current = true
    dragStartX.current = e.clientX
    dragStartAngle.current = angle
  }, [enabled, angle])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    const delta = e.clientX - dragStartX.current
    // 1.5 degrees per pixel — fast enough to cover 360° in ~240px drag
    const raw = dragStartAngle.current + delta * 1.5
    onChange(((Math.round(raw) % 360) + 360) % 360)
  }, [onChange])

  const onPointerUp = useCallback(() => { dragging.current = false }, [])

  // Touch equivalents
  const lastTouchX = useRef(0)
  const onTouchStart = (e: React.TouchEvent) => {
    if (!enabled) return
    dragging.current = true
    lastTouchX.current = e.touches[0].clientX
    dragStartAngle.current = angle
    dragStartX.current = e.touches[0].clientX
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return
    e.preventDefault()
    const delta = e.touches[0].clientX - dragStartX.current
    const raw = dragStartAngle.current + delta * 1.5
    onChange(((Math.round(raw) % 360) + 360) % 360)
  }
  const onTouchEnd = () => { dragging.current = false }

  // ── Circular dial ───────────────────────────────────────────────────────────
  // A small SVG arc that fills based on angle, with a draggable handle dot.
  const DIAL_R = 46          // radius of the dial arc (svg units)
  const CX = 54; const CY = 54   // centre of the dial SVG
  const dialAngleRad = ((angle - 90) * Math.PI) / 180  // -90 so 0° starts at top
  const handleX = CX + DIAL_R * Math.cos(dialAngleRad)
  const handleY = CY + DIAL_R * Math.sin(dialAngleRad)

  // Arc path from top (0°) to current angle
  function arcPath(degrees: number) {
    if (degrees <= 0) return ''
    if (degrees >= 360) {
      // Full circle
      return `M ${CX} ${CY - DIAL_R} A ${DIAL_R} ${DIAL_R} 0 1 1 ${CX - 0.01} ${CY - DIAL_R} Z`
    }
    const endRad = ((degrees - 90) * Math.PI) / 180
    const ex = CX + DIAL_R * Math.cos(endRad)
    const ey = CY + DIAL_R * Math.sin(endRad)
    const large = degrees > 180 ? 1 : 0
    return `M ${CX} ${CY - DIAL_R} A ${DIAL_R} ${DIAL_R} 0 ${large} 1 ${ex} ${ey}`
  }

  // SVG pointer events for the dial handle
  const dialDragging = useRef(false)
  const svgRef = useRef<SVGSVGElement>(null)

  const svgPointerDown = (e: React.PointerEvent<SVGCircleElement>) => {
    if (!enabled) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dialDragging.current = true
  }

  const svgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dialDragging.current || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    // SVG viewport is 108×108, but the element might be smaller — scale
    const scaleX = 108 / rect.width
    const scaleY = 108 / rect.height
    const dx = mx * scaleX - CX
    const dy = my * scaleY - CY
    const rad = Math.atan2(dy, dx)
    const deg = (((rad * 180) / Math.PI + 90) % 360 + 360) % 360
    onChange(Math.round(deg))
  }

  const svgPointerUp = () => { dialDragging.current = false }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Object rotation
        </p>
        <button
          onClick={() => onChange(enabled ? null : 0)}
          className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 transition-colors focus:outline-none
            ${enabled ? 'bg-blue-600 border-blue-600' : 'bg-gray-700 border-gray-700'}`}
          role="switch"
          aria-checked={enabled}
          title={enabled ? 'Disable rotation override' : 'Enable rotation override'}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform mt-px
              ${enabled ? 'translate-x-4' : 'translate-x-0.5'}`}
          />
        </button>
      </div>

      {/* Main control */}
      <div
        className={`rounded-xl border transition-all overflow-hidden
          ${enabled
            ? 'border-gray-700 bg-gray-800/60'
            : 'border-gray-800 bg-gray-800/20 opacity-50 pointer-events-none select-none'
          }`}
      >
        <div className="flex items-center gap-4 px-4 py-3">
          {/* CSS 3D Box */}
          <div
            ref={dragAreaRef}
            style={{ perspective: '240px', width: W + D, height: H + D / 2 + 8, flexShrink: 0 }}
            className={enabled ? 'cursor-ew-resize' : 'cursor-default'}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div
              style={{
                position: 'relative',
                width: W,
                height: H,
                transformStyle: 'preserve-3d',
                transform: `translateZ(${-D / 2}px) rotateX(-12deg) rotateY(${angle}deg)`,
                margin: `${D / 3}px 0 0 ${D / 2}px`,
                userSelect: 'none',
              }}
            >
              {/* Front face */}
              <div style={{
                position: 'absolute', width: W, height: H,
                background: FRONT,
                transform: `translateZ(${D / 2}px)`,
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {/* Forward arrow on front face */}
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 14V4M9 4L5 8M9 4L13 8" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              {/* Back face */}
              <div style={{
                position: 'absolute', width: W, height: H,
                background: SIDE,
                transform: `rotateY(180deg) translateZ(${D / 2}px)`,
                border: '1px solid rgba(255,255,255,0.04)',
              }} />

              {/* Right face */}
              <div style={{
                position: 'absolute', width: D, height: H,
                background: SIDE,
                transform: `rotateY(90deg) translateZ(${W / 2}px)`,
                border: '1px solid rgba(255,255,255,0.04)',
              }} />

              {/* Left face */}
              <div style={{
                position: 'absolute', width: D, height: H,
                background: SIDE,
                transform: `rotateY(-90deg) translateZ(${W / 2}px)`,
                border: '1px solid rgba(255,255,255,0.04)',
              }} />

              {/* Top face */}
              <div style={{
                position: 'absolute', width: W, height: D,
                background: TOP,
                transform: `rotateX(90deg) translateZ(${H / 2}px)`,
                border: '1px solid rgba(255,255,255,0.1)',
              }} />

              {/* Bottom face */}
              <div style={{
                position: 'absolute', width: W, height: D,
                background: BOTTOM,
                transform: `rotateX(-90deg) translateZ(${H / 2}px)`,
                border: '1px solid rgba(0,0,0,0.2)',
              }} />
            </div>
          </div>

          {/* Dial + readout */}
          <div className="flex flex-col items-center gap-1 flex-1">
            {/* SVG circular dial */}
            <svg
              ref={svgRef}
              viewBox="0 0 108 108"
              width="84"
              height="84"
              className={enabled ? 'cursor-crosshair' : ''}
              onPointerMove={svgPointerMove}
              onPointerUp={svgPointerUp}
              onPointerLeave={svgPointerUp}
            >
              {/* Track ring */}
              <circle cx={CX} cy={CY} r={DIAL_R} fill="none" stroke="#374151" strokeWidth="5" />

              {/* Progress arc */}
              {angle > 0 && (
                <path
                  d={arcPath(angle)}
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              )}

              {/* Centre readout */}
              <text
                x={CX} y={CY + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="13"
                fontWeight="700"
                fill="#E5E7EB"
                fontFamily="system-ui, sans-serif"
              >
                {angle}°
              </text>

              {/* Handle dot — draggable */}
              <circle
                cx={handleX}
                cy={handleY}
                r="7"
                fill={enabled ? '#3B82F6' : '#4B5563'}
                stroke="white"
                strokeWidth="2"
                style={{ cursor: 'grab' }}
                onPointerDown={svgPointerDown}
              />

              {/* 0° tick */}
              <line x1={CX} y1={CY - DIAL_R - 4} x2={CX} y2={CY - DIAL_R + 4}
                stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round" />
            </svg>

            {/* Label */}
            <p className="text-[10px] text-gray-500 leading-none">
              {angle === 0 ? 'No rotation' : `${angle}° clockwise`}
            </p>

            {/* Reset */}
            {angle !== 0 && enabled && (
              <button
                onClick={() => onChange(0)}
                className="text-[10px] font-semibold text-gray-600 hover:text-blue-400 transition-colors mt-0.5"
              >
                Reset to 0°
              </button>
            )}
          </div>
        </div>

        {/* Drag hint */}
        <p className="text-[10px] text-gray-600 text-center pb-2">
          Drag the box or handle to rotate
        </p>
      </div>

      {!enabled && (
        <p className="text-[10px] text-gray-600 leading-tight">
          Original orientation from the reference image will be used
        </p>
      )}
    </div>
  )
}
