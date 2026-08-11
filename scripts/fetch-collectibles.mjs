// Builds src/data/collectibles.json — the single master list of every ACNH
// bug, fish, and sea creature, with per-month/per-hemisphere catch windows.
//
// Source: the community-maintained "Data Spreadsheet for Animal Crossing New
// Horizons" (read-only, public). We pull the Insects / Fish / Sea Creatures
// tabs as CSV and normalize them into one schema.
//
// Run with: npm run build:data

import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import Papa from 'papaparse'

const SHEET_ID = '13d_LAJPlxMa_DubPTuirkIV4DERBMXbrWQsmSh8ReK4'
const ICON_CDN_BASE = 'https://nh-cdn.catalogue.ac/MenuIcon'
const FURNITURE_ICON_CDN_BASE = 'https://nh-cdn.catalogue.ac/FtrIcon'

// Bugs/fish/sea creatures: time-of-year/day dependent, one row per species.
const CRITTER_TABS = [
  { category: 'bug', gid: '1444012947' },
  { category: 'fish', gid: '1221813516' },
  { category: 'sea', gid: '607204748' },
]

// Fossils/artwork: not time dependent, so they get no `availability` field at
// all — that's the signal the app uses to keep them off the time-based Browse
// page and onto their own "Fossils & Art" page instead.
const FOSSIL_GID = '20463929'
const ARTWORK_GID = '643926250'

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

// \s also matches the non-breaking spaces (U+00A0) the sheet sometimes uses around the dash.
// The dash class covers hyphen (-) through horizontal bar (―), plus minus sign (−).
const TIME_RANGE_RE = /^(\d{1,2})\s(AM|PM)\s[-‐-―−]\s(\d{1,2})\s(AM|PM)$/

function to24Hour(hour, ampm) {
  const h = Number(hour) % 12
  return ampm === 'PM' ? h + 12 : h
}

// Returns an array of { start, end } windows (0-23 hours), empty if not available
// that month. end < start means the window wraps past midnight. Some species have
// two windows in a day (e.g. "9 AM – 4 PM; 9 PM – 4 AM"), separated by ";".
function parseTimeWindows(raw) {
  const str = (raw || '').trim()
  if (!str || str.toUpperCase() === 'NA') return []
  if (str.toLowerCase() === 'all day') return [{ start: 0, end: 24 }]

  return str.split(';').map((segment) => {
    const trimmed = segment.trim()
    const match = trimmed.match(TIME_RANGE_RE)
    if (!match) {
      console.warn(`Unrecognized time window: "${raw}"`)
      return null
    }
    const [, startHour, startAmPm, endHour, endAmPm] = match
    return {
      start: to24Hour(startHour, startAmPm),
      end: to24Hour(endHour, endAmPm),
    }
  }).filter(Boolean)
}

function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function titleCase(name) {
  return name.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1))
}

function toNumber(value) {
  const n = Number(String(value ?? '').trim())
  return Number.isFinite(n) ? n : null
}

async function fetchTabRows(gid) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch gid ${gid}: HTTP ${res.status}`)
  const csv = await res.text()
  const { data, errors } = Papa.parse(csv, { header: true, skipEmptyLines: true })
  if (errors.length) console.warn(`CSV parse warnings for gid ${gid}:`, errors.slice(0, 3))
  return data
}

function buildAvailability(row, hemispherePrefix) {
  return MONTHS.map((month) => parseTimeWindows(row[`${hemispherePrefix} ${month}`]))
}

function normalizeCritterRow(row, category) {
  const name = (row.Name || '').trim()
  if (!name) return null

  return {
    id: `${category}-${slugify(name)}`,
    name: titleCase(name),
    category,
    price: toNumber(row.Sell),
    location: category === 'sea' ? 'Sea' : (row['Where/How'] || null),
    size: row.Size || null,
    shadowSize: category !== 'bug' ? (row.Shadow || null) : null,
    weather: category === 'bug' ? (row.Weather || null) : null,
    movementSpeed: category === 'sea' ? (row['Movement Speed'] || null) : null,
    catchDifficulty: category === 'fish' ? (row['Catch Difficulty'] || null) : null,
    description: row.Description || null,
    catchPhrase: row['Catch phrase'] || null,
    iconUrl: row['Icon Filename'] ? `${ICON_CDN_BASE}/${row['Icon Filename'].trim()}.png` : null,
    availability: {
      north: buildAvailability(row, 'NH'),
      south: buildAvailability(row, 'SH'),
    },
  }
}

function normalizeFossilRow(row) {
  const name = (row.Name || '').trim()
  if (!name) return null

  return {
    id: `fossil-${slugify(name)}`,
    name: titleCase(name),
    category: 'fossil',
    price: toNumber(row.Sell),
    fossilGroup: row['Fossil Group'] ? titleCase(row['Fossil Group'].trim()) : null,
    description: row.Description || null,
    iconUrl: row.Filename ? `${FURNITURE_ICON_CDN_BASE}/${row.Filename.trim()}.png` : null,
  }
}

// The Artwork tab has two rows per piece when a counterfeit exists (a
// "Genuine: Yes" row and a "Genuine: No" row with the same Name). We only
// want the real one to show up as a trackable collectible — the fake isn't
// something you catch/donate, it's a trap to avoid — so rows are grouped by
// Name first, and only the genuine row survives, carrying a `hasFake` flag.
function normalizeArtworkRows(rows) {
  const byName = new Map()
  for (const row of rows) {
    const name = (row.Name || '').trim()
    if (!name) continue
    if (!byName.has(name)) byName.set(name, [])
    byName.get(name).push(row)
  }

  const out = []
  for (const [name, variants] of byName) {
    const genuine = variants.find((r) => (r.Genuine || '').trim().toLowerCase() === 'yes')
    if (!genuine) continue
    const hasFake = variants.some((r) => (r.Genuine || '').trim().toLowerCase() === 'no')

    out.push({
      id: `art-${slugify(name)}`,
      name: titleCase(name),
      category: 'art',
      price: toNumber(genuine.Sell),
      hasFake,
      realArtworkTitle: genuine['Real Artwork Title'] || null,
      artist: genuine.Artist || null,
      description: genuine.Description || null,
      iconUrl: genuine.Filename ? `${FURNITURE_ICON_CDN_BASE}/${genuine.Filename.trim()}.png` : null,
    })
  }
  return out
}

async function main() {
  const all = []

  for (const { category, gid } of CRITTER_TABS) {
    const rows = await fetchTabRows(gid)
    const normalized = rows
      .map((row) => normalizeCritterRow(row, category))
      .filter(Boolean)
    console.log(`${category}: ${normalized.length} entries`)
    all.push(...normalized)
  }

  const fossilRows = await fetchTabRows(FOSSIL_GID)
  const fossils = fossilRows.map(normalizeFossilRow).filter(Boolean)
  console.log(`fossil: ${fossils.length} entries`)
  all.push(...fossils)

  const artworkRows = await fetchTabRows(ARTWORK_GID)
  const artwork = normalizeArtworkRows(artworkRows)
  console.log(`art: ${artwork.length} entries`)
  all.push(...artwork)

  all.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))

  const outPath = fileURLToPath(new URL('../src/data/collectibles.json', import.meta.url))
  await writeFile(outPath, JSON.stringify(all, null, 2) + '\n', 'utf-8')
  console.log(`\nWrote ${all.length} collectibles to ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
