# SceneForge

SceneForge lets you upload a photo of a space and a photo of an object, then generates four photorealistic images showing the object placed convincingly in that space — each from a different viewing angle. It uses Google's Gemini AI for the image generation.

---

## Prerequisites

- **Node.js 18 or newer** — download from https://nodejs.org (click "LTS")
- A **Gemini API key** — free from Google AI Studio (see below)

---

## How to get a Gemini API key

1. Go to https://aistudio.google.com/apikey
2. Sign in with a Google account
3. Click **"Create API key"**
4. Copy the key (it starts with `AIza...`)
5. Keep it somewhere safe — you'll paste it into the `.env` file

---

## Installation

1. Open a terminal in the `sceneforge` folder
2. Run `npm install`
3. Copy `.env.example` to `.env` — open `.env` in any text editor, paste your Gemini API key after `GEMINI_API_KEY=`, and save
4. Run `npm run dev`
5. Open `http://localhost:5173` in a browser

That is all.

---

## Common problems

**"API key not working"**
Check for spaces before or after the key in your `.env` file. The line should look exactly like:
`GEMINI_API_KEY=AIzaSy...` (no spaces around the `=`)

**"Generation takes too long"**
The AI model can take 30–90 seconds per image — this is normal. You'll see a progress indicator for each of the four images as they generate.

**"One image failed but others worked"**
Click the **"Retry this angle"** button under the failed image slot. The other three are unaffected.

**"Images look like illustrations, not photos"**
Add `professional photograph, photorealistic` to the **Additional note** field before generating.
