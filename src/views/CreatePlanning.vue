<template>
  <Layout>  <div class="page-offset">

    <div class="wizard">

      <!-- Progress -->
 <div class="steps">
<div
  v-for="n in 3"
  :key="n"
  class="step clickable"
  :class="{ active: step >= n }"
  @click="goToStep(n)"
>
  {{ n }}
</div>

</div>


     <Transition name="step" mode="out-in">
  <div class="card" :key="step">

    <!-- STEP 1 -->
    <template v-if="step === 1">
      <h3>👤 Choisir l’élève</h3>
      <p class="subtitle">Pour qui est ce planning ?</p>

      <select v-model="prenomEleve">
        <option value="">— sélectionner un élève —</option>
        <option v-for="e in eleves" :key="e.email" :value="e.prenom">
          {{ e.prenom }} {{ e.nom }}
        </option>
      </select>

      <button class="next" :disabled="!prenomEleve" @click="goNextFromStep1">
        Continuer →
      </button>
    </template>

    <!-- STEP 2 -->
    <template v-else-if="step === 2">
      <h3>🗓️ Planning</h3>
      <p class="subtitle">Quand et à quel rythme ?</p>

      <div class="grid">
    <div>
  <label>Date du 1er cours</label>

  <!-- 📆 Sélecteur mois -->
  <div class="months">
    <button
      v-for="m in 12"
      :key="m"
      type="button"
      :class="{ active: currentMonth === m-1 }"
      @click="setMonth(m-1)"
    >
      {{ monthNames[m-1] }}
    </button>
  </div>

  <!-- 📅 Jours -->
  <div class="days">
    <button
      v-for="day in daysInMonth"
      :key="day"
      type="button"
      :class="{ active: selectedDay === day }"
      @click="selectDay(day)"
    >
      {{ day }}
    </button>
  </div>

  <!-- ⏰ Heure -->
  <div class="time-picker">
    <select v-model="selectedHour">
      <option
        v-for="h in 24"
        :key="h"
        :value="String(h).padStart(2,'0')"
      >
        {{ String(h).padStart(2,'0') }}
      </option>
    </select>
    :
    <select v-model="selectedMinute">
      <option
        v-for="m in [0,15,30,45]"
        :key="m"
        :value="String(m).padStart(2,'0')"
      >
        {{ String(m).padStart(2,'0') }}
      </option>
    </select>
  </div>

  <!-- 🔒 Valeur finale (backend) -->
  <input
    class="final-date"
    :value="dateCours"
    readonly
    placeholder="JJ/MM/AAAA HH:mm:00"
  />
</div>


        <div>
          <label>Fréquence</label>
          <select v-model="frequence">
            <option value="chaque semaine">Chaque semaine</option>
            <option value="une semaine sur deux">1 semaine sur 2</option>
          </select>
        </div>

        <div>
          <label>Nombre de séances</label>
          <input type="number" v-model.number="nbSeances" min="1" />
        </div>

        <div>
          <label>Durée (min)</label>
          <input type="number" v-model.number="duree" min="20" />
        </div>
      </div>

      <div class="actions">
        <button class="ghost" @click="goToStep(1)">← Retour</button>
        <button class="next" @click="goNextFromStep2">Continuer →</button>
      </div>
    </template>

    <!-- STEP 3 -->
    <template v-else>
      <h3>⚙️ Finalisation</h3>
      <p class="subtitle">Vérifie avant de générer</p>

      <div class="summary">
        <p v-if="prenomEleve"><strong>Élève :</strong> {{ prenomEleve }}</p>

        <p v-if="dateCours">
          <strong>Planning :</strong>
          {{ nbSeances }} séance(s) de {{ duree }} min,
          {{ frequence }}, à partir du {{ dateCours }}
        </p>

        <p v-else class="summary-placeholder">
          Aucun planning défini pour l’instant.
        </p>
      </div>

      <label>Commentaire (optionnel)</label>
      <textarea v-model="commentaire" />

      <div class="actions">
        <button class="ghost" @click="goToStep(2)">← Retour</button>
        <button class="primary" :disabled="loading" @click="submit">
          {{ loading ? "Création…" : "📅 Générer le planning" }}
        </button>
      </div>
    </template>

  </div>
</Transition>

    

    </div></div>
  </Layout>
</template>

<script setup>
import { ref, onMounted, computed } from "vue"
import Layout from "@/views/Layout.vue"
import { useAuthStore } from "@/stores/authStore"
import { getValidToken } from "@/utils/api.ts"
import { useToast } from "vue-toastification"
import { getProxyPostURL } from "@/config/gas.ts"
import { useRouter } from "vue-router"

const auth = useAuthStore()
const toast = useToast()
const eleves = ref([])
const step = ref(1)
const router = useRouter()
const selectedDate = ref(null) // Date JS
const selectedHour = ref("10")
const selectedMinute = ref("00")

const dateCours = computed(() => {
  if (!selectedDate.value) return ""
  const d = selectedDate.value
  const pad = n => String(n).padStart(2, "0")
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(selectedHour.value)}:${pad(selectedMinute.value)}:00`
})
const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth())
const selectedDay = ref(null)

const monthNames = [
  "Jan","Fév","Mar","Avr","Mai","Juin",
  "Juil","Août","Sep","Oct","Nov","Déc"
]

const daysInMonth = computed(() =>
  new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
)

const setMonth = m => {
  currentMonth.value = m
  selectedDay.value = null
}

const selectDay = d => {
  selectedDay.value = d
  selectedDate.value = new Date(
    currentYear.value,
    currentMonth.value,
    d
  )
}

const goToStep = (n) => {
  step.value = n
}


const goNextFromStep1 = () => {
  step.value = 2
}
const goNextFromStep2 = () => {
  if (!dateCours.value || nbSeances.value <= 0 || duree.value <= 0) {
    toast.error("Merci de compléter le planning avant de continuer")
    return
  }

  step.value = 3
}


const prenomEleve = ref("")
const frequence = ref("chaque semaine")
const trimestre = ref("trimestre 1")
const nbSeances = ref(1)
const duree = ref(60)
const commentaire = ref("")
const loading = ref(false)

onMounted(async () => {
  try {
    const jwt = await getValidToken()
    const res = await fetch(getProxyPostURL(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route: "getelevesbyprof",
        jwt,
        prof_id: auth.user.prof_id
      })
    }).then(r => r.json())

const normalize = (str = "") =>
  str
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()

eleves.value = (res.eleves || []).filter(e =>
  normalize(e.statut).startsWith("inscrit")
)
  } catch {
    toast.error("Impossible de charger les élèves")
  }
})

const submit = async () => {



const missingFields = []

if (!prenomEleve.value) missingFields.push("élève")
if (!dateCours.value)   missingFields.push("date / heure")
if (!nbSeances.value)   missingFields.push("nombre de séances")
if (!duree.value)       missingFields.push("durée")
if (nbSeances.value <= 0 || duree.value <= 0) {
  toast.error("Nombre de séances et durée doivent être supérieurs à 0")
  return
}

if (missingFields.length) {
  toast.error(
    `Champs obligatoires manquants : ${missingFields.join(", ")}`
  )
  return
}


  loading.value = true

  try {
    const jwt = await getValidToken()
    const url = getProxyPostURL()

// ⚠️ DOIT matcher EXACTEMENT les en-têtes de la feuille "Planning Élèves"
const headers = [
  "prénom de l'élève",
  "nom de l'élève",
  "date et heure du premier cours",
  "nombre de séances",
  "durée de chaque séance",
  "trimestre",
  "commentaire",
  "fréquence des cours"
]

// tableau aligné feuille
const values = new Array(headers.length).fill("")

values[headers.indexOf("prénom de l'élève")] = prenomEleve.value
values[headers.indexOf("nom de l'élève")] = prenomEleve.value
values[headers.indexOf("date et heure du premier cours")] = dateCours.value
values[headers.indexOf("nombre de séances")] = String(nbSeances.value)
values[headers.indexOf("durée de chaque séance")] = String(duree.value)
values[headers.indexOf("trimestre")] = trimestre.value
values[headers.indexOf("commentaire")] = commentaire.value
values[headers.indexOf("fréquence des cours")] = frequence.value

const payload = {
  route: "createplanning",
  jwt,
  prof_id: auth.user.prof_id,
  values
}


    // 🔎 LOGS DEBUG
    console.group("📤 CREATE PLANNING")
    console.log("URL =", url)
    console.log("payload =", payload)
    console.groupEnd()

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(r => r.json())

    if (!res.success) throw res.error
    toast.success("Planning créé avec succès")
setTimeout(() => {
  router.push({ name: "planning" })
}, 600)


  } catch (e) {
    console.error("❌ createplanning failed", e)
    toast.error("Erreur lors de la création du planning")
  } finally {
    loading.value = false
  }
}

</script>

<style>
    .page-offset {
    padding:0px 16px 0; /* 🔥 16px à gauche / droite */

}

.wizard {

  max-width: 520px;
  margin: 10px auto 0;
  padding-top: 16px;
  color: #eee;
}

.steps {
  position: relative;
  z-index: 10;
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
}

.step {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #222;
  border: 1px solid #333;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: .4;
  cursor: default;
  pointer-events: auto;
  transition: transform 0.15s ease, background 0.15s ease;
}

.step.clickable {
  cursor: pointer;
}

.step.clickable:hover {
  transform: scale(1.05);
}

.step.active {
  background: #b02a37;
  opacity: 1;
}

.card {
  background: #111;
  padding: 24px;
  border-radius: 14px;
  border: 1px solid #222;
}

.subtitle {
  font-size: .85rem;
  opacity: .7;
  margin-bottom: 16px;
}

label {
  font-size: .75rem;
  opacity: .7;
}

input, select, textarea {
  width: 100%;
  background: #1c1c1c;
  border: 1px solid #333;
  color: #eee;
  padding: 10px;
  border-radius: 8px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.summary {
  background: #1a1a1a;   /* gris foncé */
  color: #eee;           /* texte clair lisible */
  padding: 12px;
  border-radius: 10px;
  margin-bottom: 12px;
  font-size: 0.9rem;
}

.summary p {
  color: #eee;           /* force la lisibilité */
  margin: 4px 0;
}

.summary strong {
  color: #fff;           /* labels bien visibles */
}

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

button {
  padding: 10px 16px;
  border-radius: 10px;
  border: none;
  font-weight: 600;
}

button.primary {
  background: linear-gradient(135deg, #b02a37, #d9480f);
  color: white;
}

button.next {
  background: #b02a37;
  color: white;
  width: 100%;
  margin-top: 16px;
}

button.ghost {
  background: transparent;
  color: #aaa;
}
.summary-placeholder {
  color: #aaa;
  font-style: italic;
}
.wizard {
  text-align: center;
}

.step-enter-active,
.step-leave-active {
  transition: opacity 0.5s ease;
}

.step-enter-from,
.step-leave-to {
  opacity: 0;
}

/* ============================= */
/* 📅 Date picker – SBS polish   */
/* ============================= */

.months,
.days {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.months button,
.days button {
  border: 1px solid #2e2e2e;
  background: #121212;
  color: #eee;
  padding: 6px 10px;
  font-size: 0.85rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.months button {
  min-width: 48px;
  text-align: center;
}

.days button {
  width: 36px;
  height: 36px;
  padding: 0;
  font-weight: 500;
}

/* hover */
.months button:hover,
.days button:hover {
  background: #1f1f1f;
  border-color: #444;
}

/* active */
.months button.active,
.days button.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
  transform: scale(1.05);
}

/* ============================= */
/* ⏰ Time picker                */
/* ============================= */

.time-picker {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 8px 0 10px;
}

.time-picker select {
  background: #121212;
  border: 1px solid #2e2e2e;
  color: #fff;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
}

.time-picker select:focus {
  outline: none;
  border-color: #3b82f6;
}

/* ============================= */
/* 🔒 Date finale (readonly)     */
/* ============================= */

.final-date {
  margin-top: 6px;
  width: 100%;
  background: #0f172a;
  border: 1px dashed #3b82f6;
  color: #e5edff;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: monospace;
  opacity: 0.9;
}

/* ============================= */
/* 📱 Mobile tweak               */
/* ============================= */

@media (max-width: 600px) {
  .months button {
    min-width: 44px;
    padding: 6px 8px;
  }

  .days button {
    width: 34px;
    height: 34px;
  }
}

</style>
