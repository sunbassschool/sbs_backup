<script setup lang="ts">
import { ref, onMounted, computed } from "vue"
import { gasPost } from "@/config/gas.ts"
import { useAuthStore } from "@/stores/authStore.js"
import MarketingHeader from "@/components/MarketingHeader.vue"

const auth = useAuthStore()

const loading = ref(false)
const messages = ref<any[]>([])
const selectedId = ref<string | null>(null)
const creating = ref(false)

const selected = computed(() =>
  messages.value.find(m => m.id === selectedId.value) || null
)

function toLocalInput(iso?: string) {
  if (!iso) return ""
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function fetchMessages() {
  loading.value = true
  const res = await gasPost("listInAppMessages", { jwt: auth.jwt })
  loading.value = false
  if (res?.ok) {
    messages.value = res.messages || []
    if (!selectedId.value && messages.value.length) {
      selectedId.value = messages.value[0].id
    }
  }
}

async function createMessage() {
  creating.value = true
  const res = await gasPost("createInAppMessage", {
    jwt: auth.jwt,
    display_type: "modal",
    title: "Nouveau message",
    body: ""
  })
  creating.value = false
  if (res?.ok) fetchMessages()
}

async function updateField(id: string, key: string, value: any) {
  await gasPost("updateInAppMessage", {
    jwt: auth.jwt,
    id,
    updates: { [key]: value }
  })
}

async function deleteMessage(id: string) {
  await gasPost("deleteInAppMessage", {
    jwt: auth.jwt,
    id
  })
  messages.value = messages.value.filter(m => m.id !== id)
  selectedId.value = messages.value[0]?.id || null
}

onMounted(fetchMessages)
</script>

<template>
  <div class="admin-sticky-header">
  <MarketingHeader />
</div>
  <div class="iam-container">

    <!-- LEFT : LIST -->
    <aside class="iam-list">
      <div class="iam-list-header">
        <h3>In-App Messages</h3>
        <button class="btn-create" @click="createMessage" :disabled="creating">
          + Nouveau
        </button>
      </div>

      <div v-if="loading" class="muted">Chargement…</div>

      <button
        v-for="m in messages"
        :key="m.id"
        class="msg-card"
        :class="[m.status, { selected: m.id === selectedId }]"
        @click="selectedId = m.id"
      >
        <div class="msg-top">
          <span class="status">{{ m.status }}</span>
          <span class="type">{{ m.display_type }}</span>
        </div>

        <div class="msg-title">{{ m.title || "Sans titre" }}</div>
        <div class="msg-desc">{{ m.body || "—" }}</div>

        <div class="msg-meta">{{ m.trigger_route || "—" }}</div>
      </button>
    </aside>

    <!-- RIGHT : EDITOR -->
    <section v-if="selected" class="iam-editor">
      <div class="editor-section">
        <label>Titre</label>
        <input
          class="input"
          :value="selected.title"
          @blur="e => updateField(selected.id,'title',(e.target as HTMLInputElement).value)"
        />
      </div>

      <div class="editor-section">
        <label>Message</label>
        <textarea
          rows="4"
          class="textarea"
          :value="selected.body"
          @blur="e => updateField(selected.id,'body',(e.target as HTMLTextAreaElement).value)"
        />
      </div>

      <div class="editor-grid">
        <div>
          <label>Status</label>
          <select
            class="input"
            :value="selected.status"
            @change="e => updateField(selected.id,'status',(e.target as HTMLSelectElement).value)"
          >
            <option>draft</option>
            <option>active</option>
            <option>paused</option>
          </select>
        </div>

        <div>
          <label>Type</label>
          <select
            class="input"
            :value="selected.display_type"
            @change="e => updateField(selected.id,'display_type',(e.target as HTMLSelectElement).value)"
          >
            <option>modal</option>
            <option>banner</option>
          </select>
        </div>
      </div>

      <div class="editor-grid">
        <div>
          <label>Route</label>
          <input
            class="input"
            :value="selected.trigger_route"
            @blur="e => updateField(selected.id,'trigger_route',(e.target as HTMLInputElement).value)"
          />
        </div>

        <div>
          <label>Priorité</label>
          <input
            type="number"
            class="input"
            :value="selected.priority"
            @blur="e => updateField(selected.id,'priority',(e.target as HTMLInputElement).value)"
          />
        </div>
      </div>

      <div class="editor-grid">
        <div>
          <label>CTA label</label>
          <input
            class="input"
            :value="selected.cta_label"
            @blur="e => updateField(selected.id,'cta_label',(e.target as HTMLInputElement).value)"
          />
        </div>

        <div>
          <label>CTA payload</label>
          <input
            class="input"
            :value="selected.cta_payload"
            @blur="e => updateField(selected.id,'cta_payload',(e.target as HTMLInputElement).value)"
          />
        </div>
      </div>

      <div class="editor-grid">
        <div>
          <label>Start</label>
          <input
            type="datetime-local"
            class="input"
            :value="toLocalInput(selected.start_at)"
            @change="e => updateField(selected.id,'start_at',(e.target as HTMLInputElement).value)"
          />
        </div>

        <div>
          <label>End</label>
          <input
            type="datetime-local"
            class="input"
            :value="toLocalInput(selected.end_at)"
            @change="e => updateField(selected.id,'end_at',(e.target as HTMLInputElement).value)"
          />
        </div>
      </div>

      <div class="editor-actions">
        <button class="btn-delete" @click="deleteMessage(selected.id)">
          Supprimer
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* =====================================================
   SBS – In-App Messages Admin (Dark Premium)
   Mobile-first / Zero horizontal scroll
   ===================================================== */

/* CONTAINER */
.iam-container {
  display: grid;
  grid-template-columns: 1fr;           /* MOBILE = 1 colonne */
  gap: 16px;
  padding: 16px 14px 28px;
  padding-top: 65px; /* PAS de margin-top */

  width: 100%;
  max-width: 100%;
  margin: 0 auto;

  overflow-x: hidden;
}

/* DESKTOP SPLIT */
@media (min-width: 900px) {
  .iam-container {
    grid-template-columns: 320px minmax(0, 1fr);
    max-width: 1200px;
  }
}

/* =====================================================
   LIST
   ===================================================== */

.iam-list {
  overflow-x: hidden;
}

.iam-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.btn-create {
  font-size: .8rem;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 10px;
  background: rgba(255,160,60,.9);
  border: none;
  color: #000;
  cursor: pointer;
}

/* MESSAGE CARD */
.msg-card {
  width: 100%;
  max-width: 100%;

  text-align: left;
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
  cursor: pointer;

  overflow: hidden;

  transition:
    transform .15s ease,
    box-shadow .15s ease,
    border-color .15s ease;
}

.msg-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(0,0,0,.5);
}

.msg-card.selected {
  border-color: rgba(255,160,60,.9);
}

.msg-top {
  display: flex;
  justify-content: space-between;
  font-size: .65rem;
  opacity: .7;
}

.msg-title {
  margin-top: 6px;
  font-weight: 600;
  font-size: .95rem;
  word-break: break-word;
}

.msg-desc {
  font-size: .8rem;
  opacity: .65;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.msg-meta {
  margin-top: 6px;
  font-size: .7rem;
  opacity: .4;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* =====================================================
   EDITOR
   ===================================================== */

.iam-editor {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;

  background: linear-gradient(
    180deg,
    rgba(255,255,255,.05),
    rgba(255,255,255,.01)
  );

  border: 1px solid rgba(255,255,255,.1);
  border-radius: 18px;
  padding: 18px;
}

/* SECTIONS */
.editor-section {
  margin-bottom: 16px;
}

/* GRID – MOBILE FIRST */
.editor-grid {
  display: grid;
  grid-template-columns: 1fr;     /* MOBILE */
  gap: 14px;
  margin-bottom: 16px;
}

/* GRID – DESKTOP */
@media (min-width: 700px) {
  .editor-grid {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}

/* LABELS */
label {
  display: block;
  margin-bottom: 4px;

  font-size: .7rem;
  font-weight: 600;
  color: rgba(255,255,255,.75);
}

/* INPUTS */
.input,
.textarea,
select {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;

  background: rgba(0,0,0,.45);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 10px;

  padding: 8px 10px;
  font-size: .85rem;
  color: #fff;
}

.input:focus,
.textarea:focus,
select:focus {
  outline: none;
  border-color: rgba(255,160,60,.9);
}

/* ACTIONS */
.editor-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.btn-delete {
  background: transparent;
  border: none;
  color: rgba(255,80,80,.9);
  font-size: .75rem;
  cursor: pointer;
}

.admin-sticky-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #0b0b0b;
  border-bottom: 1px solid rgba(255,255,255,.08);
}

</style>
