/**
 * useKeyboard — Global keyboard shortcut composable.
 *
 * Registers keybindings at mount and cleans up at unmount.
 * Supports modifier keys (ctrl, shift, alt, meta).
 */
import { onMounted, onUnmounted } from 'vue';

interface KeyBinding {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  handler: () => void;
  description: string;
}

export function useKeyboard(bindings: KeyBinding[]) {
  function onKeyDown(e: KeyboardEvent) {
    // Don't intercept when typing in inputs
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    for (const binding of bindings) {
      const keyMatch = e.key.toLowerCase() === binding.key.toLowerCase();
      const ctrlMatch = binding.ctrl ? (e.ctrlKey || e.metaKey) : true;
      const shiftMatch = binding.shift ? e.shiftKey : true;

      if (keyMatch && ctrlMatch && shiftMatch) {
        e.preventDefault();
        binding.handler();
        return;
      }
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeyDown));
  onUnmounted(() => window.removeEventListener('keydown', onKeyDown));

  return { bindings };
}
