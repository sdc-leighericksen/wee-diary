import { create } from 'zustand'
import { createEntry, listEntries, updateEntry, deleteEntry } from '../lib/appwrite'
import { startOfDay, endOfDay, subDays, format } from 'date-fns'

const useEntriesStore = create((set, get) => ({
  entries: [],
  loading: false,
  error: null,

  fetchEntries: async (userId, start, end) => {
    set({ loading: true, error: null })
    try {
      const startStr = start.toISOString()
      const endStr = end.toISOString()
      const res = await listEntries(userId, startStr, endStr, 500)
      set({ entries: res.documents, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  fetchToday: async (userId) => {
    const now = new Date()
    await get().fetchEntries(userId, startOfDay(now), endOfDay(now))
  },

  fetchStreakEntries: async (userId, days = 120) => {
    try {
      const now = new Date()
      const res = await listEntries(userId, subDays(now, days).toISOString(), endOfDay(now).toISOString(), 500)
      return res.documents
    } catch {
      return []
    }
  },

  addEntry: async (data) => {
    try {
      const doc = await createEntry(data)
      set(s => ({ entries: [doc, ...s.entries] }))
      return doc
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },

  editEntry: async (id, data) => {
    try {
      const doc = await updateEntry(id, data)
      set(s => ({ entries: s.entries.map(e => e.$id === id ? doc : e) }))
      return doc
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },

  removeEntry: async (id) => {
    try {
      await deleteEntry(id)
      set(s => ({ entries: s.entries.filter(e => e.$id !== id) }))
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },

  getTodayEntries: () => {
    const now = new Date()
    return get().entries.filter(e => {
      const d = new Date(e.timestamp)
      return d.getFullYear() === now.getFullYear() &&
             d.getMonth() === now.getMonth() &&
             d.getDate() === now.getDate()
    })
  },

  getTodaySummary: () => {
    const today = get().getTodayEntries()
    const fluids = today.filter(e => e.entryType === 'fluid')
    const voids = today.filter(e => e.entryType === 'void')
    const changes = today.filter(e => e.entryType === 'change')
    const leaks = voids.filter(e => e.leaked)
    return {
      drinkCount: fluids.length,
      totalFluid: fluids.reduce((sum, e) => sum + (e.fluidAmount || 0), 0),
      voidCount: voids.length,
      leakCount: leaks.length,
      changeCount: changes.length
    }
  }
}))

export default useEntriesStore
