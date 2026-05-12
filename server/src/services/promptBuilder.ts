import type { GenerationParams } from '../types/index.js'

export const ANGLE_PRESETS: Record<string, string> = {
  'Straight-on front view':
    'Camera positioned at eye level directly in front of the object, facing it head-on. The viewer is standing facing the object straight ahead.',
  'Slightly elevated front view':
    'Camera raised to approximately 1.5 times average head height, angled slightly downward toward the object from the front. The viewer is looking down at a gentle angle.',
  'Low ground-level view':
    'Camera positioned at knee height, angled slightly upward toward the object. The object appears imposing and tall from this low vantage point.',
  '45° left front':
    "Camera at eye level, positioned diagonally in front of and to the left of the object. The object's left front corner faces the camera.",
  '45° right front':
    "Camera at eye level, positioned diagonally in front of and to the right of the object. The object's right front corner faces the camera.",
  'Side view (left)':
    'Camera directly to the left of the object at eye level, showing the complete left side profile of the object against the space.',
  'Side view (right)':
    'Camera directly to the right of the object at eye level, showing the complete right side profile of the object against the space.',
  '45° left rear':
    "Camera at eye level, positioned diagonally behind and to the left of the object. The object's left rear corner faces the camera.",
  '45° right rear':
    "Camera at eye level, positioned diagonally behind and to the right of the object. The object's right rear corner faces the camera.",
  'Wide establishing shot':
    'Camera pulled back to a wide vantage point showing the object small within the full context of the entire space. The environment dominates the frame.',
  "Aerial / bird's-eye":
    "Camera elevated significantly above the scene, looking nearly straight down at the object and surrounding space from a bird's-eye perspective.",
  'Close-up detail':
    "Camera positioned very close to the object, filling most of the frame with the object's surface, texture, and material detail. Only a small portion of the surrounding space is visible.",
}

const SIZE_DESCRIPTIONS: Record<string, string> = {
  small: 'small — less than 50 centimetres in its largest dimension',
  medium: 'medium — between 50 centimetres and 1.5 metres tall',
  large: 'large — between 1.5 and 3 metres tall',
  monumental: 'monumental — over 3 metres tall, dominating the space',
}

const PLACEMENT_DESCRIPTIONS: Record<string, string> = {
  centre: 'positioned at the centre of the space',
  left: 'positioned toward the left side of the space',
  right: 'positioned toward the right side of the space',
  background: 'positioned in the far background of the space',
  foreground: 'positioned in the near foreground of the space',
  wall: 'mounted on or positioned directly against a wall',
}

const LIGHTING_DESCRIPTIONS: Record<string, string> = {
  dawn: 'dawn light — very soft, warm orange-pink light just above the horizon, long dramatic shadows',
  morning: 'morning light — bright directional light from a low sun, warm golden tone, medium-length shadows',
  midday: 'midday light — overhead sunlight, strong and neutral-white, short shadows directly beneath objects',
  'golden hour': 'golden hour light — very warm, low-angle amber sunlight from the side, long soft shadows',
  dusk: 'dusk light — fading warm light near the horizon, deep blue-purple sky beginning, very long shadows',
  overcast: 'overcast light — diffuse, even, shadowless lighting from a uniformly cloudy sky, no directional shadows',
}

const WEATHER_DESCRIPTIONS: Record<string, string> = {
  'clear sky': 'clear sky with no clouds',
  'partly cloudy': 'partly cloudy sky with some clouds casting occasional shadow',
  overcast: 'completely overcast sky, heavy grey clouds',
  'after rain': 'after recent rain — wet surfaces, slight reflections on the ground, moist vegetation',
}

/**
 * Assembles a photorealistic compositing prompt from the user's parameter selections.
 * - `angleName` null → Gemini infers camera angle from the space photo context.
 * - `annotationDescription` overrides the placement parameter when present.
 * - `objectRotationDegrees` overrides the object's orientation when present.
 */
export function buildPrompt(
  params: GenerationParams,
  angleName: string | null,
  annotationDescription?: string,
  objectRotationDegrees?: number,
): string {
  const angleDescription = angleName ? ANGLE_PRESETS[angleName] : null
  const sizeDescription =
    params.objectSize === 'custom' && params.customSizeDescription.trim()
      ? params.customSizeDescription.trim()
      : SIZE_DESCRIPTIONS[params.objectSize] ?? 'medium — between 50 centimetres and 1.5 metres tall'
  const placementDescription = PLACEMENT_DESCRIPTIONS[params.placement]
  const lightingDescription = LIGHTING_DESCRIPTIONS[params.timeOfDay]
  const weatherDescription = WEATHER_DESCRIPTIONS[params.weather]
  const objectTypeDescription =
    params.objectType === 'flat'
      ? 'a flat, wall-mounted object (such as a painting, panel, or relief)'
      : 'a freestanding three-dimensional object'

  const viewingAngleSection = angleDescription
    ? `Viewing angle for this image:\n${angleDescription}`
    : `Viewing angle for this image:\nUse the same camera viewpoint and perspective already established in the first (space) image. ` +
      `Do not alter the camera position, focal length, or perspective — composite the object as if the original scene photographer simply placed it there.`

  const basePrompt = `Place the object shown in the second image into the space shown in the first image.

Object characteristics:
- Type: ${objectTypeDescription}
- Size: ${sizeDescription}
- Placement within the space: ${placementDescription}

Lighting and atmosphere:
- ${lightingDescription}
- Weather: ${weatherDescription}
- The object must cast a shadow that is consistent with the direction, intensity, and colour temperature of this lighting. The shadow should fall naturally onto the ground or nearby surfaces.

${viewingAngleSection}

Placement discipline (critical — follow exactly):
- Place the object at the precise depth and position specified. Do not second-guess or adjust the depth for aesthetic reasons.
- If the specified location is adjacent to background elements (hedges, walls, trees, bushes, etc.), the object must appear physically touching or immediately in front of those elements — there must be no visible empty gap of ground between the object's base and the background feature.
- Do not move the object forward (closer to the camera) relative to the specified position.

Output requirements:
- Produce a single photorealistic composite photograph
- The result must look like a real photograph taken on location, not a digital render, illustration, or collage
- Maintain the correct sense of scale, perspective, and depth given the object size and viewing angle
- No text overlays, captions, watermarks, or borders in the composition
- Photographic quality with natural depth of field`

  let prompt = basePrompt

  if (objectRotationDegrees !== undefined && objectRotationDegrees !== 0) {
    prompt +=
      `\n\nObject rotation override (apply before placing in scene):\n` +
      `Rotate the object exactly ${objectRotationDegrees}° clockwise around its vertical axis relative to ` +
      `the orientation it is shown in the reference (second) image. ` +
      `This means the face that is currently pointing forward in the reference should now face ` +
      `${objectRotationDegrees}° clockwise from its original direction. ` +
      `Ensure the shadows, highlights, and reflections on the object are consistent with this new orientation.`
  }

  if (annotationDescription && annotationDescription.trim().length > 0) {
    prompt += `\n\nAnnotation-based placement override (highest priority — takes precedence over the placement parameter above):\n${annotationDescription.trim()}`
  }

  if (params.freeNote && params.freeNote.trim().length > 0) {
    prompt += `\n\nAdditional instruction from the user: ${params.freeNote.trim()}`
  }

  return prompt
}
