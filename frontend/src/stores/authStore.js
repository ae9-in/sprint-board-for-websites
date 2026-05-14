import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      organization: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, organization, accessToken) => {
        set({
          user,
          organization,
          accessToken,
          isAuthenticated: true,
        });
      },

      clearAuth: () => {
        set({
          user: null,
          organization: null,
          accessToken: null,
          isAuthenticated: false,
        });
      },

      updateAccessToken: (token) => {
        set({ accessToken: token });
      },
    }),
    {
      name: 'sprint-board-auth',
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name);
        },
      },
    }
  )
);