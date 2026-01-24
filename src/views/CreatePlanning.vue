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
      <p class="subtitle">Pour qui est ce planning </p>

<!-- ÉTAT LOADING -->
<div v-if="isLoadingEleves" class="select-loading">
  ⏳ Chargement des élèves…
</div>

<!-- SELECT RÉEL -->
<select v-else v-model="prenomEleve">
  <option value="">— sélectionner un élève —</option>
  <option v-for="e in eleves" :key="e.email" :value="e.prenom">
    {{ e.prenom }} {{ e.nom }}
  </option>
</select>



 <button
  class="next"
  :disabled="isLoadingEleves || !prenomEleve"
     @click="goNextFromStep1">

>
  Continuer →
</button>

    </template>

    <!-- STEP 2 -->
    <template v-else-if="step === 2">
      <h3>🗓️ Planning</h3>
      <p class="subtitle">Quand et à quel rythme ?</p>

      <div class="grid">
    <div>
  <label>Date & heure du 1er cours</label>
  <input
    type="datetime-local"
    v-model="dateCours"
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
  <h3>📅 Finalisation</h3>
  <p class="subtitle">Aperçu du planning</p>

  <div class="planning-card">
    <!-- HEADER -->
    <div class="planning-header">
    <div class="avatar">
  <img
    v-if="avatarUrl"
    :src="avatarUrl"
    alt="avatar élève"
  />
  <span v-else>👤</span>
</div>

      <div class="header-text">

        <strong class="value">{{ prenomEleve || "—" }}</strong>
      </div>
    </div>

    <!-- GRID -->
    <div class="planning-grid" v-if="dateCours">
      <div class="item">
        <span class="icon">📌</span>
        <div>
          <span class="label">Séances : </span>
          <strong>{{ nbSeances }}</strong>
        </div>
      </div>

      <div class="item">
        <span class="icon">⏱️</span>
        <div>
          <span class="label">Durée : </span>
          <strong>{{ duree }} min</strong>
        </div>
      </div>

      <div class="item">
<i class="bi bi-calendar-week"></i>
        <div>
          <span class="label">Fréquence : </span>
          <strong>{{ frequence }}</strong>
        </div>
      </div>

      <div class="item highlight">
        <span class="icon">📆</span>
        <div>
          <span class="label">Début : </span>
          <strong>{{ formatDate(dateCours) }}</strong>
        </div>
      </div>
    </div>

    <div v-else class="empty">
      Aucun planning défini
    </div>

    <!-- COMMENT -->
    <div class="comment-block">
      <textarea v-model="commentaire" placeholder="Note interne ou message à l’élève…" />
    </div>
  </div>

  <!-- ACTIONS -->
<div class="planning-footer">
  <button class="ghost" @click="goToStep(2)">← Retour</button>
<button
  type="button"
  class="primary"
  :disabled="loading"
  @click="submit"
>
  {{ loading ? "Création…" : "Générer le planning" }}
</button>
</div>

</template>



  </div>
</Transition>



    </div></div>
  </Layout>
</template>

<script setup>
  import Layout from "@/views/Layout.vue"

import { ref, onMounted,computed } from "vue"
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
const isLoadingEleves = ref(false)
const selectedEleve = computed(() =>
  eleves.value.find(e => e.prenom === prenomEleve.value) || null
)

const goToStep = (n) => {
  step.value = n
}
// CACHE ==============
//=====================
let ELEVE_CACHE = null
let ELEVE_CACHE_TS = 0
const ELEVE_CACHE_TTL = 15 * 60 * 1000 // 5 min
//===========================================

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
const dateCours = ref("")
const nbSeances = ref(1)
const duree = ref(60)
const commentaire = ref("")
const loading = ref(false)
const avatarUrl = computed(() => selectedEleve.value?.avatar_url || null)

const formatDate = (iso) => {
  if (!iso) return "—"
  const d = new Date(iso)
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  })
}
const fetchEleves = async () => {
  try {
    isLoadingEleves.value = true

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
      str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()

    const filtered = (res.eleves || []).filter(e =>
      normalize(e.statut).startsWith("inscrit")
    )

    eleves.value = filtered
    sessionStorage.setItem("eleves_cache", JSON.stringify(filtered))
    sessionStorage.setItem("eleves_cache_ts", Date.now())
  } catch {
    toast.error("Impossible de charger les élèves")
  } finally {
    isLoadingEleves.value = false
  }
}

onMounted(() => {
  const cached = sessionStorage.getItem("eleves_cache")
  const cachedTs = sessionStorage.getItem("eleves_cache_ts")

  // ✅ afficher instantanément si cache
  if (cached) {
    eleves.value = JSON.parse(cached)
    isLoadingEleves.value = false
  }

  // 🔄 fetch SEULEMENT si cache absent ou expiré
  if (!cachedTs || Date.now() - cachedTs > ELEVE_CACHE_TTL) {
    fetchEleves()
  }
})
const onSubmit = (e) => {
  const required = e.currentTarget.dataset.privilege

  if (!auth.user?.privileges?.includes(required)) {
    auth.showUpgradeCTA({ privilege: required })
    return
  }

  submit() // logique métier
}

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

    const payload = {
      route: "createplanning",
      jwt,
      prof_id: auth.user.prof_id,
values: [
  frequence.value,          // 1️⃣ Fréquence
  trimestre.value,          // 2️⃣ Trimestre
  prenomEleve.value,        // 3️⃣ Prénom élève
  dateCours.value,          // 4️⃣ Date / heure
  String(nbSeances.value),  // 5️⃣ Nombre séances
  String(duree.value),      // 🔥 6️⃣ DURÉE (OBLIGATOIRE)
  commentaire.value         // 7️⃣ Commentaire
]

    }

    // 🔎 LOGS DEBUG
    console.group("📤 CREATE PLANNING")
    console.log("URL =", url)
    console.log("payload =", payload)
    console.groupEnd()

const response = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
})

const text = await response.text()

let res
try {
  res = JSON.parse(text)
} catch {
  // ⛔ Réponse HTML / proxy / refus
  auth.showUpgradeCTA({ privilege: "pro" })
  return
}

if (!res.success) {
  if (res.error === "FORBIDDEN") {
    auth.showUpgradeCTA({ privilege: "pro" })
    return
  }
  throw res.error
}



    if (!res.success) throw res.error
    toast.success("Planning créé avec succès")
setTimeout(() => {
  router.push({ name: "cours",  query: { eleve: prenomEleve.value }
 })
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
  select option {
  color: white;
}

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
  border-radius: 10px;
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

/* finalisation */

.planning-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 16px;
}

.planning-header {
  display: flex;
  gap: 12px;
  align-items: center;
  padding-bottom: 14px;
  border-bottom: 1px solid #222;
}

.avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: #1e1e1e;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.header-text .label {
  font-size: 12px;
  opacity: .6;
}

.value {
  font-size: 16px;
}

.planning-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1px;
}

.item {
  background: #ffffff;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.item .icon {
  font-size: 18px;
}

.item .label {
  font-size: 12px;
  opacity: .6;
}

.item strong {
  font-size: 14px;
}

.item.highlight {
  border: 1px solid #2e2e2e;
}

.comment-block {
  margin-top: 1px;
}

.comment-block textarea {
  width: 100%;
  min-height: 90px;
  margin-top: 6px;
  background: #111;
  color: #fff;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  padding: 10px;
}

.empty {
  text-align: center;
  opacity: .5;
  padding: 20px;
}

textarea {
  width: 100%;
  min-height: 90px;
  background: #111;
  color: #fff;
  border: 1px solid #2a2a2a;
  border-radius: 10px;
  padding: 10px;
  resize: vertical;
}

textarea::placeholder {
  color: #777;
}

textarea:focus {
  outline: none;
  background: #111;
  border-color: #444;
  box-shadow: none;
}
@media (max-width: 520px) {
  .planning-grid {
    grid-template-columns: 1fr;
  }

  .item {
    padding: 10px;
  }

  .planning-card {
    padding: 14px;
  }
}
.avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: #1e1e1e;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

</style>
