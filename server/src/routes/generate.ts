import { Router, type Request, type Response } from 'express'
import { generateSingleImage } from '../services/geminiService.js'
import type { GenerationParams } from '../types/index.js'

export const generateRouter = Router()

interface SingleRequest {
  spaceImageBase64: string
  objectImageBase64: string
  params: GenerationParams
  /** null / omitted = auto-detect angle from space photo */
  angle: string | null
  /** Optional natural-language description derived from canvas annotations. */
  annotationDescription?: string
  /** Clockwise rotation in degrees around the object's vertical axis. null = use reference orientation. */
  objectRotationDegrees?: number
}

/** POST /api/generate/single — generates one composited image. */
generateRouter.post('/single', async (req: Request, res: Response) => {
  const { spaceImageBase64, objectImageBase64, params, angle, annotationDescription, objectRotationDegrees } = req.body as SingleRequest

  if (!spaceImageBase64 || !objectImageBase64 || !params) {
    res.status(400).json({ error: 'INVALID_REQUEST', message: 'Missing required fields.' })
    return
  }

  // Allow up to 3 minutes for the Gemini call (model can be slow under load)
  req.socket.setTimeout(200_000)

  try {
    const result = await generateSingleImage(
      spaceImageBase64, objectImageBase64, params,
      angle ?? null, annotationDescription, objectRotationDegrees,
    )
    res.json({ angle: angle ?? 'auto', base64: result.base64, mimeType: result.mimeType })
  } catch (err) {
    const raw = err instanceof Error ? err.message : 'Unknown error'

    // Extract a clean human-readable message from API error JSON if present
    let message = raw
    try {
      const parsed = JSON.parse(raw) as { error?: { message?: string } }
      if (parsed?.error?.message) message = parsed.error.message
    } catch { /* not JSON — use raw */ }

    const lower = message.toLowerCase()

    if (raw === 'API_KEY_MISSING') {
      res.status(500).json({ error: 'API_KEY_MISSING', message: 'Gemini API key is not set. Add your key to the .env file.' })
    } else if (raw === 'SAFETY_REFUSAL') {
      res.status(422).json({ error: 'SAFETY_REFUSAL', message: 'This angle could not be generated. Try adjusting the parameters or note.' })
    } else if (lower.includes('429') || lower.includes('quota') || lower.includes('resource_exhausted') || lower.includes('too many requests')) {
      res.status(429).json({ error: 'RATE_LIMIT', message: 'Rate limit reached — wait about a minute, then retry.' })
    } else if (lower.includes('503') || lower.includes('unavailable') || lower.includes('overloaded')) {
      res.status(503).json({ error: 'SERVICE_UNAVAILABLE', message: 'The AI service is temporarily busy. Wait a moment, then retry.' })
    } else {
      res.status(500).json({ error: 'GENERATION_FAILED', message })
    }
  }
})
