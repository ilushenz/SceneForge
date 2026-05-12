import { Router, type Request, type Response } from 'express'
import { generateSingleImage } from '../services/geminiService.js'
import type { GenerationParams } from '../types/index.js'

export const generateRouter = Router()

interface SingleRequest {
  spaceImageBase64: string
  objectImageBase64: string
  params: GenerationParams
  angle: string
  /** Optional natural-language description derived from canvas annotations. */
  annotationDescription?: string
}

/** POST /api/generate/single — generates one composited image for one viewing angle. */
generateRouter.post('/single', async (req: Request, res: Response) => {
  const { spaceImageBase64, objectImageBase64, params, angle, annotationDescription } = req.body as SingleRequest

  if (!spaceImageBase64 || !objectImageBase64 || !params || !angle) {
    res.status(400).json({ error: 'INVALID_REQUEST', message: 'Missing required fields.' })
    return
  }

  // Allow up to 120 seconds for the Gemini call
  req.socket.setTimeout(130_000)

  try {
    const result = await generateSingleImage(spaceImageBase64, objectImageBase64, params, angle, annotationDescription)
    res.json({ angle, base64: result.base64, mimeType: result.mimeType })
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
