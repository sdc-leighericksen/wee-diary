import { format, subDays } from 'date-fns'

export function calculateStreak(entries) {
  if (!entries || entries.length === 0) return 0

  const datesWithEntries = new Set(
    entries.map(e => format(new Date(e.timestamp), 'yyyy-MM-dd'))
  )

  const today = format(new Date(), 'yyyy-MM-dd')

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
