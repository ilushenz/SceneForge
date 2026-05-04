import { useSessionStore } from '../../stores/sessionStore'
import { UploadZone } from './UploadZone'

export function UploadPanel() {
  const {
    spaceImageBase64, spaceImageName,
    objectImageBase64, objectImageName,
    setSpaceImage, setObjectImage,
  } = useSessionStore()

  return (
    <section>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Upload Photos</h3>
      <div className="space-y-3">
        <UploadZone
          label="Space photo"
          hint="The room, garden, or space where the object will be placed"
          imageBase64={spaceImageBase64}
          imageName={spaceImageName}
          onUpload={(b64, name) => setSpaceImage(b64, name)}
          onRemove={() => setSpaceImage(null, null)}
        />
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
