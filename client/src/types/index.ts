export type ObjectType = 'flat' | 'freestanding'
export type ObjectSize = 'small' | 'medium' | 'large' | 'monumental'
export type Placement = 'centre' | 'left' | 'right' | 'background' | 'foreground' | 'wall'
export type TimeOfDay = 'dawn' | 'morning' | 'midday' | 'golden hour' | 'dusk' | 'overcast'
export type Weather = 'clear sky' | 'partly cloudy' | 'overcast' | 'after rain'

export interface GenerationParams {
  objectType: ObjectType
  objectSize: ObjectSize
  placement: Placement
  timeOfDay: TimeOfDay
  weather: Weather
  freeNote: string
}

export type ImageStatus = 'idle' | 'generating' | 'done' | 'error'

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
}
