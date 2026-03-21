import { create } from 'zustand';

interface ThemeStore {
  dark: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  dark: false,
  toggleTheme: () => {
    const next = !get().dark;
    set({ dark: next });
    if (typeof window !== 'undefined') {
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }
  },
}));

// Initialize from localStorage / system preference on client
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === 'dark' || (!saved && prefersDark)) {
    document.documentElement.classList.add('dark');
    useThemeStore.setState({ dark: true });
  }
}
