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
          <label>Date & heure du 1er cours</label>
          <input v-model="dateCours" placeholder="02/02/2025 10:00:00" />
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
import { ref, onMounted } from "vue"
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
const dateCours = ref("")
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


</style>
