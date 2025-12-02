import { ref, watch } from 'vue';

export function usePullToRefresh({ container, threshold = 60, onRefresh }) {
  const pulling = ref(false);
  const startY = ref(0);
  const distance = ref(0);

  const handleTouchStart = (e) => {
    if (container.value && container.value.scrollTop === 0) {
      startY.value = e.touches[0].clientY;
      pulling.value = true;
      console.log("👆 Touch start");
    }
  };

  const handleTouchMove = (e) => {
    if (!pulling.value) return;
    distance.value = e.touches[0].clientY - startY.value;
    if (distance.value < 0) {
      pulling.value = false;
      distance.value = 0;
    }
  };

  const handleTouchEnd = async () => {
    if (pulling.value && distance.value >= threshold) {
      console.log("🔁 Pull to refresh triggered");
      await onRefresh();
    }
    pulling.value = false;
    distance.value = 0;
  };

  // 👇 observe quand container devient dispo
  watch(container, (el) => {
    if (!el) return;
    el.addEventListener("touchstart", handleTouchStart);
    el.addEventListener("touchmove", handleTouchMove);
    el.addEventListener("touchend", handleTouchEnd);
  }, { immediate: true });

  return { pulling, distance };
}
