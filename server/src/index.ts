/**
 * SceneForge backend — Express server that proxies Gemini API calls.
 *
 * SETUP REQUIRED:
 *   GEMINI_API_KEY — your Google AI Studio API key.
 *   Get one free at: https://aistudio.google.com/apikey
 *   The free tier allows a limited number of generations per day.
 *   IMPORTANT: Never share this key or commit it to git. It is loaded
 *   from the .env file which is listed in .gitignore.
 */

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { generateRouter } from './routes/generate.js'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json({ limit: '50mb' }))

app.use('/api/generate', generateRouter)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`SceneForge server running on http://localhost:${PORT}`)
})
