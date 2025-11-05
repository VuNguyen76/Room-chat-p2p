import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { User } from '../types/index'

interface UserState {
  user: User | null
  isAuthenticated: boolean
}

interface UserActions {
  setUser: (user: User | null) => void
  updateUser: (updates: Partial<User>) => void
  logout: () => void
}

type UserStore = UserState & UserActions

export const useUserStore = create<UserStore>()(
  devtools(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,

      // Actions
      setUser: (user) => {
        set({ 
          user, 
          isAuthenticated: !!user 
        })
      },

      updateUser: (updates) => {
        const currentUser = get().user
        if (currentUser) {
          set({ 
            user: { ...currentUser, ...updates } 
          })
        }
      },

      logout: () => {
        set({ 
          user: null, 
          isAuthenticated: false 
        })
      },
    }),
    {
      name: 'user-store',
    }
  )
)
