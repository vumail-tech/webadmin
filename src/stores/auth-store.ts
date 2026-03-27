import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { storage } from "@/storage/helpers";
import { authClient } from "@/lib/auth-client";

interface UserType {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  role?: string;
}

interface AuthStore {
  token: string | null;
  user: UserType | null;
  loading: boolean;

  setAuth: (payload: { token: string; user: UserType }) => void;
  setAuthLoading: (state: boolean) => void;
  logout: () => Promise<void>;
  hydrate: () => void;
  syncSession: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  devtools((set, get) => ({
    token: null,
    user: null,
    loading: true,

    setAuth: ({ token, user }) => {
      set({ token, user, loading: false });
      storage.setItem("session", { token, user });
    },

    setAuthLoading: (state: boolean) => {
      set({ loading: state });
    },

    logout: async () => {
      try {
        await authClient.signOut();
      } catch {}
      set({ token: null, user: null, loading: false });
      storage.removeItem("session");
      if (typeof window !== "undefined") {
        window.location.href = "/signin";
      }
    },

    hydrate: () => {
      const cached = storage.getItem("session");
      if (cached?.token && cached?.user) {
        set({ token: cached.token, user: cached.user, loading: false });
      } else {
        set({ loading: false });
      }
      void get().syncSession();
    },

    syncSession: async () => {
      try {
        const { data } = await authClient.getSession();
        if (data?.user && data?.token) {
          set({ token: data.token, user: data.user, loading: false });
          storage.setItem("session", { token: data.token, user: data.user });
        } else {
          set({ loading: false });
        }
      } catch {
        set({ loading: false });
      }
    },
  }))
);
