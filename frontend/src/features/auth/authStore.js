import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,

  setAuth: ({ accessToken, refreshToken, user }) =>
    set({ accessToken, refreshToken, user }),

  clearAuth: () => set({ accessToken: null, refreshToken: null, user: null }),
}))
