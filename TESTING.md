# SceneForge — Testing Checklist

## Phase 1 — Project Scaffold & Layout Shell

Open `http://localhost:5173` and check each item:

- [x] The app loads without errors (no red error screen)
- [x] There is a top bar showing **SceneForge**
- [x] The screen is divided into two panels (left narrow, right wide)
- [x] The left panel shows the section headings **Upload Photos**, **Configure**, **Select Angles**
- [x] The Generate button is visible but greyed out (cannot be clicked)
- [x] The right panel shows placeholder text about images appearing there

---

## Phase 2 — Photo Upload & Preview

Open `http://localhost:5173` and check each item:

- [ ] Click the **Space photo** zone — does a file picker open?
- [ ] Upload a JPG — does a thumbnail preview appear inside the zone?
- [ ] Is the filename shown below the thumbnail?
- [ ] Click the **×** button — does the preview clear and the zone return to its empty state?
- [ ] Try uploading a PDF or non-image file — does a clear error message appear?
- [ ] Try uploading an image over 10 MB — does an error message with the file size appear?
- [ ] Upload both photos — are both previews showing correctly?
- [ ] Is the Generate button still greyed out (both photos uploaded but no angles selected yet)?
- [ ] Does drag-and-drop work? (drag a photo file onto the zone)
