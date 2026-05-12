import type { AnnotationState, BrushStroke, PlacementLine } from '../types'

/** Strips a data-URL prefix if present, returning raw base64. */
function stripPrefix(input: string): string {
  const idx = input.indexOf(',')
  return idx !== -1 ? input.slice(idx + 1) : input
}

/**
 * Loads a base64 string (with or without data-URL prefix) into an HTMLImageElement.
 */
function loadImage(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    // Accept both raw base64 and full data-URLs
    img.src = base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`
  })
}

/**
 * Renders all brush strokes onto an off-screen canvas at native image resolution.
 * Coordinates are stored as fractions (0–1) and scaled to the canvas dimensions.
 */
function renderStrokes(ctx: CanvasRenderingContext2D, strokes: BrushStroke[], w: number, h: number) {
  for (const stroke of strokes) {
    if (stroke.points.length === 0) continue

    ctx.save()
    if (stroke.erase) {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.globalAlpha = 1
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 0.5
      ctx.strokeStyle = 'rgba(220,38,38,1)' // red; alpha handled by globalAlpha
    }

    const radius = stroke.radiusFraction * w
    ctx.lineWidth = radius * 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.beginPath()
    const first = stroke.points[0]
    ctx.moveTo(first.x * w, first.y * h)
    for (let i = 1; i < stroke.points.length; i++) {
      const pt = stroke.points[i]
      ctx.lineTo(pt.x * w, pt.y * h)
    }
    // Single-point tap — draw a dot
    if (stroke.points.length === 1) {
      ctx.arc(first.x * w, first.y * h, radius, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(220,38,38,1)'
      ctx.fill()
    } else {
      ctx.stroke()
    }

    ctx.restore()
  }
}

/**
 * Renders the placement line (without handles) onto the off-screen canvas.
 */
function renderLine(ctx: CanvasRenderingContext2D, line: PlacementLine, w: number, h: number) {
  ctx.save()
  ctx.globalCompositeOperation = 'source-over'
  ctx.strokeStyle = 'rgba(220,38,38,0.9)'
  ctx.lineWidth = Math.max(2, w * 0.003) // ~0.3% of image width, minimum 2px
  ctx.lineCap = 'round'
  ctx.setLineDash([Math.max(8, w * 0.008), Math.max(6, w * 0.005)])
  ctx.beginPath()
  ctx.moveTo(line.x1 * w, line.y1 * h)
  ctx.lineTo(line.x2 * w, line.y2 * h)
  ctx.stroke()
  ctx.restore()
}

/**
 * Composites the space image with any annotation strokes/line at its native resolution.
 * Returns a base64 JPEG string (no data: prefix).
 *
 * If there are no annotations, returns the original base64 unchanged.
 */
export async function compositeAnnotatedImage(
  spaceImageBase64: string,
  annotation: AnnotationState,
): Promise<string> {
  const hasStrokes = annotation.strokes.length > 0
  const hasLine = annotation.line !== null

  // Nothing to composite — return raw base64 (strip prefix so server receives consistent input)
  if (!hasStrokes && !hasLine) return stripPrefix(spaceImageBase64)

  const img = await loadImage(spaceImageBase64)
  const w = img.naturalWidth
  const h = img.naturalHeight

  // Main canvas — draw the space photo
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)

  // Brush overlay — separate canvas so we can flatten at 50% opacity
  if (hasStrokes) {
    const brushCanvas = document.createElement('canvas')
    brushCanvas.width = w
    brushCanvas.height = h
    const bCtx = brushCanvas.getContext('2d')!
    renderStrokes(bCtx, annotation.strokes, w, h)
    ctx.drawImage(brushCanvas, 0, 0)
  }

  // Line — drawn directly (no handles)
  if (hasLine) {
    renderLine(ctx, annotation.line!, w, h)
  }

  // Export as JPEG
  const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
  // Strip the "data:image/jpeg;base64," prefix
  return dataUrl.split(',')[1]
}

/**
 * Returns a natural-language description of the current annotation state,
 * to be appended to the generation prompt.
 */
export function getAnnotationDescription(annotation: AnnotationState): string | null {
  const hasStrokes = annotation.strokes.some((s) => !s.erase || annotation.strokes.length > 0) &&
    annotation.strokes.length > 0
  const hasLine = annotation.line !== null

  if (!hasStrokes && !hasLine) return null

  const parts: string[] = []

  if (hasLine && annotation.line) {
    const l = annotation.line
    // Convert fractions to rough English positions for richer context
    const describeX = (x: number) => x < 0.33 ? 'left' : x > 0.67 ? 'right' : 'centre'
    const describeY = (y: number) => y < 0.33 ? 'top' : y > 0.67 ? 'bottom' : 'middle'
    const p1 = `${describeX(l.x1)}-${describeY(l.y1)}`
    const p2 = `${describeX(l.x2)}-${describeY(l.y2)}`
    parts.push(
      `A bright red dashed straight line is drawn on the first (space) image. ` +
      `This line runs from the ${p1} area to the ${p2} area of the image and marks the exact ` +
      `rear bottom edge — the precise ground contact line — where the object must be placed. ` +
      `The base of the object must rest exactly along this line. ` +
      `Use this line as the definitive placement guide and ignore the "Placement within the space" parameter above.`
    )
  }

  if (hasStrokes) {
    parts.push(
      `A red semi-transparent painted region is highlighted on the first (space) image. ` +
      `This painted area indicates exactly where the object should be positioned within the space. ` +
      `The centre of the object's base must be placed within or at the centroid of this highlighted region. ` +
      `Use this highlighted region as the definitive placement guide and ignore the "Placement within the space" parameter above.`
    )
  }

  return parts.join('\n\n')
}
