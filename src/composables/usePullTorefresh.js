import { ref, watch } from "vue";

export function usePullToRefresh({ container, threshold = 60, onRefresh }) {
  const pulling = ref(false);
  const startY = ref(0);
  const distance = ref(0);

  const isAppMode = () =>
    document.documentElement.classList.contains("app-mode");

  const handleTouchStart = (e) => {
    if (!isAppMode()) return;
    if (container.value && container.value.scrollTop === 0) {
      startY.value = e.touches[0].clientY;
      pulling.value = true;
    }
  };

  const handleTouchMove = (e) => {
    if (!isAppMode()) return;
    if (!pulling.value) return;

    distance.value = e.touches[0].clientY - startY.value;
    if (distance.value < 0) {
      pulling.value = false;
      distance.value = 0;
    }
  };

  const handleTouchEnd = async () => {
    if (!isAppMode()) return;

    if (pulling.value && distance.value >= threshold) {
      await onRefresh();
    }
    pulling.value = false;
    distance.value = 0;
  };

  watch(
    container,
    (el) => {
      if (!el) return;

      el.addEventListener("touchstart", handleTouchStart, { passive: true });
      el.addEventListener("touchmove", handleTouchMove, { passive: true });
      el.addEventListener("touchend", handleTouchEnd, { passive: true });
    },
    { immediate: true }
  );

  return { pulling, distance };
}
