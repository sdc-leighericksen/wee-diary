import { create } from 'zustand'
import { getReminders, saveReminders } from '../lib/appwrite'

const useRemindersStore = create((set, get) => ({
  reminderTimes: ['08:00', '13:00', '18:00'],
  enabled: true,
  pushSubscription: null,
  loading: false,

  fetch: async (userId) => {
    set({ loading: true })
    try {
      const doc = await getReminders(userId)
      if (doc) {
        set({
          reminderTimes: doc.reminderTimes || ['08:00', '13:00', '18:00'],
          enabled: doc.enabled ?? true,
          pushSubscription: doc.pushSubscription || null,
          loading: false
        })
      } else {
        set({ loading: false })
      }
    } catch {
      set({ loading: false })
    }
  },

  save: async (userId) => {
    const { reminderTimes, enabled, pushSubscription } = get()
    await saveReminders(userId, { reminderTimes, enabled, pushSubscription })
  },

  addTime: (time) => set(s => ({
    reminderTimes: [...s.reminderTimes, time].sort()
  })),

  removeTime: (time) => set(s => ({
    reminderTimes: s.reminderTimes.filter(t => t !== time)
  })),

  toggleEnabled: () => set(s => ({ enabled: !s.enabled })),

  setPushSubscription: (sub) => set({ pushSubscription: sub })
}))

export default useRemindersStore
