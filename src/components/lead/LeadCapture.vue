<!-- src/components/lead/LeadCapture.vue -->
<script setup lang="ts">
import { ref, onMounted } from "vue"
import { captureLeadApi } from "@/api/Lead.ts"

const props = defineProps<{
  productId: string
}>()

const email = ref("")
const loading = ref(false)
const success = ref(false)
const error = ref<string | null>(null)

const submit = async () => {
  if (!email.value) return

  loading.value = true
  error.value = null

  try {
    const res = await captureLeadApi({
      email: email.value,
      product_id: props.productId,
      source: "landing_modal"
    })

    if (res?.ok) {
      success.value = true
    } else {
      error.value = "Une erreur est survenue"
    }
  } catch (e:any) {
    error.value = e.message
  }

  loading.value = false
}
onMounted(() => {
  console.log("LeadCapture mounted", props.productId)
})

</script>

<template>
  <div class="lead">

    <!-- SUCCESS -->
    <template v-if="success">
      <div class="state success">
        <div class="badge">✓</div>
        <h3>Mail envoyé</h3>
        <p>
          Tu vas recevoir l’accès dans quelques instants.<br />
          Vérifie aussi tes spams.
        </p>
      </div>
    </template>

    <!-- FORM -->
    <template v-else>
      <h3>Accès gratuit</h3>
      <p class="sub">
        Vidéo + livret PDF. Accès immédiat.
      </p>

      <label class="field">
        <span class="label">Email</span>
        <input
          v-model="email"
          type="email"
          inputmode="email"
          autocomplete="email"
          placeholder="ton@email.com"
          class="input"
          @keyup.enter="submit"
        />
      </label>

      <button class="btn" :disabled="loading" @click="submit">
        <span v-if="!loading">Recevoir l’accès</span>
        <span v-else class="dots" aria-label="envoi en cours"></span>
      </button>

      <p v-if="error" class="error">{{ error }}</p>
      <p class="privacy">🔒 Jamais de spam. Désinscription en 1 clic.</p>
    </template>

  </div>
</template>

<style scoped>
/* ======================================================
   TOKENS — DA DARK PREMIUM (SOBRE)
====================================================== */

.lead{
  --bg: #0b0b12;
  --panel: rgba(255,255,255,0.04);
  --panel-2: rgba(255,255,255,0.02);
  --border: rgba(255,255,255,0.08);

  --text: #f1f5f9;
  --soft: #cbd5e1;
  --muted: #94a3b8;

  --accent: #f59e0b; /* amber unique */
  --accent-soft: rgba(245,158,11,0.16);
  --danger: #fb7185;

  color: var(--text);
}

/* ======================================================
   WRAPPER — CARD CLEAN
====================================================== */

.lead{
  width: 100%;
  max-width: 420px;

  padding: 28px;
  border-radius: 18px;

  background:
    linear-gradient(180deg, var(--panel), var(--panel-2));
  border: 1px solid var(--border);

  box-shadow: 0 18px 50px rgba(0,0,0,0.55);
}

/* ======================================================
   TITLES
====================================================== */

.lead h3{
  margin: 0 0 10px;
  font-size: 1.25rem;
  font-weight: 900;
  letter-spacing: -0.2px;
}

.sub{
  margin: 0 0 18px;
  color: var(--soft);
  font-size: 0.92rem;
  line-height: 1.55;
}

/* ======================================================
   FIELD
====================================================== */

.field{
  display: block;
  text-align: left;
  margin: 0 0 14px;
}

.label{
  display: block;
  font-size: 0.78rem;
  color: var(--muted);
  margin: 0 0 6px;
}

.input{
  width: 100%;
  padding: 12px 12px;
  border-radius: 12px;

  background: rgba(0,0,0,0.28);
  border: 1px solid var(--border);
  color: var(--text);

  outline: none;
  transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;
}

.input::placeholder{
  color: rgba(148,163,184,0.65);
}

.input:focus{
  border-color: rgba(245,158,11,0.55);
  box-shadow: 0 0 0 4px var(--accent-soft);
  background: rgba(0,0,0,0.34);
}

/* ======================================================
   BUTTON — SOBER PREMIUM (ACCENT UNIQUE)
====================================================== */

.btn{
  width: 100%;
  border: 0;
  cursor: pointer;

  padding: 12px 14px;
  border-radius: 999px;

  font-weight: 800;
  font-size: 0.95rem;

  color: #0b0b12;
  background: var(--accent);

  transition: transform .2s ease, filter .2s ease, opacity .2s ease;
  box-shadow: 0 10px 26px rgba(245,158,11,0.18);
}

.btn:hover:not(:disabled){
  transform: translateY(-2px);
  filter: brightness(1.03);
}

.btn:disabled{
  opacity: 0.7;
  cursor: not-allowed;
}

/* ======================================================
   LOADING — DOTS (SOBRE)
====================================================== */

.dots{
  display: inline-block;
  width: 42px;
  height: 10px;
  position: relative;
}

.dots::before,
.dots::after{
  content:"";
  position:absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(11,11,18,0.7);
  animation: dot 0.9s infinite ease-in-out;
}

.dots::before{ left: 10px; }
.dots::after{ left: 24px; animation-delay: 0.12s; }

@keyframes dot{
  0%, 100% { transform: translateY(-50%) scale(0.9); opacity: 0.6; }
  50%      { transform: translateY(-50%) scale(1.15); opacity: 1; }
}

/* ======================================================
   SUCCESS STATE
====================================================== */

.state{
  padding: 6px 0;
}

.badge{
  width: 42px;
  height: 42px;
  margin: 0 auto 12px;
  border-radius: 999px;

  display: grid;
  place-items: center;

  background: rgba(245,158,11,0.14);
  border: 1px solid rgba(245,158,11,0.25);
  color: var(--accent);
  font-weight: 900;
  font-size: 1.05rem;
}

.state p{
  margin: 0;
  color: var(--soft);
  line-height: 1.6;
}

/* ======================================================
   ERROR + PRIVACY
====================================================== */

.error{
  margin: 12px 0 0;
  color: var(--danger);
  font-size: 0.85rem;
}

.privacy{
  margin: 14px 0 0;
  color: var(--muted);
  font-size: 0.75rem;
}

/* ======================================================
   MOBILE
====================================================== */

@media (max-width: 420px){
  .lead{ padding: 22px; }
}
</style>
