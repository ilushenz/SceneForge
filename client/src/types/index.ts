export type ObjectType = 'flat' | 'freestanding'

// ── Annotation types ──────────────────────────────────────────────────────────

export interface BrushPoint {
  /** X coordinate as a fraction of canvas width (0–1) */
  x: number
  /** Y coordinate as a fraction of canvas height (0–1) */
  y: number
}

export interface BrushStroke {
  /** Ordered list of points in this stroke */
  points: BrushPoint[]
  /** Brush radius in pixels at the time of drawing — stored as fraction of canvas width */
  radiusFraction: number
  /** true = erase, false = paint */
  erase: boolean
}

export interface PlacementLine {
  /** Start handle — fractions of canvas dimensions */
  x1: number
  y1: number
  /** End handle — fractions of canvas dimensions */
  x2: number
  y2: number
}

export interface AnnotationState {
  strokes: BrushStroke[]
  line: PlacementLine | null
}
export type ObjectSize = 'small' | 'medium' | 'large' | 'monumental' | 'custom'
export type Placement = 'centre' | 'left' | 'right' | 'background' | 'foreground' | 'wall'
export type TimeOfDay = 'dawn' | 'morning' | 'midday' | 'golden hour' | 'dusk' | 'overcast'
export type Weather = 'clear sky' | 'partly cloudy' | 'overcast' | 'after rain'

export interface GenerationParams {
  objectType: ObjectType
  objectSize: ObjectSize
  customSizeDescription: string
  placement: Placement
  timeOfDay: TimeOfDay
  weather: Weather
  freeNote: string
}

export type ImageStatus = 'idle' | 'generating' | 'retrying' | 'done' | 'error'

export interface ResultImage {
  angle: string
  status: ImageStatus
  base64?: string
  mimeType?: string
  errorMessage?: string
}

export interface SessionState {
  spaceImageBase64: string | null
  spaceImageName: string | null
  objectImageBase64: string | null
  objectImageName: string | null
  params: GenerationParams
  selectedAngles: string[]
  results: ResultImage[]
  annotation: AnnotationState
}
