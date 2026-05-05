export type ObjectType = 'flat' | 'freestanding'
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
