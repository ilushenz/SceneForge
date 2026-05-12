import type { AnnotationState } from '../types'

/** Strips a data-URL prefix if present, returning raw base64. */
function stripPrefix(input: string): string {
  const idx = input.indexOf(',')
  return idx !== -1 ? input.slice(idx + 1) : input
}

/**
 * Returns the space image as raw base64 with annotation guides drawn on it.
 * The colored markers are visible in the image sent to Gemini so it can
 * *see* exactly where to place the object — Gemini is instructed to ignore
 * them in the output (it generates a fresh composite, not a pixel-overlay).
 */
export async function compositeAnnotatedImage(
  spaceImageBase64: string,
  annotation: AnnotationState,
): Promise<string> {
  const hasStrokes =
    annotation.strokes.filter((s) => !s.erase).length > 0
  const hasLine = annotation.line !== null

  // Nothing to draw — return clean image
  if (!hasStrokes && !hasLine) return stripPrefix(spaceImageBase64)

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)

      const w = canvas.width
      const h = canvas.height

      // ── Draw brush strokes ──────────────────────────────────────────────
      if (hasStrokes) {
        ctx.globalCompositeOperation = 'source-over'
        ctx.globalAlpha = 0.7
        ctx.fillStyle = '#FF4400'  // bright orange-red
        for (const stroke of annotation.strokes) {
          if (stroke.erase) continue
          const r = stroke.radiusFraction * w
          for (const pt of stroke.points) {
            ctx.beginPath()
            ctx.arc(pt.x * w, pt.y * h, r, 0, Math.PI * 2)
            ctx.fill()
          }
        }
        ctx.globalAlpha = 1
      }

      // ── Draw placement line ─────────────────────────────────────────────
      if (hasLine && annotation.line) {
        const l = annotation.line
        const x1 = l.x1 * w, y1 = l.y1 * h
        const x2 = l.x2 * w, y2 = l.y2 * h

        // Thick colored line
        ctx.strokeStyle = '#FF0088'  // hot pink — easy for the model to identify
        ctx.lineWidth = Math.max(4, Math.round(w / 200))
        ctx.lineCap = 'round'
        ctx.setLineDash([])
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()

        // Endpoint dots
        ctx.fillStyle = '#FF0088'
        for (const [cx, cy] of [[x1, y1], [x2, y2]]) {
          ctx.beginPath()
          ctx.arc(cx, cy, Math.max(8, Math.round(w / 120)), 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Return raw base64 (no prefix)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
      resolve(stripPrefix(dataUrl))
    }
    img.onerror = reject

    // Handle both prefixed and raw base64
    const src = spaceImageBase64.startsWith('data:')
      ? spaceImageBase64
      : `data:image/jpeg;base64,${spaceImageBase64}`
    img.src = src
  })
}

/**
 * Returns a natural-language description of the current annotation state,
 * to be appended to the generation prompt.
 */
export function getAnnotationDescription(annotation: AnnotationState): string | null {
  const paintStrokes = annotation.strokes.filter((s) => !s.erase)
  const hasStrokes = paintStrokes.length > 0 && paintStrokes.some((s) => s.points.length > 0)
  const hasLine = annotation.line !== null

  if (!hasStrokes && !hasLine) return null

  const parts: string[] = []

  parts.push(
    `IMPORTANT — placement guide markers: The space image contains colored placement guide markers drawn by the user. ` +
    `These colored marks are ONLY guides — they must NOT appear in the output image. ` +
    `The output must look like a clean, unmodified photograph of the original space with the object composited in.`
  )

  if (hasLine && annotation.line) {
    const l = annotation.line
    const pct = (v: number) => Math.round(v * 100)
    const p1 = `(${pct(l.x1)}% from left, ${pct(l.y1)}% from top)`
    const p2 = `(${pct(l.x2)}% from left, ${pct(l.y2)}% from top)`
    parts.push(
      `A bright pink/magenta line has been drawn across the space image from ${p1} to ${p2}. ` +
      `This line marks the EXACT depth in the scene where the object must be placed. ` +
      `The base of the object must sit precisely ON this line — not in front of it, not behind it. ` +
      `If background elements (hedges, walls, bushes, trees) are immediately behind this line, ` +
      `the object must appear touching those elements with no visible gap of ground between them. ` +
      `This line overrides all other placement instructions.`
    )
  }

  if (hasStrokes) {
    const paintPoints = paintStrokes.flatMap((s) => s.points)
    if (paintPoints.length > 0) {
      const xs = paintPoints.map((p) => p.x)
      const ys = paintPoints.map((p) => p.y)
      const minX = Math.min(...xs), maxX = Math.max(...xs)
      const minY = Math.min(...ys), maxY = Math.max(...ys)
      const cx = Math.round((minX + maxX) / 2 * 100)
      const cy = Math.round((minY + maxY) / 2 * 100)
      parts.push(
        `An orange-red painted region is visible on the space image — this marks the desired placement spot. ` +
        `The centroid of this region is at approximately (${cx}% from left, ${cy}% from top) of the image frame. ` +
        `Place the base of the object centred on this location. ` +
        `This mark overrides all other placement instructions.`
      )
    }
  }

  return parts.join('\n\n')
}
