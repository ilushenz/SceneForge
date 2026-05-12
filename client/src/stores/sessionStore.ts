import { create } from 'zustand'
import type { AnnotationState, GenerationParams, ResultImage, SessionState } from '../types'

const DEFAULT_PARAMS: GenerationParams = {
  objectType: 'freestanding',
  objectSize: 'medium',
  customSizeDescription: '',
  placement: 'centre',
  timeOfDay: 'golden hour',
  weather: 'clear sky',
  freeNote: '',
}

const DEFAULT_ANNOTATION: AnnotationState = { strokes: [], line: null }

interface SessionStore extends SessionState {
  annotation: AnnotationState
  setSpaceImage: (base64: string | null, name: string | null) => void
  setObjectImage: (base64: string | null, name: string | null) => void
  setParam: <K extends keyof GenerationParams>(key: K, value: GenerationParams[K]) => void
  setSelectedAngles: (angles: string[]) => void
  setResults: (results: ResultImage[]) => void
  updateResult: (angle: string, update: Partial<ResultImage>) => void
  clearResults: () => void
  setAnnotation: (annotation: AnnotationState) => void
  clearAnnotation: () => void
}

export const useSessionStore = create<SessionStore>((set) => ({
  spaceImageBase64: null,
  spaceImageName: null,
  objectImageBase64: null,
  objectImageName: null,
  params: DEFAULT_PARAMS,
  selectedAngles: [],
  results: [],
  annotation: DEFAULT_ANNOTATION,

  setSpaceImage: (base64, name) => set({ spaceImageBase64: base64, spaceImageName: name }),
  setObjectImage: (base64, name) => set({ objectImageBase64: base64, objectImageName: name }),

  setParam: (key, value) =>
    set((state) => ({ params: { ...state.params, [key]: value } })),

  setSelectedAngles: (angles) => set({ selectedAngles: angles }),

  setResults: (results) => set({ results }),

  updateResult: (angle, update) =>
    set((state) => ({
      results: state.results.map((r) =>
        r.angle === angle ? { ...r, ...update } : r
      ),
    })),

  clearResults: () => set({ results: [] }),

  setAnnotation: (annotation) => set({ annotation }),

  clearAnnotation: () => set({ annotation: DEFAULT_ANNOTATION }),
}))
