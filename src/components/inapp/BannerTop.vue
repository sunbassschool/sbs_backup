<!-- src/components/inapp/BannerTop.vue -->
<script setup lang="ts">
defineProps<{
  message: any
}>()

const emit = defineEmits(["dismiss", "cta"])
</script>

<template>
  <teleport to="body">
    <div class="inapp-banner">
      <div class="left">
        <strong v-if="message.content.title">
          {{ message.content.title }}
        </strong>

        <div class="marquee" v-if="message.content.body">
          <span>
            {{ message.content.body }}
          </span>
        </div>
      </div>

      <div class="actions">
        <button
          v-if="message.content.cta?.label"
          class="cta"
          @click="emit('cta')"
        >
          {{ message.content.cta.label }}
        </button>

        <button class="close" @click="emit('dismiss')">
          ✕
        </button>
      </div>
    </div>
  </teleport>
</template>
<style scoped>
.inapp-banner {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: 12px; /* footer sticky temporaire */
  z-index: 9999;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  padding: 12px 16px;
  background: linear-gradient(180deg, #18181d, #0f0f12);
  color: #fff;

  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.08);

  box-shadow:
    0 20px 60px rgba(0,0,0,.7),
    inset 0 1px 0 rgba(255,255,255,.04);

  animation: bannerIn .3s ease;
}

/* gauche */
.left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

strong {
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

/* marquee */
.marquee {
  position: relative;
  overflow: hidden;
  flex: 1;
  mask-image: linear-gradient(
    to right,
    transparent,
    black 8%,
    black 92%,
    transparent
  );
}

.marquee span {
  display: inline-block;
  padding-left: 100%;
  font-size: 13px;
  color: #d4d4dc;
  white-space: nowrap;
  animation: marquee 18s linear infinite;
}

/* actions */
.actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cta {
  height: 32px;
  padding: 0 14px;
  border-radius: 10px;
  font-size: 12.5px;
  font-weight: 600;
  border: none;
  cursor: pointer;

  background: linear-gradient(135deg, #ffffff, #e6e6e6);
  color: #000;
}

.cta:hover {
  transform: translateY(-1px);
}

.close {
  background: none;
  border: none;
  color: #aaa;
  font-size: 14px;
  cursor: pointer;
}

.close:hover {
  color: #fff;
}

/* animations */
@keyframes marquee {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-100%);
  }
}

@keyframes bannerIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

</style>
