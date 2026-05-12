/**
 * ObjectRotationControl
 *
 * Lets the user rotate the object around its vertical axis before compositing.
 * Visual: an SVG-rendered 3D box with proper perspective projection, back-face
 * culling, and painter's-algorithm face ordering. Drag the box or the dial
 * handle to set the rotation angle.
 */

import { useCallback, useRef } from 'react'

// ── 3D box geometry ───────────────────────────────────────────────────────────

const BW = 26, BH = 42, BD = 14  // half-dimensions

const CORNERS_DEF: [number, number, number][] = [
  [-BW, -BH, -BD],  // 0 left-top-back
  [ BW, -BH, -BD],  // 1 right-top-back
  [ BW,  BH, -BD],  // 2 right-bottom-back
  [-BW,  BH, -BD],  // 3 left-bottom-back
  [-BW, -BH,  BD],  // 4 left-top-front
  [ BW, -BH,  BD],  // 5 right-top-front
  [ BW,  BH,  BD],  // 6 right-bottom-front
  [-BW,  BH,  BD],  // 7 left-bottom-front
]

// Face index lists + shading; first face is the "front" (gets the arrow)
const FACE_DEFS = [
  { idx: [4, 5, 6, 7], color: '#4f6171', isFront: true  },  // z+ front
  { idx: [5, 1, 2, 6], color: '#3a4a5a', isFront: false },  // x+ right
  { idx: [0, 4, 7, 3], color: '#3a4a5a', isFront: false },  // x- left
  { idx: [4, 0, 1, 5], color: '#6b7a8a', isFront: false },  // y- top
  { idx: [7, 6, 2, 3], color: '#1a2530', isFront: false },  // y+ bottom
  { idx: [1, 0, 3, 2], color: '#2a3440', isFront: false },  // z- back
]

const FOCAL = 280
const SVG_W = 130, SVG_H = 110
const CX = SVG_W / 2, CY = SVG_H / 2 + 4  // shift slightly down so tilt shows top

/** Apply Y-rotation + fixed -14° X-tilt, return transformed corners. */
function transform(yDeg: number): [number, number, number][] {
  const yr = (yDeg * Math.PI) / 180
  const yc = Math.cos(yr), ys = Math.sin(yr)
  const xr = (-14 * Math.PI) / 180
  const xc = Math.cos(xr), xs = Math.sin(xr)

  return CORNERS_DEF.map(([x, y, z]) => {
    // Y rotation
    const x2 = x * yc + z * ys
    const z2 = -x * ys + z * yc
    // X tilt
    const y3 = y * xc - z2 * xs
    const z3 = y * xs + z2 * xc
    return [x2, y3, z3]
  })
}

/** Perspective project 3D corners to SVG 2D coords. */
function project(pts3d: [number, number, number][]): [number, number][] {
  return pts3d.map(([x, y, z]) => {
    const s = FOCAL / (FOCAL - z)
    return [CX + x * s, CY + y * s]
  })
}

/** 2D signed area — positive = clockwise in screen space (Y-down) = facing camera. */
function signedArea(pts2d: [number, number][], idx: number[]): number {
  const [x0, y0] = pts2d[idx[0]]
  const [x1, y1] = pts2d[idx[1]]
  const [x2, y2] = pts2d[idx[2]]
  return (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0)
}

/** Average Z of a face (for painter's algorithm — draw farthest first). */
function avgZ(pts3d: [number, number, number][], idx: number[]): number {
  return idx.reduce((sum, i) => sum + pts3d[i][2], 0) / idx.length
}

function toPoints(pts2d: [number, number][], idx: number[]): string {
  return idx.map(i => pts2d[i].map(v => v.toFixed(1)).join(',')).join(' ')
}

// ── Dial constants ────────────────────────────────────────────────────────────

const DIAL_R = 44, DCX = 52, DCY = 52

function handlePos(deg: number): [number, number] {
  const r = ((deg - 90) * Math.PI) / 180
  return [DCX + DIAL_R * Math.cos(r), DCY + DIAL_R * Math.sin(r)]
}

function arcPath(deg: number): string {
  if (deg <= 0) return ''
  if (deg >= 360) return `M ${DCX} ${DCY - DIAL_R} A ${DIAL_R} ${DIAL_R} 0 1 1 ${DCX - 0.01} ${DCY - DIAL_R} Z`
  const r = ((deg - 90) * Math.PI) / 180
  const ex = DCX + DIAL_R * Math.cos(r)
  const ey = DCY + DIAL_R * Math.sin(r)
  const lg = deg > 180 ? 1 : 0
  return `M ${DCX} ${DCY - DIAL_R} A ${DIAL_R} ${DIAL_R} 0 ${lg} 1 ${ex} ${ey}`
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  value: number | null
  onChange: (degrees: number | null) => void
}

export function ObjectRotationControl({ value, onChange }: Props) {
  const enabled = value !== null
  const angle = value ?? 0

  // ── Box drag ──────────────────────────────────────────────────────────────

  const boxDragging = useRef(false)
  const boxStartX = useRef(0)
  const boxStartAngle = useRef(0)

  const onBoxPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!enabled) return
    e.currentTarget.setPointerCapture(e.pointerId)
    boxDragging.current = true
    boxStartX.current = e.clientX
    boxStartAngle.current = angle
  }, [enabled, angle])

  const onBoxPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!boxDragging.current) return
    const delta = e.clientX - boxStartX.current
    const raw = boxStartAngle.current + delta * 1.5
    onChange(((Math.round(raw) % 360) + 360) % 360)
  }, [onChange])

  const onBoxPointerUp = useCallback(() => { boxDragging.current = false }, [])

  // Touch (box)
  const onBoxTouchStart = (e: React.TouchEvent) => {
    if (!enabled) return
    boxDragging.current = true
    boxStartX.current = e.touches[0].clientX
    boxStartAngle.current = angle
  }
  const onBoxTouchMove = (e: React.TouchEvent) => {
    if (!boxDragging.current) return
    e.preventDefault()
    const delta = e.touches[0].clientX - boxStartX.current
    const raw = boxStartAngle.current + delta * 1.5
    onChange(((Math.round(raw) % 360) + 360) % 360)
  }
  const onBoxTouchEnd = () => { boxDragging.current = false }

  // ── Dial drag ─────────────────────────────────────────────────────────────

  const dialDragging = useRef(false)
  const dialSvgRef = useRef<SVGSVGElement>(null)

  const onDialHandleDown = (e: React.PointerEvent<SVGCircleElement>) => {
    if (!enabled) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dialDragging.current = true
  }

  const onDialPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dialDragging.current || !dialSvgRef.current) return
    const rect = dialSvgRef.current.getBoundingClientRect()
    const sx = 104 / rect.width  // viewBox width = 104
    const sy = 104 / rect.height
    const dx = (e.clientX - rect.left) * sx - DCX
    const dy = (e.clientY - rect.top)  * sy - DCY
    const deg = (((Math.atan2(dy, dx) * 180) / Math.PI + 90) % 360 + 360) % 360
    onChange(Math.round(deg))
  }

  const onDialPointerUp = () => { dialDragging.current = false }

  // ── 3D render ─────────────────────────────────────────────────────────────

  const pts3d = transform(angle)
  const pts2d = project(pts3d)

  const visibleFaces = FACE_DEFS
    .filter(f => signedArea(pts2d, f.idx) > 0)
    .sort((a, b) => avgZ(pts3d, a.idx) - avgZ(pts3d, b.idx))  // far → near

  // Centre of front face for the arrow
  const frontFaceVisible = visibleFaces.find(f => f.isFront)
  const frontCentre = frontFaceVisible
    ? frontFaceVisible.idx.reduce(
        ([ax, ay], i) => [ax + pts2d[i][0] / 4, ay + pts2d[i][1] / 4],
        [0, 0]
      )
    : null

  // ── Dial handle position ──────────────────────────────────────────────────

  const [hx, hy] = handlePos(angle)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-2">
      {/* Header */}
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
        >
          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform mt-px
            ${enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {/* Card */}
      <div className={`rounded-xl border transition-all overflow-hidden
        ${enabled
          ? 'border-gray-700 bg-gray-800/60'
          : 'border-gray-800 bg-gray-800/20 opacity-40 pointer-events-none select-none'}`}
      >
        <div className="flex items-center gap-3 px-3 py-3">

          {/* SVG 3D Box */}
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            width={SVG_W * 0.85}
            height={SVG_H * 0.85}
            style={{ cursor: enabled ? 'ew-resize' : 'default', flexShrink: 0 }}
            onPointerDown={onBoxPointerDown}
            onPointerMove={onBoxPointerMove}
            onPointerUp={onBoxPointerUp}
            onPointerLeave={onBoxPointerUp}
            onTouchStart={onBoxTouchStart}
            onTouchMove={onBoxTouchMove}
            onTouchEnd={onBoxTouchEnd}
          >
            {visibleFaces.map((face, i) => (
              <polygon
                key={i}
                points={toPoints(pts2d, face.idx)}
                fill={face.color}
                stroke="rgba(255,255,255,0.07)"
                strokeWidth="0.6"
                strokeLinejoin="round"
              />
            ))}

            {/* Forward-facing arrow on front face */}
            {frontCentre && (
              <g transform={`translate(${frontCentre[0]}, ${frontCentre[1]})`} style={{ pointerEvents: 'none' }}>
                <path
                  d="M0,-9 L5,3 L0,0 L-5,3 Z"
                  fill="rgba(255,255,255,0.45)"
                  strokeLinejoin="round"
                />
              </g>
            )}
          </svg>

          {/* Dial + readout */}
          <div className="flex flex-col items-center gap-1 flex-1">
            <svg
              ref={dialSvgRef}
              viewBox="0 0 104 104"
              width="80"
              height="80"
              onPointerMove={onDialPointerMove}
              onPointerUp={onDialPointerUp}
              onPointerLeave={onDialPointerUp}
            >
              {/* Track */}
              <circle cx={DCX} cy={DCY} r={DIAL_R} fill="none" stroke="#374151" strokeWidth="5" />

              {/* Progress arc */}
              {angle > 0 && (
                <path d={arcPath(angle)} fill="none" stroke="#3B82F6"
                  strokeWidth="5" strokeLinecap="round" />
              )}

              {/* Centre text */}
              <text x={DCX} y={DCY + 1} textAnchor="middle" dominantBaseline="middle"
                fontSize="13" fontWeight="700" fill="#E5E7EB"
                fontFamily="system-ui,sans-serif">
                {angle}°
              </text>

              {/* 0° tick */}
              <line x1={DCX} y1={DCY - DIAL_R - 4} x2={DCX} y2={DCY - DIAL_R + 4}
                stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round" />

              {/* Handle */}
              <circle cx={hx} cy={hy} r="7"
                fill={enabled ? '#3B82F6' : '#4B5563'}
                stroke="white" strokeWidth="1.5"
                style={{ cursor: 'grab' }}
                onPointerDown={onDialHandleDown}
              />
            </svg>

            <p className="text-[10px] text-gray-500 leading-none">
              {angle === 0 ? 'No rotation' : `${angle}° clockwise`}
            </p>

            {angle !== 0 && (
              <button
                onClick={() => onChange(0)}
                className="text-[10px] font-semibold text-gray-600 hover:text-blue-400 transition-colors mt-0.5"
              >
                Reset to 0°
              </button>
            )}
          </div>
        </div>

        <p className="text-[10px] text-gray-600 text-center pb-2">
          Drag the box or the handle to rotate
        </p>
      </div>

      {!enabled && (
        <p className="text-[10px] text-gray-600">
          Original orientation from the reference image will be used
        </p>
      )}
    </div>
  )
}
