import { create } from 'zustand';

interface ThemeStore {
  dark: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  dark: true,
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

// Initialize from localStorage on client
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('theme');
  if (saved === 'light') {
    document.documentElement.classList.remove('dark');
    useThemeStore.setState({ dark: false });
  } else {
    // Default to dark
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }
}
