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

- [x] Click the **Space photo** zone — does a file picker open?
- [x] Upload a JPG — does a thumbnail preview appear inside the zone?
- [x] Is the filename shown below the thumbnail?
- [x] Click the **×** button — does the preview clear and the zone return to its empty state?
- [x] Try uploading a PDF or non-image file — does a clear error message appear?
- [x] Try uploading an image over 10 MB — does an error message with the file size appear?
- [x] Upload both photos — are both previews showing correctly?
- [x] Is the Generate button still greyed out (both photos uploaded but no angles selected yet)?
- [x] Does drag-and-drop work? (drag a photo file onto the zone)

---

## Phase 3 — Configuration Form

Open `http://localhost:5173` and check each item:

- [ ] Are all five parameter sections visible in the left panel below the upload zones? (Object type, Object size, Placement, Time of day, Weather)
- [ ] Do the radio cards highlight with a blue border when selected?
- [ ] Is **Freestanding 3D object** pre-selected for Object type?
- [ ] Is **Medium** pre-selected for Object size?
- [ ] Is **Centre** pre-selected for Placement?
- [ ] Is **Golden hour** pre-selected for Time of day?
- [ ] Is **Clear sky** pre-selected for Weather?
- [ ] Can you select each option in each section (only one at a time highlights)?
- [ ] Is the Additional note textarea visible with placeholder text?
- [ ] Does the character counter update as you type in the note field?
- [ ] Does the counter turn red when you reach 500 characters?
- [ ] Does the left panel scroll smoothly to show all sections?
