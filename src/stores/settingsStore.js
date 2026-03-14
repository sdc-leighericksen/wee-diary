import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useSettingsStore = create(
  persist(
    (set) => ({
      displayName: '',
      dailyFluidTarget: 2000,
      smartReminderEnabled: true,
      smartReminderHour: 10,
      userWeightKg: null,
      continenceProducts: [], // [{ id, name, dryWeightG }]

      setDisplayName: (name) => set({ displayName: name }),
      setDailyFluidTarget: (ml) => set({ dailyFluidTarget: ml }),
      setSmartReminderEnabled: (enabled) => set({ smartReminderEnabled: enabled }),
      setSmartReminderHour: (hour) => set({ smartReminderHour: hour }),
      setUserWeightKg: (kg) => set({ userWeightKg: kg }),

      addContinenceProduct: (product) =>
        set(s => ({
          continenceProducts: [
            ...s.continenceProducts,
            { id: String(Date.now()), ...product },
          ],
        })),

      removeContinenceProduct: (id) =>
        set(s => ({
          continenceProducts: s.continenceProducts.filter(p => p.id !== id),
        })),
    }),
    { name: 'wee-diary-settings' }
  )
)

export default useSettingsStore
