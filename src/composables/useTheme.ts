/**
 * useTheme — Reactive dark/light mode composable.
 *
 * Persists preference to localStorage and respects system preference
 * via prefers-color-scheme media query on first load.
 */
import { ref, watch, onMounted } from 'vue';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'cloudpulse-theme';

export function useTheme() {
  const theme = ref<Theme>('dark');

  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark';
  }

  function applyTheme(t: Theme) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem(STORAGE_KEY, t);
  }

  onMounted(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored) {
      theme.value = stored;
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme.value = prefersDark ? 'dark' : 'light';
    }
    applyTheme(theme.value);
  });

  watch(theme, applyTheme);

  return { theme, toggle };
}
