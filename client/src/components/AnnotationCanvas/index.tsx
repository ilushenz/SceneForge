/**
 * AnnotationCanvas
 *
 * A wrapper component that renders the space photo, two annotation canvas
 * overlays, and the annotation toolbar — all in one cohesive block.
 *
 * Canvas architecture:
 *   ┌──────────────────────────────────────────┐  ← relative container
 *   │  <img>  (space photo, full width)         │
 *   │  <canvas brushCanvas>  (absolute overlay) │
 *   │  <canvas lineCanvas>   (absolute overlay) │
 *   └──────────────────────────────────────────┘
 *   ┌──────────────────────────────────────────┐
 *   │  Toolbar (mode tabs + brush/line controls) │
 *   └──────────────────────────────────────────┘
 *
 * Coordinates are stored as fractions (0–1) so they survive resizes.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { BrushPoint, BrushStroke, PlacementLine, AnnotationState } from '../../types'

// ── Constants ─────────────────────────────────────────────────────────────────

const BRUSH_SIZES = { S: 0.010, M: 0.020, L: 0.038 } as const
type BrushSize = keyof typeof BRUSH_SIZES

const HANDLE_RADIUS_PX = 10
const LINE_COLOR = 'rgba(220,38,38,0.9)'
type Tool = 'brush' | 'eraser'
type Mode = 'brush' | 'line'

// ── Small SVG icons ───────────────────────────────────────────────────────────

function BrushIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
    </svg>
  )
}

function EraserIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
      <path d="M22 21H7" /><path d="m5 11 9 9" />
    </svg>
  )
}

function LineIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="5" y1="19" x2="19" y2="5" />
      <circle cx="5" cy="19" r="2.5" fill="currentColor" />
      <circle cx="19" cy="5" r="2.5" fill="currentColor" />
    </svg>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface AnnotationCanvasProps {
  /** The space image base64 (used as src for the displayed <img>) */
  imageBase64: string
  imageName?: string | null
  annotation: AnnotationState
  onChange: (next: AnnotationState) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AnnotationCanvas({ imageBase64, imageName, annotation, onChange }: AnnotationCanvasProps) {
  const [mode, setMode] = useState<Mode>('brush')
  const [tool, setTool] = useState<Tool>('brush')
  const [brushSize, setBrushSize] = useState<BrushSize>('M')
  const [lineCursor, setLineCursor] = useState('crosshair')

  // Container and canvas refs
  const containerRef = useRef<HTMLDivElement>(null)
  const brushCanvasRef = useRef<HTMLCanvasElement>(null)
  const lineCanvasRef = useRef<HTMLCanvasElement>(null)

  // Track canvas dimensions (updated via ResizeObserver)
  const sizeRef = useRef({ w: 0, h: 0 })

  // Live drawing state — not stored in Zustand until pointer up
  const isDrawing = useRef(false)
  const currentStroke = useRef<BrushPoint[]>([])
  const draggingHandle = useRef<'p1' | 'p2' | null>(null)

  // ── Resize observer — keep canvases matched to image ─────────────────────

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const sync = () => {
      const w = container.offsetWidth
      const h = container.offsetHeight
      if (w === 0 || h === 0) return
      sizeRef.current = { w, h }
      const brush = brushCanvasRef.current
      const line = lineCanvasRef.current
      if (brush) { brush.width = w; brush.height = h }
      if (line) { line.width = w; line.height = h }
      redrawBrush()
      redrawLine()
    }

    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(container)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Redraw brush layer ────────────────────────────────────────────────────

  const redrawBrush = useCallback(() => {
    const canvas = brushCanvasRef.current
    if (!canvas) return
    const { w, h } = sizeRef.current
    if (w === 0) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (const stroke of annotation.strokes) {
      if (stroke.points.length === 0) continue
      ctx.save()
      if (stroke.erase) {
        ctx.globalCompositeOperation = 'destination-out'
        ctx.globalAlpha = 1
        ctx.strokeStyle = 'rgba(0,0,0,1)'
      } else {
        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = 1
        ctx.strokeStyle = 'rgba(220,38,38,1)'
      }
      const r = stroke.radiusFraction * w
      ctx.lineWidth = r * 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      const first = stroke.points[0]
      ctx.moveTo(first.x * w, first.y * h)
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x * w, stroke.points[i].y * h)
      }
      if (stroke.points.length === 1) {
        ctx.arc(first.x * w, first.y * h, r, 0, Math.PI * 2)
        ctx.fillStyle = ctx.strokeStyle as string
        ctx.fill()
      } else {
        ctx.stroke()
      }
      ctx.restore()
    }
  }, [annotation.strokes])

  // ── Redraw line layer ─────────────────────────────────────────────────────

  const redrawLine = useCallback(() => {
    const canvas = lineCanvasRef.current
    if (!canvas) return
    const { w, h } = sizeRef.current
    if (w === 0) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!annotation.line) return

    drawLineWithHandles(ctx, annotation.line, w, h)
  }, [annotation.line])

  useEffect(() => { redrawBrush() }, [redrawBrush])
  useEffect(() => { redrawLine() }, [redrawLine])

  // ── Draw line + handles helper ────────────────────────────────────────────

  function drawLineWithHandles(ctx: CanvasRenderingContext2D, line: PlacementLine, w: number, h: number) {
    const x1 = line.x1 * w; const y1 = line.y1 * h
    const x2 = line.x2 * w; const y2 = line.y2 * h

    ctx.save()
    ctx.strokeStyle = LINE_COLOR
    ctx.lineWidth = Math.max(2, w * 0.003)
    ctx.lineCap = 'round'
    ctx.setLineDash([Math.max(8, w * 0.008), Math.max(6, w * 0.005)])
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
    ctx.restore()

    for (const [hx, hy] of [[x1, y1], [x2, y2]] as [number, number][]) {
      ctx.save()
      ctx.fillStyle = 'white'
      ctx.strokeStyle = LINE_COLOR
      ctx.lineWidth = 2
      ctx.setLineDash([])
      ctx.beginPath(); ctx.arc(hx, hy, HANDLE_RADIUS_PX, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
      ctx.restore()
    }
  }

  // ── Canvas coordinate helpers ─────────────────────────────────────────────

  function canvasPos(e: React.PointerEvent | React.TouchEvent, canvasEl: HTMLCanvasElement): BrushPoint {
    const rect = canvasEl.getBoundingClientRect()
    let clientX: number, clientY: number
    if ('touches' in e) {
      clientX = e.touches[0]?.clientX ?? (e as React.TouchEvent).changedTouches[0].clientX
      clientY = e.touches[0]?.clientY ?? (e as React.TouchEvent).changedTouches[0].clientY
    } else {
      clientX = (e as React.PointerEvent).clientX
      clientY = (e as React.PointerEvent).clientY
    }
    return {
      x: (clientX - rect.left) / canvasEl.width,
      y: (clientY - rect.top) / canvasEl.height,
    }
  }

  function hitHandle(line: PlacementLine, px: number, py: number): 'p1' | 'p2' | null {
    const { w, h } = sizeRef.current
    const tx = (HANDLE_RADIUS_PX + 6) / w
    const ty = (HANDLE_RADIUS_PX + 6) / h
    if (Math.abs(px - line.x1) < tx && Math.abs(py - line.y1) < ty) return 'p1'
    if (Math.abs(px - line.x2) < tx && Math.abs(py - line.y2) < ty) return 'p2'
    return null
  }

  // ── Brush pointer events ──────────────────────────────────────────────────

  const onBrushDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    isDrawing.current = true
    const canvas = brushCanvasRef.current!
    const pos = canvasPos(e, canvas)
    currentStroke.current = [pos]
    paintDot(canvas, pos)
  }

  const onBrushMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return
    const canvas = brushCanvasRef.current!
    const pos = canvasPos(e, canvas)
    const prev = currentStroke.current[currentStroke.current.length - 1]
    currentStroke.current.push(pos)
    paintSegment(canvas, prev, pos)
  }

  const onBrushUp = () => {
    if (!isDrawing.current) return
    isDrawing.current = false
    const pts = currentStroke.current; currentStroke.current = []
    if (pts.length === 0) return
    const stroke: BrushStroke = { points: pts, radiusFraction: BRUSH_SIZES[brushSize], erase: tool === 'eraser' }
    onChange({ ...annotation, strokes: [...annotation.strokes, stroke] })
  }

  function paintDot(canvas: HTMLCanvasElement, pos: BrushPoint) {
    const { w, h } = sizeRef.current
    const ctx = canvas.getContext('2d')!
    const r = BRUSH_SIZES[brushSize] * w
    ctx.save()
    applyBrushCompositing(ctx)
    ctx.beginPath()
    ctx.arc(pos.x * w, pos.y * h, r, 0, Math.PI * 2)
    if (tool === 'eraser') ctx.fill()
    else { ctx.fillStyle = 'rgba(220,38,38,1)'; ctx.fill() }
    ctx.restore()
  }

  function paintSegment(canvas: HTMLCanvasElement, from: BrushPoint, to: BrushPoint) {
    const { w, h } = sizeRef.current
    const ctx = canvas.getContext('2d')!
    const r = BRUSH_SIZES[brushSize] * w
    ctx.save()
    applyBrushCompositing(ctx)
    ctx.lineWidth = r * 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(from.x * w, from.y * h)
    ctx.lineTo(to.x * w, to.y * h)
    ctx.stroke()
    ctx.restore()
  }

  function applyBrushCompositing(ctx: CanvasRenderingContext2D) {
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.globalAlpha = 1
      ctx.strokeStyle = 'rgba(0,0,0,1)'
      ctx.fillStyle = 'rgba(0,0,0,1)'
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
      ctx.strokeStyle = 'rgba(220,38,38,1)'
    }
  }

  // ── Touch events (brush) ──────────────────────────────────────────────────

  const onBrushTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    isDrawing.current = true
    const canvas = brushCanvasRef.current!
    const pos = canvasPos(e, canvas)
    currentStroke.current = [pos]
    paintDot(canvas, pos)
  }

  const onBrushTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!isDrawing.current) return
    const canvas = brushCanvasRef.current!
    const pos = canvasPos(e, canvas)
    const prev = currentStroke.current[currentStroke.current.length - 1]
    currentStroke.current.push(pos)
    paintSegment(canvas, prev, pos)
  }

  const onBrushTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => { e.preventDefault(); onBrushUp() }

  // ── Line pointer events ───────────────────────────────────────────────────

  const onLineDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const canvas = lineCanvasRef.current!
    const pos = canvasPos(e, canvas)

    if (annotation.line) {
      const hit = hitHandle(annotation.line, pos.x, pos.y)
      if (hit) { draggingHandle.current = hit; isDrawing.current = true; return }
    }

    // Start new line
    const newLine: PlacementLine = { x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y }
    draggingHandle.current = 'p2'
    isDrawing.current = true
    onChange({ ...annotation, line: newLine })
  }

  const onLineMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !draggingHandle.current || !annotation.line) return
    const canvas = lineCanvasRef.current!
    const pos = canvasPos(e, canvas)
    const line = annotation.line
    const updated: PlacementLine = draggingHandle.current === 'p1'
      ? { ...line, x1: pos.x, y1: pos.y }
      : { ...line, x2: pos.x, y2: pos.y }

    // Optimistic redraw for smooth dragging
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawLineWithHandles(ctx, updated, sizeRef.current.w, sizeRef.current.h)

    onChange({ ...annotation, line: updated })
  }

  const onLineUp = () => { isDrawing.current = false; draggingHandle.current = null }

  const onLineHover = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!annotation.line || isDrawing.current) return
    const canvas = lineCanvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const px = (e.clientX - rect.left) / canvas.width
    const py = (e.clientY - rect.top) / canvas.height
    const hit = hitHandle(annotation.line, px, py)
    setLineCursor(hit ? 'grab' : 'crosshair')
  }

  // ── Touch events (line) ───────────────────────────────────────────────────

  const onLineTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const canvas = lineCanvasRef.current!
    const pos = canvasPos(e, canvas)

    if (annotation.line) {
      const hit = hitHandle(annotation.line, pos.x, pos.y)
      if (hit) { draggingHandle.current = hit; isDrawing.current = true; return }
    }

    const newLine: PlacementLine = { x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y }
    draggingHandle.current = 'p2'
    isDrawing.current = true
    onChange({ ...annotation, line: newLine })
  }

  const onLineTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!isDrawing.current || !draggingHandle.current || !annotation.line) return
    const canvas = lineCanvasRef.current!
    const pos = canvasPos(e, canvas)
    const line = annotation.line
    const updated: PlacementLine = draggingHandle.current === 'p1'
      ? { ...line, x1: pos.x, y1: pos.y }
      : { ...line, x2: pos.x, y2: pos.y }

    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawLineWithHandles(ctx, updated, sizeRef.current.w, sizeRef.current.h)

    onChange({ ...annotation, line: updated })
  }

  const onLineTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => { e.preventDefault(); onLineUp() }

  // ── Derived state ─────────────────────────────────────────────────────────

  const hasAnnotations = annotation.strokes.length > 0 || annotation.line !== null

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-xl overflow-hidden border border-gray-700 bg-gray-800">
      {/* Image + canvas overlays */}
      <div ref={containerRef} className="relative w-full">
        <img
          src={imageBase64}
          alt={imageName ?? 'Space photo'}
          className="w-full block select-none"
          draggable={false}
        />

        {/* Brush canvas — always present; only active in brush mode */}
        <canvas
          ref={brushCanvasRef}
          className="absolute inset-0 w-full h-full"
          style={{
            pointerEvents: mode === 'brush' ? 'auto' : 'none',
            cursor: tool === 'eraser' ? 'cell' : 'crosshair',
            touchAction: 'none',
          }}
          onPointerDown={onBrushDown}
          onPointerMove={onBrushMove}
          onPointerUp={onBrushUp}
          onPointerLeave={onBrushUp}
          onTouchStart={onBrushTouchStart}
          onTouchMove={onBrushTouchMove}
          onTouchEnd={onBrushTouchEnd}
        />

        {/* Line canvas — always present; only active in line mode */}
        <canvas
          ref={lineCanvasRef}
          className="absolute inset-0 w-full h-full"
          style={{
            pointerEvents: mode === 'line' ? 'auto' : 'none',
            cursor: lineCursor,
            touchAction: 'none',
          }}
          onPointerDown={onLineDown}
          onPointerMove={onLineMove}
          onPointerUp={onLineUp}
          onPointerLeave={onLineUp}
          onMouseMove={onLineHover}
          onTouchStart={onLineTouchStart}
          onTouchMove={onLineTouchMove}
          onTouchEnd={onLineTouchEnd}
        />
      </div>

      {/* Toolbar */}
      <div className="px-3 py-2 border-t border-gray-700 space-y-2">
        {/* Mode tabs + clear all */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setMode('brush'); setTool('brush') }}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
              mode === 'brush'
                ? 'bg-red-600/20 text-red-400 border border-red-600/40'
                : 'text-gray-500 hover:text-gray-300 border border-transparent'
            }`}
          >
            <BrushIcon /> Brush
          </button>
          <button
            onClick={() => setMode('line')}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
              mode === 'line'
                ? 'bg-red-600/20 text-red-400 border border-red-600/40'
                : 'text-gray-500 hover:text-gray-300 border border-transparent'
            }`}
          >
            <LineIcon /> Placement line
          </button>
          <div className="flex-1" />
          {hasAnnotations && (
            <button
              onClick={() => onChange({ strokes: [], line: null })}
              className="text-[10px] font-semibold text-gray-600 hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Brush sub-toolbar */}
        {mode === 'brush' && (
          <div className="flex items-center gap-2">
            {/* Paint / Erase */}
            <div className="flex rounded-md overflow-hidden border border-gray-700">
              <button
                onClick={() => setTool('brush')}
                className={`flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                  tool === 'brush' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'
                }`}
              >
                <BrushIcon /> Paint
              </button>
              <button
                onClick={() => setTool('eraser')}
                className={`flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold border-l border-gray-700 transition-colors ${
                  tool === 'eraser' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'
                }`}
              >
                <EraserIcon /> Erase
              </button>
            </div>

            {/* Brush size */}
            <div className="flex rounded-md overflow-hidden border border-gray-700">
              {(['S', 'M', 'L'] as BrushSize[]).map((s, i) => (
                <button
                  key={s}
                  onClick={() => setBrushSize(s)}
                  className={`w-7 py-0.5 text-[11px] font-bold transition-colors ${
                    brushSize === s ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'
                  } ${i > 0 ? 'border-l border-gray-700' : ''}`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex-1" />
            {annotation.strokes.length > 0 && (
              <button
                onClick={() => onChange({ ...annotation, strokes: [] })}
                className="text-[10px] font-semibold text-gray-600 hover:text-red-400 transition-colors"
              >
                Clear brush
              </button>
            )}
          </div>
        )}

        {/* Line sub-toolbar */}
        {mode === 'line' && (
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-gray-500 leading-tight">
              {annotation.line
                ? 'Drag the handles to adjust the placement line'
                : 'Click and drag to draw the placement line'}
            </p>
            <div className="flex-1" />
            {annotation.line && (
              <button
                onClick={() => onChange({ ...annotation, line: null })}
                className="text-[10px] font-semibold text-gray-600 hover:text-red-400 transition-colors shrink-0"
              >
                Clear line
              </button>
            )}
          </div>
        )}

        {/* Annotation active hint */}
        {hasAnnotations && (
          <p className="text-[10px] text-gray-600 leading-tight">
            ✓ Annotations guide placement via the prompt — not drawn on the generated image
          </p>
        )}
      </div>
    </div>
  )
}
