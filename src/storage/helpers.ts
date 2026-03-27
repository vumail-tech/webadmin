type StorageValue = string | number | boolean | object | null;

export const storage = {
  getItem: (key: string): any => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setItem: (key: string, value: StorageValue): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // quota exceeded or SSR
    }
  },

  removeItem: (key: string): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};
