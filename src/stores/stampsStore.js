import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const MILESTONES = [
  { days: 1,   emoji: '⭐',  label: '1 day' },
  { days: 3,   emoji: '✨',  label: '3 days' },
  { days: 7,   emoji: '🌟',  label: '1 week' },
  { days: 14,  emoji: '🏆',  label: '2 weeks' },
  { days: 21,  emoji: '💎',  label: '3 weeks' },
  { days: 30,  emoji: '👑',  label: '1 month' },
]

const useStampsStore = create(
  persist(
    (set, get) => ({
      currentStreak: 0,
      longestStreak: 0,
      collectedStamps: [], // array of milestone day values that have been earned
      newStamp: null,      // { emoji, label } of a newly earned stamp, or null

      checkAndUpdateStreak: (streak) => {
        const { longestStreak, currentStreak, collectedStamps } = get()

        const newLongest = Math.max(longestStreak, streak)

        // Reset collectedStamps when streak is broken (goes from > 0 to 0)
        const streakBroken = currentStreak > 0 && streak === 0
        const newCollectedStamps = streakBroken ? [] : collectedStamps

        // Find any newly earned milestones
        const newlyEarned = MILESTONES.filter(
          m => streak >= m.days && !newCollectedStamps.includes(m.days)
        )

        // Pick the highest newly earned milestone to celebrate
        const celebrate = newlyEarned.length > 0
          ? newlyEarned[newlyEarned.length - 1]
          : null

        set({
          currentStreak: streak,
          longestStreak: newLongest,
          collectedStamps: [
            ...newCollectedStamps,
            ...newlyEarned.map(m => m.days),
          ],
          newStamp: celebrate ? { emoji: celebrate.emoji, label: celebrate.label } : get().newStamp,
        })
      },

      clearNewStamp: () => set({ newStamp: null }),
    }),
    { name: 'wee-diary-stamps' }
  )
)

export default useStampsStore
