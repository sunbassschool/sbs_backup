import { ref, watch } from "vue";

export function useInstagramPullToRefresh({ containerRef, threshold = 50, onRefresh }) {
  const pulling = ref(false);
  const startY = ref(0);
  const distance = ref(0);
  const isRefreshing = ref(false);

  const spinner = document.createElement("div");
  spinner.className = "insta-spinner";
  spinner.innerHTML = '<div class="insta-spinner-ring"></div>';
  spinner.style.position = "absolute";
  spinner.style.top = "8px";
  spinner.style.left = "50%";
  spinner.style.transform = "translateX(-50%) scale(0)";
  spinner.style.transition = "transform 0.2s ease";

  const handleTouchStart = (e) => {
    if (containerRef.value && containerRef.value.scrollTop === 0 && !isRefreshing.value) {
      startY.value = e.touches[0].clientY;
      pulling.value = true;
      if (!containerRef.value.contains(spinner)) {
        containerRef.value.parentNode.insertBefore(spinner, containerRef.value);
      }
    }
  };

  const handleTouchMove = (e) => {
    if (!pulling.value || isRefreshing.value) return;
    const deltaY = e.touches[0].clientY - startY.value;
    if (deltaY <= 0) return;

    e.preventDefault();
    distance.value = Math.min(deltaY * 0.35, 60);
    containerRef.value.style.transform = `translateY(${distance.value}px)`;
    spinner.style.transform = "translateX(-50%) scale(1)";
  };

  const handleTouchEnd = async () => {
    if (!pulling.value || isRefreshing.value) return;

    if (distance.value >= threshold) {
      isRefreshing.value = true;
      spinner.style.transform = "translateX(-50%) scale(1)";
      containerRef.value.style.transition = "transform 0.3s ease";
      containerRef.value.style.transform = `translateY(40px)`;
      await onRefresh();
    }

    setTimeout(() => {
      spinner.style.transform = "translateX(-50%) scale(0)";
      containerRef.value.style.transition = "transform 0.3s ease";
      containerRef.value.style.transform = "translateY(0)";
      isRefreshing.value = false;
    }, 400);

    pulling.value = false;
    distance.value = 0;
  };

  watch(containerRef, (el) => {
    if (!el) return;
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
  }, { immediate: true });

  return { pulling, distance };
}
