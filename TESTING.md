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

- [x] Are all five parameter sections visible in the left panel below the upload zones? (Object type, Object size, Placement, Time of day, Weather)
- [x] Do the radio cards highlight with a blue border when selected?
- [x] Is **Freestanding 3D object** pre-selected for Object type?
- [x] Is **Medium** pre-selected for Object size?
- [x] Is **Centre** pre-selected for Placement?
- [x] Is **Golden hour** pre-selected for Time of day?
- [x] Is **Clear sky** pre-selected for Weather?
- [x] Can you select each option in each section (only one at a time highlights)?
- [x] Is the Additional note textarea visible with placeholder text?
- [x] Does the character counter update as you type in the note field?
- [x] Does the counter turn red when you reach 500 characters?
- [x] Does the left panel scroll smoothly to show all sections?

---

## Phase 4 — Angle Selector

Open `http://localhost:5173` and check each item:

- [x] Is a 12-card angle grid visible below the configuration form?
- [x] Does clicking a card highlight it (blue border)?
- [x] Does the "X of 4 selected" counter update in real time?
- [x] Is the counter red when fewer than 4 are selected?
- [x] Does the counter turn green when exactly 4 are selected?
- [x] When you click a 5th card, does the first-selected card automatically deselect (so you stay at 4)?
- [x] Does the Generate button activate (turn blue) only when both photos are uploaded AND exactly 4 angles are selected?
- [ ] Are the angle cards keyboard-accessible (Tab to navigate, Space/Enter to select)?

---

## Phase 5 — API Integration & Generation

Open `http://localhost:5173` and check each item:

- [ ] Upload both photos, select 4 angles, click Generate
- [ ] Do 4 progress spinners appear immediately in the results panel, each labelled with an angle name?
- [ ] Do images appear in their slots as each one finishes (not all at once)?
- [ ] After all 4 finish, is a 2×2 grid of images visible?
- [ ] With a missing or wrong API key in `.env`: does a readable error message appear in the failed slots (no crash)?
- [ ] After a successful generation, can you change a parameter and click Generate again to produce new images?

---

## Phase 6 — Results Display & Downloads

Open `http://localhost:5173` and check each item:

- [ ] Are the 4 images displayed in a 2×2 grid with angle labels below each?
- [ ] Does each image fade in smoothly as it arrives?
- [ ] Click an image — does a full-screen lightbox open?
- [ ] Does pressing Escape close the lightbox?
- [ ] Does clicking outside the image close the lightbox?
- [ ] Click **↓ Save** under one image — does a JPEG file download?
- [ ] Is the downloaded file named `sceneforge-[angle-name].jpg`?
- [ ] Click **↓ Download all as ZIP** — does a ZIP file download?
- [ ] Open the ZIP — are all completed images inside, correctly named?
- [ ] If one slot has an error, does a **↺ Retry this angle** button appear?
