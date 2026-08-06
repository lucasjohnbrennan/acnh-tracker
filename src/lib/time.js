// Pure helpers for figuring out when (which month + hour range) the most
// collectibles are catchable, in a given hemisphere, excluding whatever the
// caller says is already caught. No dependency on the real-world clock —
// in ACNH you can time-travel to any month/hour, so "best" is a fact about
// the data, not about today's date.

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function isHourInWindows(hour, windows) {
  return windows.some(({ start, end }) => {
    if (start === end) return false
    if (start < end) return hour >= start && hour < end
    return hour >= start || hour < end // wraps past midnight
  })
}

export function isAvailable(collectible, hemisphere, month, hour) {
  const windows = collectible.availability[hemisphere][month - 1]
  return isHourInWindows(hour, windows)
}

// Builds a 12 (month) x 24 (hour) grid of { count, ids } for how many
// collectibles (excluding excludeIds) are catchable at that moment.
export function buildAvailabilityGrid(collectibles, hemisphere, excludeIds = new Set()) {
  const pool = collectibles.filter((c) => !excludeIds.has(c.id))

  const grid = []
  for (let month = 1; month <= 12; month++) {
    const row = []
    for (let hour = 0; hour < 24; hour++) {
      const ids = pool
        .filter((c) => isAvailable(c, hemisphere, month, hour))
        .map((c) => c.id)
      row.push({ count: ids.length, ids })
    }
    grid.push(row)
  }
  return grid
}

export function formatHour(hour) {
  const h = ((hour % 24) + 24) % 24
  const period = h < 12 ? 'AM' : 'PM'
  const display = h % 12 === 0 ? 12 : h % 12
  return `${display} ${period}`
}

// Groups a month's hours into contiguous runs sharing the same (max) count.
function findRunsForMonth(hourRow, targetCount) {
  const runs = []
  let current = null

  for (let hour = 0; hour < 24; hour++) {
    if (hourRow[hour].count === targetCount) {
      if (current) {
        current.endHour = hour + 1
      } else {
        current = { startHour: hour, endHour: hour + 1, ids: hourRow[hour].ids }
      }
    } else if (current) {
      runs.push(current)
      current = null
    }
  }
  if (current) runs.push(current)

  // Merge a trailing run into a leading run if both touch midnight (23 -> 0).
  if (runs.length > 1) {
    const first = runs[0]
    const last = runs[runs.length - 1]
    if (first.startHour === 0 && last.endHour === 24 && runs.length > 1) {
      first.startHour = last.startHour
      first.wrapsFromPreviousDay = true
      runs.pop()
    }
  }

  return runs
}

// Finds the best (month, hour-range) to time-travel to: the one with the
// most catchable species. Ties are broken by picking the longest window,
// then the earliest month/hour.
export function findBestTime(collectibles, hemisphere, excludeIds = new Set()) {
  const grid = buildAvailabilityGrid(collectibles, hemisphere, excludeIds)

  let maxCount = 0
  for (const row of grid) {
    for (const cell of row) {
      if (cell.count > maxCount) maxCount = cell.count
    }
  }

  if (maxCount === 0) {
    return { month: null, monthName: null, startHour: null, endHour: null, count: 0, ids: [], label: 'Nothing new to catch right now' }
  }

  const candidates = []
  grid.forEach((hourRow, monthIndex) => {
    const runs = findRunsForMonth(hourRow, maxCount)
    runs.forEach((run) => {
      candidates.push({ month: monthIndex + 1, ...run })
    })
  })

  candidates.sort((a, b) => {
    const durationA = (a.endHour - a.startHour + 24) % 24 || 24
    const durationB = (b.endHour - b.startHour + 24) % 24 || 24
    if (durationB !== durationA) return durationB - durationA
    if (a.month !== b.month) return a.month - b.month
    return a.startHour - b.startHour
  })

  const best = candidates[0]
  const startLabel = formatHour(best.startHour)
  const endLabel = formatHour(best.endHour === 24 ? 0 : best.endHour)

  return {
    month: best.month,
    monthName: MONTH_NAMES[best.month - 1],
    startHour: best.startHour,
    endHour: best.endHour,
    count: maxCount,
    ids: best.ids,
    label: `${MONTH_NAMES[best.month - 1]}, ${startLabel} – ${endLabel}`,
  }
}

// Formats an array of { start, end } windows (as stored per month in the
// master data) into a human string, e.g. "4 AM – 9 PM" or "Not available".
export function formatWindows(windows) {
  if (!windows || windows.length === 0) return 'Not available'
  if (windows.length === 1 && windows[0].start === 0 && windows[0].end === 24) return 'All day'
  return windows
    .map(({ start, end }) => `${formatHour(start)} – ${formatHour(end === 24 ? 0 : end)}`)
    .join(' & ')
}

// Convenience: how many species (excluding excludeIds) are catchable right
// now, for a given hemisphere + month + hour — used to show "currently
// catchable" lists without recomputing the whole grid.
export function catchableNow(collectibles, hemisphere, month, hour, excludeIds = new Set()) {
  return collectibles.filter(
    (c) => !excludeIds.has(c.id) && isAvailable(c, hemisphere, month, hour)
  )
}
