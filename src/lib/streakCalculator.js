import { format, subDays } from 'date-fns'

/**
 * Calculate the current consecutive-day streak from a list of entries.
 * A day counts if at least one entry exists for it.
 * Walks backwards from today until a day with no entry is found.
 */
export function calculateStreak(entries) {
  if (!entries || entries.length === 0) return 0

  const datesWithEntries = new Set(
    entries.map(e => format(new Date(e.timestamp), 'yyyy-MM-dd'))
  )

  const today = format(new Date(), 'yyyy-MM-dd')

  // If nothing logged today, streak is 0
  if (!datesWithEntries.has(today)) return 0

  let streak = 0
  let current = new Date()

  while (true) {
    const dateStr = format(current, 'yyyy-MM-dd')
    if (datesWithEntries.has(dateStr)) {
      streak++
      current = subDays(current, 1)
    } else {
      break
    }
  }

  return streak
}
