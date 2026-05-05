import { Router, type Request, type Response } from 'express'
import { generateSingleImage } from '../services/geminiService.js'
import type { GenerationParams } from '../types/index.js'

export const generateRouter = Router()

interface SingleRequest {
  spaceImageBase64: string
  objectImageBase64: string
  params: GenerationParams
  angle: string
}

/** POST /api/generate/single — generates one composited image for one viewing angle. */
generateRouter.post('/single', async (req: Request, res: Response) => {
  const { spaceImageBase64, objectImageBase64, params, angle } = req.body as SingleRequest

  if (!spaceImageBase64 || !objectImageBase64 || !params || !angle) {
    res.status(400).json({ error: 'INVALID_REQUEST', message: 'Missing required fields.' })
    return
  }

  // Allow up to 120 seconds for the Gemini call
  req.socket.setTimeout(130_000)

  try {
    const result = await generateSingleImage(spaceImageBase64, objectImageBase64, params, angle)
    res.json({ angle, base64: result.base64, mimeType: result.mimeType })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'

    if (message === 'API_KEY_MISSING') {
      res.status(500).json({
        error: 'API_KEY_MISSING',
        message: 'Gemini API key is not set. Copy .env.example to .env and add your key.',
      })
    } else if (message === 'SAFETY_REFUSAL') {
      res.status(422).json({
        error: 'SAFETY_REFUSAL',
        message: 'This angle could not be generated. Try adjusting the parameters or note.',
      })
    } else {
      res.status(500).json({ error: 'GENERATION_FAILED', message })
    }
  }
})
