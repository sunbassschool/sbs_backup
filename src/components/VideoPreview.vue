<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from "vue"
import Plyr from "plyr"
import "plyr/dist/plyr.css"

const props = defineProps<{ src: string | null }>()
const videoEl = ref<HTMLVideoElement | null>(null)
let player: Plyr | null = null
let pendingSrc: string | null = null
let hasPlayed = false
let restoredOnce = false

const log = (...a: any[]) => console.log("🎬 [VideoPreview]", ...a)
function getKey(src: string) {
  return `video-progress:${src}`
}

function restorePlayback(src: string) {
  const t = localStorage.getItem(getKey(src))
  if (t && player) {
    player.currentTime = Number(t)
  }
}

function savePlayback(src: string) {
  if (!player) return
  localStorage.setItem(
    getKey(src),
    String(Math.floor(player.currentTime))
  )
}

function storageKey() {
  return props.src ? `video-progress:${props.src}` : null
}

function saveProgress(reason = "") {
  if (!hasPlayed) {
    log("🚫 skip save (never played)", reason)
    return
  }

  const k = storageKey()
  if (!k || !player) return

  const t = Math.floor(player.currentTime || 0)
  if (t < 2) return

  localStorage.setItem(k, String(t))
}


onMounted(async () => {
  log("mounted → wait DOM")
  await nextTick()

  if (!videoEl.value) {
    log("❌ videoEl STILL null → abort")
    return
  }

  player = new Plyr(videoEl.value, {
    controls: ["play", "progress", "current-time", "mute", "volume", "settings", "fullscreen"]
  })

  log("✅ Plyr ready")

  const root = videoEl.value.closest(".video-player")

  // =========================
  // 🎯 AUTO-HIDE CTA
  // =========================
player.on("play", () => {
  hasPlayed = true           // 🔑 AVANT toute logique
  root?.classList.add("is-playing")

  if (!restoredOnce) {
    const k = storageKey()
    const t = k ? Number(localStorage.getItem(k) || 0) : 0
    if (t > 0) {
      log("▶️ force restore on play", t)
      player!.currentTime = t
    }
    restoredOnce = true
  }
})




  player.on("pause", () => {
    root?.classList.remove("is-playing")
  })

  player.on("ended", () => {
    root?.classList.remove("is-playing")
  })

  // =========================
  // ⏱️ REMEMBER PLAYBACK
  // =========================
  const key = () => props.src ? `video-progress:${props.src}` : null
let restored = false



player.on("timeupdate", () => {
  if (!hasPlayed) return
  saveProgress("timeupdate")
})


  player.on("pause", () => {
      log("⏸️ pause event")

  saveProgress("pause")
})

  player.on("ended", () => {
    const k = key()
    if (k) localStorage.removeItem(k)
  })

  // =========================
  // ⬇️ SRC EN ATTENTE
  // =========================
  if (pendingSrc) {
    log("⬇️ inject pending src")
    injectSrc(pendingSrc)
    pendingSrc = null
  }
})

function injectSrc(src: string) {
  if (!player || !videoEl.value) return

  log("➡️ inject source", src)
hasPlayed = false
restoredOnce = false

  // inject source Plyr
  player.source = {
    type: "video",
    sources: [{ src, type: "video/mp4" }]
  }

  // ✅ restore AFTER metadata loaded (sinon reset à 0)
  const k = `video-progress:${src}`
  const restoreOnce = () => {
    const t = Number(localStorage.getItem(k) || 0)
    log("⏮️ restore AFTER metadata", t)
    if (t > 0) player!.currentTime = t
    videoEl.value?.removeEventListener("loadedmetadata", restoreOnce)
  }

  videoEl.value.addEventListener("loadedmetadata", restoreOnce)
}


watch(
  () => props.src,
  (val) => {
    log("watch src =", val)
    if (!val) return

    if (!player) {
      log("⏳ player not ready → queue src")
      pendingSrc = val
      return
    }

    injectSrc(val)
  },
  { immediate: true }
)

onUnmounted(() => {
  log("🧨 unmounted → force save")

  if (player && props.src && hasPlayed) {
    const t = Math.floor(player.currentTime || 0)
    if (t >= 2) {
      localStorage.setItem(
        `video-progress:${props.src}`,
        String(t)
      )
    } else {
      log("🚫 skip save (t < 2s)")
    }
  }

  player?.destroy()
})

</script>

<template>
  <div class="video-player">
    <video ref="videoEl" playsinline controls preload="metadata" />

    <a
      v-if="src"
      :href="src"
      download
      target="_blank"
      rel="noopener"
      class="video-download"
    >
      Télécharger la vidéo
    </a>
  </div>
</template>




<style scoped>
/* ===================================
   🎬 VIDEO PREVIEW – PREMIUM++
   =================================== */

.video-player {
  position: relative;
  width: 100%;
  max-width: 1200px;
  margin: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: vp-fade-in .35s ease-out;
}

/* ---- glass frame ---- */
.video-player .plyr,
.video-player video {
  width: 100%;
  aspect-ratio: 16 / 9;
  max-height: 80vh;
  border-radius: 20px;
  background: #000;
  overflow: hidden;
  backdrop-filter: blur(8px);
  box-shadow:
    0 30px 70px rgba(0,0,0,.55),
    inset 0 0 0 1px rgba(255,255,255,.06);
}

/* glow subtil accent */
.video-player::before {
  content: "";
  position: absolute;
  inset: 12px;
  border-radius: 22px;
  pointer-events: none;
  background:
    radial-gradient(
      80% 60% at 50% 100%,
      rgba(255,255,255,.06),
      transparent 60%
    );
}

/* ---- Plyr polish ---- */
.plyr--video {
  border-radius: 20px;
}

.plyr__control--overlaid {
  background: rgba(0,0,0,.55);
  backdrop-filter: blur(6px);
}

/* ===================================
   ⬇️ DOWNLOAD CTA – SMART
   =================================== */

.video-download {
  margin-top: 18px;
  padding: 14px 22px;
  border-radius: 16px;
  background:
    linear-gradient(135deg, #2c2c2c, #121212);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: .3px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  position: relative;
  transition: transform .2s ease, box-shadow .2s ease;
  box-shadow:
    0 12px 30px rgba(0,0,0,.45),
    inset 0 0 0 1px rgba(255,255,255,.08);
}

/* icône pseudo */
.video-download::before {
  content: "⬇";
  font-size: 15px;
  opacity: .85;
}

/* hover premium */
.video-download:hover {
  transform: translateY(-2px);
  box-shadow:
    0 18px 40px rgba(0,0,0,.6),
    inset 0 0 0 1px rgba(255,255,255,.12);
}

/* tip iOS */
.video-download::after {
  content: "Sur iPhone : enregistrer via Partager";
  position: absolute;
  top: -36px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  padding: 6px 10px;
  border-radius: 10px;
  background: rgba(0,0,0,.75);
  opacity: 0;
  pointer-events: none;
  transition: opacity .15s ease;
  white-space: nowrap;
}

.video-download:hover::after {
  opacity: .85;
}

.video-player.is-playing .video-download {
  opacity: 0;
  pointer-events: none;
  transform: translateY(6px);
}

.video-download {
  transition: opacity .25s ease, transform .25s ease;
}

/* ===================================
   ✨ ANIM
   =================================== */
@keyframes vp-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px) scale(.98);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* ===================================
   📱 MOBILE
   =================================== */
@media (max-width: 768px) {
  .video-player {
    padding: 0;
  }

  .video-player .plyr,
  .video-player video {
    border-radius: 0;
    max-height: 65vh;
  }

  .video-download {
    width: calc(100% - 24px);
    justify-content: center;
    margin-bottom: 12px;
  }

  .video-download::after {
    display: none;
  }
}

</style>
