import { GoogleGenAI } from '@google/genai'
import sharp from 'sharp'
import type { GenerationParams } from '../types/index.js'
import { buildPrompt } from './promptBuilder.js'

const SYSTEM_INSTRUCTION =
  'You are a photorealistic architectural and spatial visualisation assistant. ' +
  'Your sole task is to composite a provided object into a provided space photograph, ' +
  'producing a single image that looks like an authentic photograph taken on location. ' +
  'Follow all spatial, lighting, scale, and compositional instructions precisely.'

const MAX_DIMENSION = 2048

/** Strips the data-URL prefix and resizes (if needed) so the longest side ≤ 2048px. Returns raw base64 JPEG. */
async function prepareImage(base64Input: string): Promise<string> {
  const raw = base64Input.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(raw, 'base64')

  const { width = 0, height = 0 } = await sharp(buffer).metadata()

  if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
    // Already within limits — re-encode as JPEG at 85% for consistency
    const jpeg = await sharp(buffer).jpeg({ quality: 85 }).toBuffer()
    return jpeg.toString('base64')
  }

  const resized = await sharp(buffer)
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer()

  return resized.toString('base64')
}

export interface GenerateResult {
  base64: string
  mimeType: string
}

/** Calls Gemini to composite one image. Throws on any failure. */
export async function generateSingleImage(
  spaceImageBase64: string,
  objectImageBase64: string,
  params: GenerationParams,
  angleName: string | null,
  annotationDescription?: string,
  objectRotationDegrees?: number,
): Promise<GenerateResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('API_KEY_MISSING')
  }

  const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: 'v1alpha' } })

  const [spaceData, objectData] = await Promise.all([
    prepareImage(spaceImageBase64),
    prepareImage(objectImageBase64),
  ])

  const prompt = buildPrompt(params, angleName, annotationDescription, objectRotationDegrees)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await (ai.models as any).generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'image/jpeg', data: spaceData } },
          { inlineData: { mimeType: 'image/jpeg', data: objectData } },
        ],
      },
    ],
    config: {
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      responseModalities: ['IMAGE', 'TEXT'],
    },
  })

  const candidate = response?.candidates?.[0]
  if (!candidate) throw new Error('No response returned by the AI model.')

  // Safety refusal — surface separately so the UI can show a specific message
  if (candidate.finishReason === 'SAFETY') {
    throw new Error('SAFETY_REFUSAL')
  }

  for (const part of candidate.content?.parts ?? []) {
    if (part.inlineData?.data) {
      return {
        base64: part.inlineData.data as string,
        mimeType: (part.inlineData.mimeType as string | undefined) ?? 'image/jpeg',
      }
    }
  }

  throw new Error('The AI model returned a response but no image was found in it.')
}
