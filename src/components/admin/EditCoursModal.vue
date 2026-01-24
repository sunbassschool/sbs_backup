<template>
  <div v-if="modelValue" class="sbs-modal-overlay" @click.self="close">
<div class="sbs-modal-card" :class="{ 'is-loading': loading }">

      <!-- HEADER -->
      <header class="sbs-modal-header">
        <div>
          <h3>Cours avec <strong>{{ localCours.Prénom }}</strong></h3>
          <p>Modification du cours</p>
        </div>
        <button class="sbs-close" @click="close">✕</button>
      </header>
<!-- BODY -->
<div class="sbs-modal-body">

  <!-- LIGNE 1 -->
<div class="sbs-top-row">

  <div class="sbs-status-group">
    <span class="sbs-status-pill" :data-status="localCours.Status">
      {{ statusLabel(localCours.Status) }}
    </span>

<button
  v-if="localCours.Status !== 'Fait'"
  class="sbs-status-action"
  @click="toggleReport"
  type="button"
>
  {{ localCours.Status === 'REPORT_PROF'
    ? 'Annuler le report'
    : 'Informer d’un report'
  }}
</button>


  </div>

  <button
    class="sbs-presence-toggle"
    :class="{ present: localCours['Présence'] === true }"
    @click="localCours['Présence'] = !localCours['Présence']"
    type="button"
  >
    <span class="dot"></span>
    {{ localCours['Présence'] ? 'Présent' : 'Absent' }}
  </button>

  <input
    class="sbs-date-input"
    type="datetime-local"
    v-model="localCours['Date et heure']"
  />

</div>


  <!-- LIGNE 2 -->
  <div class="grid-2">


    <section class="sbs-block">
      <label>Replay</label>

      <a
        v-if="localCours['Lien Replay']"
        :href="localCours['Lien Replay']"
        target="_blank"
        class="sbs-replay-item"
      >
        ▶ Ouvrir le replay
        <span class="sbs-replay-sub">Google Drive</span>
      </a>

      <div v-else class="sbs-replay-empty">
        Aucun replay
      </div>
    </section>
  </div>

  <!-- TRIMESTRE -->
 <section class="sbs-block">
  <label>Trimestre</label>

  <!-- desktop -->
  <div class="sbs-segment desktop-only">
    <button
      v-for="t in ['trimestre 1','trimestre 2','trimestre 3']"
      :key="t"
      :class="{ active: localCours.Trimestre === t }"
      @click="localCours.Trimestre = t"
    >
      {{ t.replace('trimestre ', 'T') }}
    </button>
  </div>

  <!-- mobile -->
  <select
    class="mobile-only"
    v-model="localCours.Trimestre"
  >
    <option value="trimestre 1">T1</option>
    <option value="trimestre 2">T2</option>
    <option value="trimestre 3">T3</option>
  </select>
</section>


  <!-- TEXTES -->
<section class="sbs-block collapsible">
  <button
    class="sbs-collapse-btn"
    type="button"
    @click="showComments = !showComments"
  >
    Commentaires prof
    <span>{{ showComments ? '▲' : '▼' }}</span>
  </button>

  <textarea
    v-show="showComments"
    v-model="localCours.Commentaires"
    rows="3"
  />
</section>

</div>


      <!-- FOOTER -->
      <footer class="sbs-modal-footer">
        <button class="btn-ghost" @click="close">Annuler</button>
<button
  class="btn-primary"
  :disabled="loading"
  @click="save"
>
  <span v-if="loading" class="sbs-spinner"></span>
  <span v-else>Enregistrer</span>
</button>      </footer>
<div v-if="loading" class="sbs-modal-loading">
  <div class="sbs-loading-card">
    <span class="sbs-spinner"></span>
    <p>Enregistrement…</p>
  </div>
</div>

    </div>
  </div>
</template>

<script setup>
import { reactive, watch, ref } from "vue"

const props = defineProps({
  modelValue: Boolean,
  cours: Object,
    loading: Boolean

})
const emit = defineEmits(["update:modelValue", "save"])
const showComments = ref(false)
const toggleReport = async () => {
  localCours.Status =
    localCours.Status === "REPORT_PROF"
      ? "A_VENIR"
      : "REPORT_PROF"

  await save() // 👈 sauvegarde directe
}

const localCours = reactive({})
const statusLabel = (status) => {
  switch (status) {
    case "Fait":
      return "✔️ Cours effectué"

    case "REPORT_PROF":
      return "🔔 Report notifié à l’élève"

    case "A_VENIR":
      return "📅 À venir"

    case "DEMANDE":
      return "⏳ En attente"

    case "REPORT_ACCEPTE":
      return "✔️ Report accepté"

    case "REPORT_REFUSE":
      return "📅 Maintenu"

    default:
      return "❔"
  }
}



watch(
  () => props.modelValue,
  (open) => {
    if (open && props.cours) {
      Object.assign(localCours, props.cours)
    }
  }
)

const close = () => emit("update:modelValue", false)
const save = () => emit("save", { ...localCours })
</script>

<style>
/* OVERLAY */
.sbs-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.6);
  backdrop-filter: blur(6px);
  z-index: 1200;

  display: flex;
  align-items: center;
  justify-content: center;
}

/* CARD */

.sbs-modal-card {
  width: 100%;
  max-width: 720px;
  max-height: 90vh;

  background: #fff;
  border-radius: 18px;
  box-shadow: 0 40px 100px rgba(0,0,0,.35);

  display: flex;
  flex-direction: column;
  animation: sbsFadeUp .25s ease;
}

/* HEADER */
.sbs-modal-header {
  padding: 20px 24px;
  background: linear-gradient(
    135deg,
    var(--brand-accent, #292929),
    var(--brand-accent-strong, #111)
  );
  color: #fff;

  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sbs-modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
}
.sbs-modal-header p {
  margin: 0;
  font-size: .8rem;
  opacity: .75;
}

.sbs-close {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 1.1rem;
  cursor: pointer;
}

/* BODY */
.sbs-modal-body {
  padding: 22px 24px;
  overflow-y: auto;
  flex: 1;
}

/* BLOCKS */
.sbs-block {
  margin-bottom: 18px;
}

.sbs-block label {
  font-size: .75rem;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 6px;
  display: block;
}

.sbs-block input,
.sbs-block textarea {
  width: 100%;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  padding: 10px 12px;
  font-size: .9rem;
}

/* GRID */
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* SEGMENT */
.sbs-segment {
  display: flex;
  gap: 8px;
}

.sbs-segment button {
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  font-weight: 600;
  cursor: pointer;
}

.sbs-segment button.active {
  background: var(--brand-accent, #292929);
  color: #fff;
  border-color: transparent;
}

/* FOOTER */
.sbs-modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-ghost {
  background: transparent;
  border: none;
  font-weight: 600;
  color: #64748b;
}

.btn-primary {
  background: linear-gradient(
    135deg,
    var(--brand-accent),
    var(--brand-accent-strong)
  );
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 8px 18px;
  font-weight: 700;
}

/* ANIMATION */
@keyframes sbsFadeUp {
  from {
    opacity: 0;
    transform: translateY(14px) scale(.97);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* MOBILE */
@media (max-width: 768px) {
  .sbs-modal-card {
    margin: 12px;
    max-height: calc(100vh - 24px);
  }
  .grid-2 {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .sbs-modal-body {
    padding: 16px;
  }

  .sbs-block {
    margin-bottom: 12px;
  }

  .sbs-block label {
    font-size: .7rem;
    margin-bottom: 4px;
  }

  .grid-2 {
    gap: 8px;
  }

  .sbs-presence-toggle {
    padding: 8px 10px;
    font-size: .75rem;
  }

  .sbs-report-btn {
    padding: 10px 12px;
    font-size: .8rem;
  }
}

@media (max-width: 768px) {
  .sbs-modal-footer {
    position: sticky;
    bottom: 0;
    background: #fff;
    z-index: 5;
    padding-bottom: calc(16px + env(safe-area-inset-bottom));
  }
}


/* ==================================================
   FORCE INPUT THEME — MODALE
   ================================================== */

.sbs-modal-card input,
.sbs-modal-card textarea {
  background-color: var(--input-bg, #ffffff) !important;
  color: var(--input-text, #1f2937) !important;
  border: 1px solid var(--border-soft, #e5e7eb) !important;
}

.sbs-modal-card input::placeholder,
.sbs-modal-card textarea::placeholder {
  color: var(--input-placeholder, #94a3b8) !important;
}

.sbs-modal-card input:focus,
.sbs-modal-card textarea:focus {
  background-color: var(--input-bg, #ffffff) !important;
  color: var(--input-text, #1f2937) !important;
  border-color: var(--border-focus, #292929) !important;
  box-shadow: 0 0 0 3px rgba(41,41,41,.25) !important;
}
/* REPLAY ITEM */
.sbs-replay-item {
  display: flex;
  flex-direction: column;
  gap: 2px;

  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--border-soft, #e5e7eb);
  background: #f8fafc;

  text-decoration: none;
  font-weight: 700;
  color: var(--brand-accent, #292929);

  transition: all .2s ease;
}

.sbs-replay-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(0,0,0,.12);
}

.sbs-replay-sub {
  font-size: .7rem;
  font-weight: 600;
  color: #64748b;
}

/* EMPTY STATE */
.sbs-replay-empty {
  padding: 12px 14px;
  border-radius: 12px;
  background: #f1f5f9;
  color: #94a3b8;
  font-size: .8rem;
}
.sbs-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin .8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
/* BLOQUE LA MODALE */
.sbs-modal-card.is-loading {
  pointer-events: none;
  filter: blur(1px);
}

/* OVERLAY INTERNE */
.sbs-modal-loading {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,.65);
  backdrop-filter: blur(2px);
  z-index: 10;

  display: flex;
  align-items: center;
  justify-content: center;
}

/* CARD LOADING */
.sbs-loading-card {
  background: #fff;
  padding: 18px 22px;
  border-radius: 14px;
  box-shadow: 0 12px 40px rgba(0,0,0,.25);
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 700;
}

/* SPINNER */
.sbs-spinner {
  width: 18px;
  height: 18px;
  border: 3px solid rgba(0,0,0,.2);
  border-top-color: var(--brand-accent, #292929);
  border-radius: 50%;
  animation: spin .8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
.sbs-modal-card {
  position: relative; /* 👈 OBLIGATOIRE */
}
/* PRESENCE TOGGLE */
.sbs-presence-toggle {
  display: inline-flex;
  align-items: center;
  gap: 10px;

  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid var(--border-soft, #e5e7eb);
  background: #f1f5f9;

  font-weight: 700;
  font-size: .85rem;
  cursor: pointer;
  transition: all .2s ease;
}

.sbs-presence-toggle .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #94a3b8;
}

.sbs-presence-toggle.present {
  background: rgba(34,197,94,.12);
  border-color: rgba(34,197,94,.4);
  color: #166534;
}

.sbs-presence-toggle.present .dot {
  background: #22c55e;
}
.sbs-report-btn {
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid rgba(251,146,60,.4);
  background: rgba(251,146,60,.15);
  color: #9a3412;
  font-weight: 700;
  cursor: pointer;
  transition: all .2s ease;
}

.sbs-report-btn:disabled {
  opacity: .6;
  cursor: default;
}
/* FIX BOUTON ENREGISTRER */
.sbs-modal-footer .btn-primary {
  background: linear-gradient(
    135deg,
    var(--brand-accent, #292929),
    var(--brand-accent-strong, #111)
  ) !important;

  color: #fff !important;
}


/* collapse commentaire */
.sbs-collapse-btn {
  width: 100%;
  background: #f1f5f9;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 8px 12px;
  font-weight: 700;
  font-size: .8rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}


/* trimestre */
.desktop-only { display: flex; }
.mobile-only { display: none; }

@media (max-width: 768px) {
  .desktop-only { display: none; }
  .mobile-only {
    display: block;
    width: 100%;
    padding: 8px 10px;
    border-radius: 10px;
    border: 1px solid #e5e7eb;
  }
}
.sbs-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.sbs-status-pill {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: .75rem;
  font-weight: 800;
  white-space: nowrap;
}

/* états */
.sbs-status-pill[data-status="Fait"] {
  background: rgba(34,197,94,.15);
  color: #166534;
}

.sbs-status-pill[data-status="A_VENIR"] {
  background: rgba(59,130,246,.15);
  color: #1e3a8a;
}

.sbs-status-pill[data-status="REPORT_PROF"] {
  background: rgba(251,146,60,.2);
  color: #9a3412;
}

.sbs-status-action {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: .75rem;
  font-weight: 800;
  white-space: nowrap;
}

.sbs-status-action:hover {
  opacity: 1;
}

/* mobile */
@media (max-width: 768px) {
  .sbs-status-row {
    padding: 6px 0;
  }
}
.sbs-top-row {
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: 10px;
  align-items: center;
  margin-bottom: 16px;
}

/* statut */
.sbs-status-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sbs-status-action {
  border: none;
  background: transparent;
  font-size: .7rem;
  font-weight: 800;
  opacity: .6;
}
.sbs-status-action:hover { opacity: 1; }

/* date */
.sbs-date-input {
  min-width: 0;
}

/* mobile */
@media (max-width: 768px) {
  .sbs-top-row {
    grid-template-columns: 1fr 1fr;
    grid-template-areas:
      "status presence"
      "date date";
  }

  .sbs-status-group { grid-area: status; }
  .sbs-presence-toggle { grid-area: presence; }
  .sbs-date-input { grid-area: date; }
}

</style>
