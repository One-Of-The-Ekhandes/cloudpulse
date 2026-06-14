/**
 * useVirtualScroll — High-performance virtual scrolling composable.
 *
 * Renders only visible items in a scrollable list, enabling smooth
 * scrolling through thousands of items without DOM bloat.
 * Implements overscan for seamless scroll experience.
 */
import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue';

interface VirtualScrollOptions<T> {
  items: Ref<T[]>;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

interface VirtualItem<T> {
  item: T;
  index: number;
  offsetTop: number;
}

export function useVirtualScroll<T>(options: VirtualScrollOptions<T>) {
  const { items, itemHeight, containerHeight, overscan = 5 } = options;

  const scrollTop = ref(0);
  const containerRef = ref<HTMLElement | null>(null);

  const totalHeight = computed(() => items.value.length * itemHeight);

  const visibleRange = computed(() => {
    const start = Math.max(0, Math.floor(scrollTop.value / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2 * overscan;
    const end = Math.min(items.value.length, start + visibleCount);
    return { start, end };
  });

  const visibleItems = computed<VirtualItem<T>[]>(() => {
    const { start, end } = visibleRange.value;
    const result: VirtualItem<T>[] = [];
    for (let i = start; i < end; i++) {
      result.push({
        item: items.value[i],
        index: i,
        offsetTop: i * itemHeight,
      });
    }
    return result;
  });

  function onScroll(e: Event) {
    const target = e.target as HTMLElement;
    scrollTop.value = target.scrollTop;
  }

  function scrollToIndex(index: number) {
    if (containerRef.value) {
      containerRef.value.scrollTop = index * itemHeight;
      scrollTop.value = index * itemHeight;
    }
  }

  function scrollToTop() {
    scrollToIndex(0);
  }

  onMounted(() => {
    containerRef.value?.addEventListener('scroll', onScroll, { passive: true });
  });

  onUnmounted(() => {
    containerRef.value?.removeEventListener('scroll', onScroll);
  });

  return {
    containerRef,
    totalHeight,
    visibleItems,
    scrollToIndex,
    scrollToTop,
    onScroll,
  };
}
