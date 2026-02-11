<template>
  <div class="pf-container">
    <!-- HEADER (accordion mobile) -->
 <div class="pf-header" @click="toggle">
  <span>{{ open ? "Masquer les filtres" : "Rechercher une partition" }}</span>
</div>


    <!-- CONTENT -->
    <div v-show="open" class="pf-content">
      <!-- SEARCH -->
      <div class="pf-section">
        <label>Recherche</label>
        <input
          class="input"
          type="text"
          placeholder="Nom, auteur, mot-clé…"
          v-model="local.search"
          @input="emitChange"
        />
      </div>

      <!-- FILTERS GRID -->
      <div class="pf-grid">
        <div>
          <label>Niveau</label>
          <select v-model="local.niveau" @change="emitChange">
            <option value="">Tous</option>
            <option v-for="n in niveaux" :key="n" :value="n">
              {{ n }}
            </option>
          </select>
        </div>

        <div>
          <label>Style</label>
          <select v-model="local.style" @change="emitChange">
            <option value="">Tous</option>
            <option v-for="s in styles" :key="s" :value="s">
              {{ s }}
            </option>
          </select>
        </div>

        <div>
          <label>Auteur</label>
          <select v-model="local.auteur" @change="emitChange">
            <option value="">Tous</option>
            <option v-for="a in auteurs" :key="a" :value="a">
              {{ a }}
            </option>
          </select>
        </div>
      </div>

      <!-- RESET -->
      <button class="btn-reset" @click="reset">
        Réinitialiser les filtres
      </button>
    </div>
  </div>
</template>


<script setup>
import { reactive, ref, onMounted } from "vue"

const isMobile = ref(false)
const open = ref(false)
const props = defineProps({
  niveaux: { type: Array, default: () => [] },
  styles: { type: Array, default: () => [] },
  auteurs: { type: Array, default: () => [] }
})

const emit = defineEmits(["change"])

const local = reactive({
  search: "",
  niveau: "",
  style: "",
  auteur: ""
})

function emitChange() {
  emit("change", { ...local })
}

function reset() {
  local.search = ""
  local.niveau = ""
  local.style = ""
  local.auteur = ""
  emitChange()
}
function toggle() {
  if (isMobile.value) open.value = !open.value
}
onMounted(() => {
  isMobile.value = window.innerWidth < 900
  open.value = !isMobile.value
})
</script>

<style scoped>
/* =====================================================
   SBS – Partitions Filters (Dark Premium)
   ===================================================== */

.pf-container {
  background: linear-gradient(
    180deg,
    rgba(255,255,255,.05),
    rgba(255,255,255,.01)
  );

  border: 1px solid rgba(255,255,255,.1);
  border-radius: 18px;
  padding: 16px;
}

.pf-section {
  margin-bottom: 14px;
}

label {
  display: block;
  margin-bottom: 4px;
  font-size: .7rem;
  font-weight: 600;
  color: rgba(255,255,255,.75);
}

.input,
select {
  width: 100%;
  background: rgba(0,0,0,.45);
  border: 1px solid rgba(255,255,255,.12);
  border-radius: 10px;
  padding: 8px 10px;
  font-size: .85rem;
  color: #fff;
}

.input:focus,
select:focus {
  outline: none;
  border-color: rgba(255,160,60,.9);
}

.pf-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-bottom: 14px;
}

@media (min-width: 700px) {
  .pf-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.btn-reset {
  background: transparent;
  border: none;
  color: rgba(255,160,60,.9);
  font-size: .75rem;
  cursor: pointer;
}
/* =====================================================
   Accordion mobile – Filters
   ===================================================== */

.pf-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  margin-bottom: 12px;
  font-size: .8rem;
  font-weight: 600;

  cursor: pointer;
  user-select: none;
}

.pf-content {
  margin-top: 8px;
}

/* Desktop : pas cliquable, toujours ouvert */
@media (min-width: 900px) {
  .pf-header {
    cursor: default;
  }
}
.pf-header {
  color: #d84400;
}

</style>
