import { create } from 'zustand'
import { login as appLogin, logout as appLogout, getUser } from '../lib/appwrite'

const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  error: null,

  init: async () => {
    try {
      const user = await getUser()
      set({ user, loading: false })
    } catch {
      set({ user: null, loading: false })
    }
  },

  login: async (email, password) => {
    set({ error: null, loading: true })
    try {
      await appLogin(email, password)
      const user = await getUser()
      set({ user, loading: false })
    } catch (err) {
      set({ error: 'Incorrect email or password. Please try again.', loading: false })
      throw err
    }
  },

  logout: async () => {
    try {
      await appLogout()
    } catch { /* ignore */ }
    set({ user: null })
  },

  displayName: () => '',
  setDisplayName: () => {}
}))

export default useAuthStore
