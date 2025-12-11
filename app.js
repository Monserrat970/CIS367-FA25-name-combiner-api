const express = require('express')
const fs = require('fs')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3000

const logDir = path.join(__dirname, 'logs')
const logFile = path.join(logDir, 'output.log')

// Ensure log directory exists so we can append output from the API.
fs.mkdirSync(logDir, { recursive: true })

const randomGoodness = () => Number((Math.random() * 5).toFixed(1))

const buildCombinations = (name1, name2) => {
  const mid1 = Math.ceil(name1.length / 2)
  const mid2 = Math.ceil(name2.length / 2)

  // A handful of predictable mixes; we'll dedupe and trim to 3-5 entries.
  const candidates = [
    `${name1}${name2}`,
    `${name2}${name1}`,
    `${name1.slice(0, mid1)}${name2.slice(mid2 - 1)}`,
    `${name2.slice(0, mid2)}${name1.slice(mid1 - 1)}`,
    `${name1}-${name2}`,
    `${name1}${name2}${name1}`,
    `${name2}${name1}${name2}`,
  ]

  const unique = Array.from(new Set(candidates.filter(Boolean)))

  // Ensure we always return at least 3 combinations, max 5.
  while (unique.length < 3) {
    unique.push(`${name1}${unique.length}${name2}`)
  }

  return unique.slice(0, 5)
}

app.get('/api/combine', (req, res) => {
  const { name1, name2 } = req.query

  if (!name1 || !name2) {
    return res
      .status(400)
      .json({ error: 'Query parameters "name1" and "name2" are required.' })
  }

  const results = buildCombinations(name1, name2).map((name, idx) => ({
    id: idx + 1,
    name,
    goodness: randomGoodness(),
  }))

  const response = { name1, name2, results }

  fs.appendFile(
    logFile,
    `${new Date().toISOString()} | ${JSON.stringify(response)}\n`,
    (err) => {
      if (err) {
        console.error('Failed to write to log file:', err.message)
      }
    }
  )

  res.json(response)
})

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`)
})
