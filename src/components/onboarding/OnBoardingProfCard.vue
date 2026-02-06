<template>
<div
v-if="authStore.authFullyReady && !snapshot.isDone"
  :key="`onboarding-${snapshot.completed}-${snapshot.stripeOk}`"
  class="onboarding-card"
>
    <div class="onboarding-header">
      <div class="progress-bar">
  <div
    class="progress-bar-fill"
    :style="{ width: (snapshot.completed / 4 * 100) + '%' }"
  ></div>
</div>
<div v-if="snapshot.isDone" class="onboarding-done">
  🎉 Ton compte est prêt
</div>

      <h4>🚀 Finalise ton démarrage</h4>
      <span class="progress">
        {{ snapshot.completed }} / 4
      </span>
    </div>
<div v-if="nextAction" class="next-action">
  <div class="next-action-label">
    {{ nextAction.label }}
  </div>

  <button class="next-action-btn" @click="handleNextAction">
    {{ nextAction.cta }}
  </button>
</div>
<details class="onboarding-details">

    <ul class="onboarding-list">
<li>
  <span>Paiements activés</span>

  <!-- ⏳ SKELETON -->
  <span
    v-if="!authStore.onboardingReady"
    class="status-badge skeleton"
  >
    Vérification…
  </span>

  <!-- ❌ PAS CONNECTÉ -->
  <span
    v-else-if="!snapshot.stripeOk"
    class="status-badge warn"
    @click="scrollToStripe"
  >
    À connecter
  </span>

  <!-- ✅ OK -->
  <span
    v-else
    class="status-badge ok"
  >
    Connecté
  </span>
</li>



<li :class="{ done: snapshot.hasStudent }">
  <span>Inviter au moins 1 élève</span>
  <button
    v-if="!snapshot.hasStudent"
    @click="goInvite"
  >
    Inviter
  </button>
</li>


      <li :class="{ done: snapshot.hasOffer }">
        <span>Créer une offre</span>
        <button
          v-if="!snapshot.hasOffer"
          @click="goOffer"
        >
          Créer
        </button>
      </li>

      <li :class="{ done: snapshot.hasSale }">
        <span>Première vente</span>
         <button
          v-if="!snapshot.hasOffer"
          @click="goSale"
        >
          consulter
        </button>
      </li>
    </ul>
    </details>
  </div>

</template>


<script setup>
import { computed, watch } from "vue"
import { useAuthStore } from "@/stores/authStore.js"
import { useRouter } from "vue-router"

const authStore = useAuthStore()
const router = useRouter()
const nextAction = computed(() => authStore.onboardingNextAction)

const handleNextAction = () => {
  if (!nextAction.value) return

  switch (nextAction.value.action) {
    case "stripe":
  goInvite()
        break
    case "invite":
      goInvite()
      break
    case "offer":
      router.push("/dashboard-prof/offres")
      break
    case "sale":
      router.push("/prof/revenus")
      break
  }
}

const studentsLoaded = computed(() =>
  Array.isArray(
    authStore.elevesByProf?.[authStore.user?.prof_id]
  )
)


const snapshot = computed(() => authStore.onboardingSnapshot)
const scrollToStripe = () =>
  document.querySelector(".stripe-card")
    ?.scrollIntoView({ behavior: "smooth", block: "start" })

const goInvite = () => {
  const el = document.getElementById("invite-link")
  if (!el) return

  // 🔎 trouver le parent scrollable
  let parent = el.parentElement
  while (parent) {
    const style = getComputedStyle(parent)
    if (/(auto|scroll)/.test(style.overflowY)) break
    parent = parent.parentElement
  }

  // fallback window si aucun parent scrollable
  if (!parent) {
    el.scrollIntoView({ behavior: "smooth", block: "start" })
  } else {
    const offset = el.offsetTop - parent.offsetTop - 40
    parent.scrollTo({ top: offset, behavior: "smooth" })
  }

  // ✨ surbrillance
  el.classList.add("highlight-invite")
  setTimeout(() => el.classList.remove("highlight-invite"), 2000)
}


const goOffer = () => router.push("/dashboard-prof/offres")
const goSale = () => router.push("/prof/revenus")

watch(
  () => snapshot.value.hasStudent,
  (v) => {
    console.log("👀 onboarding hasStudent updated =", v)
  }
)
watch(
  snapshot,
  (v) => {
    console.log("🧠 ONBOARDING SNAPSHOT (COMPONENT)", JSON.parse(JSON.stringify(v)))
  },
  { immediate: true }
)

</script>


<style scoped>

/* ==================================================
   🍏 OnBoarding — Apple dark premium (propre + aligné)
   ================================================== */

.onboarding-card{
  background: radial-gradient(1200px 500px at 20% -20%, rgba(250,204,21,.10), transparent 55%),
              linear-gradient(180deg, #121317, #0c0d10);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 18px;
  padding: 18px 18px 14px;
  margin-bottom: 18px;
  box-shadow: 0 18px 50px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.04);
  color:#f5f5f7;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif;
}

.onboarding-header{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  padding-bottom: 12px;
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(255,255,255,.08);
}

.onboarding-header h4{
  margin:0;
  font-size: 0.98rem;
  font-weight: 700;
  letter-spacing: .2px;
  line-height: 1.2;
}

.progress{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: .8rem;
  font-weight: 700;
  color: rgba(255,255,255,.82);
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.08);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.05);
}

/* =======================
   ✅ List layout stable
   ======================= */

.onboarding-list{
  list-style:none;
  padding:0;
  margin:0;
  display:flex;
  flex-direction:column;
  gap: 6px; /* joli espacement */
}

.onboarding-list li{
  display:grid;
  grid-template-columns: 22px 1fr auto;
  align-items:center;
  column-gap: 10px;
  padding: 10px 10px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,.06);
  background: rgba(255,255,255,.03);
  transition: transform .18s ease, background .18s ease, border-color .18s ease;
}

/* hover discret */
.onboarding-list li:hover{
  background: rgba(255,255,255,.045);
  border-color: rgba(255,255,255,.10);
}

/* label */
.onboarding-list li > span{
  font-size: .92rem;
  font-weight: 600;
  letter-spacing: .1px;
  line-height: 1.2;
  color: rgba(255,255,255,.90);
}

/* =======================
   ⭕ / ✓ icon column
   ======================= */

.onboarding-list li::before{
  content:"";
  width: 18px;
  height: 18px;
  border-radius: 999px;
  display:block;
  box-sizing:border-box;
  border: 2px solid rgba(255,255,255,.28);
  background: rgba(255,255,255,.03);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.06);
}

.onboarding-list li.done::before{
  border-color: rgba(34,197,94,.55);
  background: rgba(34,197,94,.12);
  box-shadow: 0 0 0 3px rgba(34,197,94,.10), inset 0 1px 0 rgba(255,255,255,.06);
  position: relative;
}

.onboarding-list li.done::before{
  /* ✓ centré */
  content:"✓";
  display:flex;
  align-items:center;
  justify-content:center;
  font-size: .85rem;
  font-weight: 900;
  color: rgba(34,197,94,.95);
}

/* done state */
.onboarding-list li.done{
  opacity: .72;
}

.onboarding-list li.done > span{
  color: rgba(255,255,255,.62);
  text-decoration: line-through;
  text-decoration-thickness: 1px;
  text-decoration-color: rgba(255,255,255,.35);
}

/* =======================
   🎯 button (aligné)
   ======================= */

.onboarding-list button{
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(250,204,21,.35);
  background: linear-gradient(180deg, rgba(250,204,21,.95), rgba(245,158,11,.92));
  color: #111;
  font-size: .78rem;
  font-weight: 800;
  letter-spacing: .2px;
  cursor:pointer;
  box-shadow: 0 10px 18px rgba(250,204,21,.18);
  transition: transform .16s ease, box-shadow .16s ease, filter .16s ease;
  justify-self: end;
}

.onboarding-list button:hover{
  transform: translateY(-1px);
  box-shadow: 0 14px 24px rgba(250,204,21,.24);
  filter: saturate(1.05);
}

.onboarding-list button:active{
  transform: translateY(0);
  box-shadow: 0 8px 14px rgba(250,204,21,.16);
}

/* =======================
   ⏳ loading
   ======================= */

.onboarding-card.loading{
  background: linear-gradient(180deg, #121317, #0c0d10);
  border: 1px solid rgba(255,255,255,.08);
  text-align:center;
  color: rgba(255,255,255,.72);
}

.onboarding-card.loading p{
  margin: 6px 0;
  font-size: .92rem;
  font-weight: 600;
}

/* =======================
   📱 responsive
   ======================= */

@media (max-width: 420px){
  .onboarding-card{ padding: 16px 14px 12px; }
  .onboarding-list li{ padding: 10px 8px; }
  .onboarding-list li > span{ font-size: .9rem; }
  .onboarding-list button{ height: 28px; padding: 0 10px; font-size: .76rem; }
}


/* progress bar*/
.progress-bar{
  height: 6px;
  border-radius: 999px;
  background: rgba(255,255,255,.08);
  overflow: hidden;
  margin: 10px 0 14px;
}

.progress-bar-fill{
  height: 100%;
  background: linear-gradient(
    90deg,
    #facc15,
    #f59e0b
  );
  box-shadow: 0 0 12px rgba(250,204,21,.45);
  transition: width .35s ease;
}
/* stripe statut badge*/
.status-badge{
  justify-self: end;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: .72rem;
  font-weight: 700;
  letter-spacing: .2px;
}

.status-badge.warn{
  color: #facc15;
  background: rgba(250,204,21,.12);
  border: 1px solid rgba(250,204,21,.35);
}
/* animation when check est validé */
@keyframes stepPop {
  0%   { transform: scale(.96); }
  60%  { transform: scale(1.02); }
  100% { transform: scale(1); }
}

.onboarding-list li.done{
  animation: stepPop .25s ease;
}
/* hilight scroll vers lien d'invitation */
.highlight-invite{
  box-shadow:
    0 0 0 2px rgba(250,204,21,.35),
    0 0 24px rgba(250,204,21,.35);
  border-radius: 12px;
  transition: box-shadow .25s ease;
}
/* visuel 'ton compte est prêt' */
.onboarding-done{
  background: linear-gradient(
    135deg,
    rgba(34,197,94,.18),
    rgba(34,197,94,.08)
  );
  border: 1px solid rgba(34,197,94,.35);
  color: #a7f3d0;
  padding: 12px 14px;
  border-radius: 14px;
  font-weight: 800;
  text-align: center;
  box-shadow: 0 12px 30px rgba(34,197,94,.25);
}
/* next action */
/* next best action – compact */
.next-action {
  margin-bottom: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  background: linear-gradient(135deg, #1b1b1d, #242428);
  border: 1px solid rgba(255,255,255,0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.next-action-label {
  font-size: 0.82rem;
  font-weight: 500;
  color: rgba(255,255,255,0.85);
}

.next-action-btn {
  background: #facc15;
  color: #111;
  border: none;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.next-action-btn:hover {
  opacity: 0.88;
}

/* onboarding – details (minimal) */
/* onboarding details – ultra compact */
.onboarding-details {
  margin-top: 4px;
  font-size: 0.72rem;
  color: rgba(255,255,255,0.5);
}

.onboarding-details summary {
  cursor: pointer;
  list-style: none;
  font-weight: 500;
  font-size: 0.72rem;
  color: rgba(255,255,255,0.65);
  margin-bottom: 2px;
}

.onboarding-details summary::marker {
  display: none;
}

.onboarding-details ul {
  margin: 2px 0 0;
}

.onboarding-details li {
  line-height: 1.35;
}

.onboarding-details li.done {
  opacity: 0.3;
  text-decoration: line-through;
}

.status-badge.skeleton {
  background: linear-gradient(
    90deg,
    #2a2a2a 25%,
    #3a3a3a 37%,
    #2a2a2a 63%
  );
  background-size: 400% 100%;
  animation: shimmer 1.2s infinite;
  color: transparent;
}

@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}

</style>
