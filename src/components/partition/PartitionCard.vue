<template>
<div
  class="partition-card"
  @click="openPreview(partition.download_url)"
>
  <div class="pc-content">
    <div class="pc-title" :title="partition.nom">
      {{ partition.nom }}
    </div>
    <div class="pc-author">
      {{ partition.auteur }}
    </div>
  </div>

  <div class="pc-actions" @click.stop>
    <a
      :href="driveDownload(partition.download_url)"
      target="_blank"
    >
      <i class="fas fa-download"></i>
      Télécharger
    </a>
  </div>
</div>

</template>

<script setup>
import { driveDownload, drivePreview } from "@/utils/driveLink"

defineProps({
  partition: {
    type: Object,
    required: true
  }
})

function openPreview(url) {
  const preview = drivePreview(url)
  if (preview) window.open(preview, "_blank")
}
</script>



<style scoped>
/* =====================================================
   SBS – Partition Card (Dark Premium)
   ===================================================== */

.partition-card {
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 14px 14px 16px;
  margin-bottom: 12px;
  border-radius: 16px;

  background: linear-gradient(
    180deg,
    rgba(255,255,255,.07),
    rgba(255,255,255,.015)
  );

  border: 1px solid rgba(255,255,255,.1);
  color: #fff;

  transition:
    transform .15s ease,
    box-shadow .15s ease,
    border-color .15s ease;
}

.partition-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(0,0,0,.5);
  border-color: rgba(255,160,60,.5);
}

.pc-content {
  min-width: 0;
}

.pc-title {
  font-weight: 600;
  font-size: .9rem;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pc-author {
  margin-top: 4px;
  font-size: .75rem;
  opacity: .65;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pc-actions {
  display: flex;
  gap: 8px;
  margin-left: 12px;
}

.pc-actions button,
.pc-actions a {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  text-decoration: none;
  font-size: .8rem;
  font-weight: 600;

  background: rgba(0,0,0,.45);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 10px;
  padding: 6px 10px;

  color: #fff;
}

.pc-actions a::before,
.pc-actions a::after {
  content: none !important;
}

.partition-card {
  cursor: pointer;
}

.partition-card:hover {
  border-color: rgba(255,160,60,.9);
}

</style>
