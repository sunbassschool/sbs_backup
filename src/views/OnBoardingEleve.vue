<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from "vue"
import { useAuthStore } from "@/stores/authStore.js"
import { useRouter } from "vue-router"
import { gasPost } from "@/config/gas.ts"
import SelectProfModal from "@/components/SelectProfModal.vue"
import { prefetchPublicProfs, getCachedPublicProfs } from "@/utils/publicProfs"

const auth = useAuthStore()
const router = useRouter()
const FINAL_STEP = 6
const showProfModal = ref(false)

const profs = ref<any[] | null>(null)

const STEPS_TOTAL = FINAL_STEP + 1
const days = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"]
const moments = ["Matin","Midi","Après-midi","Soir"]
const progress = computed(() => {
  return Math.round(((step.value - 1) / (STEPS_TOTAL - 1)) * 100)
})
const hasAlreadyProf = computed(() => {
  return !!auth.user?.prof_id
})
const selectedProf = ref<any | null>(null)

const step = ref(0)
const loading = ref(false)

type OnboardingForm = {
  instrument: string
  niveau: string
  objectif: string
  styles: string[]
  souhaite_prof: boolean | null
  source_prof: string
  prof_choisi_id: string
  rythme: string
  creneaux: {
    jours: string[]
    moments: string[]
  }
}

const form = reactive<OnboardingForm>({
  instrument: "",
  niveau: "",
  objectif: "",
  styles: [],
  souhaite_prof: null,
  source_prof: "",
  prof_choisi_id: "",
  rythme: "",
  creneaux: {
    jours: [],
    moments: []
  }
})



const next = () => {
  // si on arrive au step "choix du prof" MAIS déjà un prof → skip
  if (step.value === 3 && hasAlreadyProf.value) {
    step.value = 5
    return
  }

  // préfetch seulement si on va vraiment afficher le step prof
  if (step.value === 3 && !hasAlreadyProf.value) {
    prefetchPublicProfs()
  }

  step.value++
}

const prev = () => step.value--


function toggleObjectif(o: string) {
  const i = form.styles.indexOf(o)
  if (i !== -1) {
    form.styles.splice(i, 1)
  } else {
    form.styles.push(o)
  }
}
function toggleJour(j: string) {
  const a = form.creneaux.jours
  a.includes(j) ? a.splice(a.indexOf(j),1) : a.push(j)
}
function onProfSelected(prof: any) {
  selectedProf.value = prof
  form.prof_choisi_id = prof.prof_id
  showProfModal.value = false

  // sécurité : si on est déjà après le step 4, on ne next pas
  if (step.value === 4) {
    next()
  }
}



function toggleMoment(m: string) {
  const a = form.creneaux.moments
  a.includes(m) ? a.splice(a.indexOf(m),1) : a.push(m)
}
function optimisticPatch() {
  auth.user.onboarding_done = true
  auth.onboardingResolved = true
  localStorage.setItem("onboarding_done", "true")
}

function launchParcours() {
  // 🔒 optimistic patch
  auth.user.onboarding_done = true
  auth.onboardingResolved = true
  localStorage.setItem("onboarding_done", "true")

  // 🚀 redirect immédiat
  router.replace("/dashboard")

  // 🌐 submit en background
  submitBackgroundOnce()
}
function goToOffersOptimistic() {
  optimisticPatch()
  router.replace("/eleve/offres")
  submitBackgroundOnce()
}
function submitBackgroundOnce() {
  if (bgLaunched) return
  bgLaunched = true
  submitBackground()
}
async function submitBackground() {
  console.group("🎓 submit onboarding (bg)")
  try {
    form.objectif = form.styles.join(", ")

    await gasPost("saveEleveOnboarding", {
      payload: {
        id_utilisateur: auth.user.user_id,
        email: auth.user.email,
        onboarding_done: true,
        ...form
      }
    })

    console.log("✅ onboarding saved (bg)")
  } catch (e) {
    console.error("❌ onboarding bg failed", e)
    // optionnel : retry / flag à resync
    localStorage.setItem("onboarding_sync_failed", "true")
  } finally {
    console.groupEnd()
  }
}
let bgLaunched = false
watch(showProfModal, v => {
  console.log("🎭 showProfModal =", v)
})
onMounted(async () => {
  if (!auth.user?.prof_id) return

  try {
    let profs = getCachedPublicProfs()
    if (!profs) profs = await prefetchPublicProfs()

    selectedProf.value =
      profs.find(p => p.prof_id === auth.user.prof_id) || null

    if (selectedProf.value) {
      form.souhaite_prof = true
      form.prof_choisi_id = selectedProf.value.prof_id
    }

  } catch (e) {
    console.error("❌ failed to resolve existing prof", e)
  }
})


</script>


<template>
  <div class="onboarding">

    <!-- progress -->
    <div class="progress-bar">
      <div class="progress" :style="{ width: progress + '%' }" />
    </div>

    <Transition name="fade-slide" mode="out-in">

      <!-- STEP 0 -->
      <section v-if="step === 0" key="s0" class="screen">
        <h1>Bienvenue {{ auth.user?.prenom }}</h1>
        <p class="subtitle">
          Tu entres dans un parcours conçu pour te faire progresser.
        </p>
        <button class="btn primary" @click="next">Commencer l’aventure →</button>


      </section>

      <!-- STEP 1 -->
      <section v-else-if="step === 1" key="s1" class="screen">
        <h2>Ton niveau actuel</h2>
        <div class="cards">
          <div class="card" :class="{ active: form.niveau==='intermediaire' }"
               @click="form.niveau='intermediaire'; next()">
            🎸 Intermédiaire
            <span>Tu joues, mais tu plafonnes</span>
          </div>
          <div class="card" :class="{ active: form.niveau==='avance' }"
               @click="form.niveau='avance'; next()">
            🚀 Avancé
            <span>Tu veux passer un cap pro</span>
          </div>
        </div>
      </section>

      <!-- STEP 2 -->
      <section v-else-if="step === 2" key="s2" class="screen">
        <h2>Ton objectif principal</h2>
        <div class="tags">
<button
  v-for="o in ['Groove','Technique','Impro','Jeu en groupe','Discipline pro']"
  :key="o"
  class="objectif-btn"
  :class="{ active: form.styles.includes(o) }"
  @click="toggleObjectif(o)"
>
  <span class="label">{{ o }}</span>
  <span class="check" v-if="form.styles.includes(o)"></span>
</button>

        </div>
        <button class="btn primary" @click="next" :disabled="!form.styles.length">
          Continuer →
        </button>
      </section>

      <!-- STEP 3 -->
      <section v-else-if="step === 3" key="s3" class="screen">
        <h2>Ton rythme</h2>
        <div class="cards">
          <div class="card" @click="form.rythme='1h_sem'; next()">1h / semaine</div>
          <div class="card" @click="form.rythme='2h_mois'; next()">2h / mois</div>
          <div class="card" @click="form.rythme='libre'; next()">Libre</div>
        </div>
        <p class="micro">La régularité bat le talent.</p>
      </section>

      <!-- STEP 4 -->
      <section v-else-if="step === 4" key="s4" class="screen">
        <h2>Tu ne seras pas seul</h2>
        <p class="quote">
          “Mon rôle : structurer ton travail et corriger ce que tu ne vois pas.”
        </p>
        <div class="actions">
<button
  class="btn primary"
  @click="
    console.log('👉 click être accompagné');
    form.souhaite_prof = true;
    showProfModal = true;
    console.log('showProfModal =', showProfModal);
  "
>
  Être accompagné
</button>


<button
  class="btn ghost"
  @click="
    form.souhaite_prof = false;
    next()
  "
>
  Décider plus tard
</button>

        </div>
      </section>


  <!-- STEP 5 -->
<section v-else-if="step === 5" class="screen">
  <h2>Tes disponibilités</h2>
  <p class="micro">Juste pour nous guider, rien de figé</p>
<h4 class="label">Jours</h4>
<div class="chips dispo">
  <button
    v-for="d in days"
    :key="d"
    :class="{ active: form.creneaux.jours.includes(d) }"
    @click="toggleJour(d)"
  >
    {{ d }}
  </button>
</div>

<h4 class="label mt">Moments</h4>
<div class="chips dispo">
  <button
    v-for="m in moments"
    :key="m"
    :class="{ active: form.creneaux.moments.includes(m) }"
    @click="toggleMoment(m)"
  >
    {{ m }}
  </button>
</div>


  <button class="btn primary" @click="next">
    Continuer →
  </button>
</section>

<section v-else-if="step === FINAL_STEP" class="screen final">

  <h2>Ton parcours commence maintenant</h2>

  <p class="motivation">
    Tu n’as pas besoin de plus de motivation.
    Tu as besoin d’un cadre.
  </p>

<div class="summary">
  🎯 <strong>{{ form.styles.join(", ") }}</strong><br />
  🕒 <strong>{{ form.rythme }}</strong><br />
  📅 <strong>{{ form.creneaux.moments.join(", ") }}</strong>
  les
  <strong>{{ form.creneaux.jours.join(", ") }}</strong>

  <br /><br />

  <!-- PROF -->
  <div class="summary-prof" v-if="form.souhaite_prof">
    👨‍🏫
    <strong v-if="selectedProf">
      {{ selectedProf.prenom }}
    </strong>
    <span v-else>
      Prof à définir
    </span>
  </div>

  <div class="summary-prof muted" v-else>
    👨‍🏫 Sans accompagnement pour le moment
  </div>
</div>


  <div class="cta-stack">
<button class="btn primary" @click="launchParcours">
      Lancer mon parcours →
    </button>

    <button class="btn ghost" @click="goToOffersOptimistic">
      {{ form.souhaite_prof
        ? 'Choisir une formule de cours'
        : 'Découvrir l’accompagnement'
      }}
    </button>

    <p class="micro">
      Tu pourras le faire plus tard depuis ton espace.
    </p>
  </div>

</section>


    </Transition>
  </div>

<SelectProfModal
  v-model:open="showProfModal"
  @select="onProfSelected"
  @skip="
    form.prof_choisi_id = '';
    showProfModal = false;
    next()
  "
/>


</template>


<style scoped>
.onboarding {
  min-height: 100vh;
  background: radial-gradient(circle at top, #111, #000);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

.progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  width: 100%;
  background: #111;
}
.progress {
  height: 100%;
  background: linear-gradient(90deg, #ff857c, #ff4d4d);
}

.screen {
  max-width: 720px;
  padding: 2rem;
  text-align: center;
}

.subtitle, .micro {
  opacity: 0.7;
}

.cards {
  display: grid;
  gap: 1rem;
  margin-top: 2rem;
}

.card {
  padding: 1.5rem;
  border-radius: 14px;
  background: #0f0f0f;
  border: 1px solid #222;
  cursor: pointer;
    color: #bbbbbb;
  transition: 0.2s;
}
.card:hover,
.card.active {
  border-color: #ff7c7c;
  transform: translateY(-2px);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}
.tags button {
  background: #111;
  border: 1px solid #222;
  color: #fff;
  padding: 0.6rem 1rem;
  border-radius: 20px;
}
.tags button.active {
  border-color: #ff7c7c;
}

.btn {
  margin-top: 2rem;
  padding: 0.8rem 1.6rem;
  border-radius: 999px;
  border: none;
  cursor: pointer;
}
.btn.primary {
  background: #ff7c7c;
  color: #000;
}
.btn.ghost {
  background: transparent;
  color: #aaa;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}


.objectif-btn {
  position: relative;
  padding: 0.8rem 1.4rem;
  border-radius: 999px;
  border: 1px solid #222;
  background: #0f0f0f;
  color: #fff;
  cursor: pointer;
  transition: all 0.25s ease;
  overflow: hidden;
}

.objectif-btn:hover {
  border-color: #f2ff7c;
}

.objectif-btn.active {
  border-color: #f6ff7c;
  background: rgba(124, 255, 196, 0.08);
  animation: pulse 0.3s ease;
}

.objectif-btn .check {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%) scale(0);
  color: #e7ff7c;
  font-weight: bold;
  animation: checkPop 0.25s ease forwards;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.04); }
  100% { transform: scale(1); }
}

@keyframes checkPop {
  to {
    transform: translateY(-50%) scale(1);
  }
}
.micro {
  margin-top: 1rem;
  opacity: 0.7;
}


.label {
  margin: 1.5rem 0 0.6rem;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.6;
}

.chips.dispo {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.chips.dispo button {
  min-width: 64px;
  padding: 0.55rem 1.1rem;
  border-radius: 999px;
  border: 1px solid #222;
  background: #0f0f0f;
  color: #fff;
  font-weight: 500;
  transition: all 0.2s ease;
}

.chips.dispo button:hover {
  border-color: #7cffc4;
}

.chips.dispo button.active {
  background: linear-gradient(
    180deg,
    rgba(124,255,196,0.18),
    rgba(124,255,196,0.06)
  );
  border-color: #7cffc4;
  color: #eafff5;
}
.summary-prof {
  margin-top: 6px;
  font-size: .9rem;
}

.summary-prof.muted {
  opacity: .6;
}

</style>
