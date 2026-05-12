import { useSessionStore } from '../../stores/sessionStore'
import { AnnotationCanvas } from '../AnnotationCanvas'
import { UploadZone } from './UploadZone'

export function UploadPanel() {
  const {
    spaceImageBase64, spaceImageName,
    objectImageBase64, objectImageName,
    setSpaceImage, setObjectImage,
    annotation, setAnnotation, clearAnnotation,
  } = useSessionStore()

  const handleSpaceRemove = () => {
    setSpaceImage(null, null)
    clearAnnotation()
  }

  return (
    <section>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Upload Photos</h3>
      <div className="space-y-3">
        {/* Space photo — either upload zone or annotation canvas */}
        {spaceImageBase64 ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Space photo</p>
              <button
                onClick={handleSpaceRemove}
                className="text-[11px] font-semibold text-gray-600 hover:text-red-400 transition-colors"
              >
                Remove
              </button>
            </div>
            <AnnotationCanvas
              imageBase64={spaceImageBase64}
              imageName={spaceImageName}
              annotation={annotation}
              onChange={setAnnotation}
            />
          </div>
        ) : (
          <UploadZone
            label="Space photo"
            hint="The room, garden, or space where the object will be placed"
            imageBase64={null}
            imageName={null}
            onUpload={(b64, name) => { setSpaceImage(b64, name); clearAnnotation() }}
            onRemove={handleSpaceRemove}
          />
        )}

        {/* Object photo */}
        <UploadZone
          label="Object photo"
          hint="The sculpture, furniture, or object to place in the space"
          imageBase64={objectImageBase64}
          imageName={objectImageName}
          onUpload={(b64, name) => setObjectImage(b64, name)}
          onRemove={() => setObjectImage(null, null)}
        />
      </div>
    </section>
  )
}
