import type { AnnotationState } from '../types'

/** Strips a data-URL prefix if present, returning raw base64. */
function stripPrefix(input: string): string {
  const idx = input.indexOf(',')
  return idx !== -1 ? input.slice(idx + 1) : input
}


/**
 * Returns the space image as raw base64 (no data: prefix), ready to send to the server.
 * Annotations are never drawn onto the image — they are described in the prompt as text only.
 */
export async function compositeAnnotatedImage(
  spaceImageBase64: string,
  _annotation: AnnotationState,
): Promise<string> {
  // Always send the clean space photo — annotations go to the prompt as text, not pixels.
  return stripPrefix(spaceImageBase64)
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
    const pct = (v: number) => Math.round(v * 100)
    // Express endpoints as percentages from top-left for precision
    const p1 = `(${pct(l.x1)}% from left, ${pct(l.y1)}% from top)`
    const p2 = `(${pct(l.x2)}% from left, ${pct(l.y2)}% from top)`
    parts.push(
      `The user has drawn a placement reference line on the space image. ` +
      `This line runs from ${p1} to ${p2} — these are pixel-percentage coordinates measured from the top-left corner of the image. ` +
      `This line marks the exact depth in the scene where the object should stand. ` +
      `The base of the object must sit on this line in the image. ` +
      `If there are background elements (hedges, walls, bushes, trees) immediately behind this line in the scene, the object must appear touching them — no gap of empty ground between the object and those elements. ` +
      `Do not place the object forward of (closer to the camera than) this line. ` +
      `Use this as the definitive placement guide; ignore the "Placement within the space" parameter above.`
    )
  }

  if (hasStrokes) {
    // Compute bounding box of all non-erase stroke points for a tighter description
    const paintPoints = annotation.strokes
      .filter(s => !s.erase)
      .flatMap(s => s.points)
    if (paintPoints.length > 0) {
      const xs = paintPoints.map(p => p.x)
      const ys = paintPoints.map(p => p.y)
      const minX = Math.min(...xs), maxX = Math.max(...xs)
      const minY = Math.min(...ys), maxY = Math.max(...ys)
      const cx = Math.round((minX + maxX) / 2 * 100)
      const cy = Math.round((minY + maxY) / 2 * 100)
      parts.push(
        `The user has painted a marked region on the space image to indicate the desired placement spot. ` +
        `The centroid of this marked region is at approximately (${cx}% from left, ${cy}% from top) of the image frame. ` +
        `Place the base of the object centred on this location in the scene. ` +
        `Use this as the definitive placement guide; ignore the "Placement within the space" parameter above.`
      )
    }
  }

  return parts.join('\n\n')
}
