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

const TABS = [
  { category: 'bug', gid: '1444012947' },
  { category: 'fish', gid: '1221813516' },
  { category: 'sea', gid: '607204748' },
]

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

function normalizeRow(row, category) {
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

async function main() {
  const all = []

  for (const { category, gid } of TABS) {
    const rows = await fetchTabRows(gid)
    const normalized = rows
      .map((row) => normalizeRow(row, category))
      .filter(Boolean)
    console.log(`${category}: ${normalized.length} entries`)
    all.push(...normalized)
  }

  all.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))

  const outPath = fileURLToPath(new URL('../src/data/collectibles.json', import.meta.url))
  await writeFile(outPath, JSON.stringify(all, null, 2) + '\n', 'utf-8')
  console.log(`\nWrote ${all.length} collectibles to ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
