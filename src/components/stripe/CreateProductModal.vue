<template>
  <div class="modal-backdrop" @click.self="close">
    <div class="modal-card">
      <h3>➕ Nouveau produit</h3>

      <form @submit.prevent="submit">
        <label>
          Nom du produit
          <input v-model="name" type="text" placeholder="Ex : Cours de basse mensuel" />
        </label>

        <label>
          Description
          <textarea
            v-model="description"
            rows="3"
            placeholder="Description courte du produit"
          />
        </label>

        <label>
          Catégorie
          <input v-model="category" type="text" placeholder="Cours / Formation / Autre" />
        </label>

        <label>
          Image (URL)
          <input v-model="imageUrl" type="text" placeholder="https://…" />
        </label>

<label>
  URL de téléchargement
  <input
    v-model="downloadUrl"
    type="url"
    placeholder="https://..."
  />
</label>


        <p v-if="error" class="error">❌ {{ error }}</p>

        <div class="actions">
          <button type="button" class="btn secondary" @click="close">
            Annuler
          </button>

          <button class="btn" :disabled="loading">
            <span v-if="!loading">Créer</span>
            <span v-else class="spinner"></span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { useAuthStore } from "@/stores/authStore.js"
import { getValidToken } from "@/utils/api"
import { getProxyPostURL } from "@/config/gas.ts"

const emit = defineEmits(["created", "close"])

const auth = useAuthStore()
const proxyUrl = getProxyPostURL()

const name = ref("")
const description = ref("")
const category = ref("")
const imageUrl = ref("")
const downloadUrl = ref("")

const loading = ref(false)
const error = ref("")

const close = () => emit("close")
const slugify = str =>
  str
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")

const submit = async () => {
  error.value = ""

  if (!name.value.trim()) {
    error.value = "Le nom du produit est obligatoire"
    return
  }
if (downloadUrl.value && !downloadUrl.value.startsWith("http")) {
  error.value = "URL de téléchargement invalide"
  return
}

  console.group("📦 CreateProductModal → submit")
  loading.value = true

  try {
    const jwt = await getValidToken()

    const droit_code = slugify(name.value)

const payload = {
  route: "createproduct",
  jwt,
  prof_id: auth.user.prof_id,
  name: name.value.trim(),
  description: description.value.trim(),
  category: category.value.trim(),
  image_url: imageUrl.value.trim(),
  download_url: downloadUrl.value.trim() || null,
  droit_code
}



    console.log("➡️ payload =", payload)

    const res = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(r => r.json())

    console.log("⬅️ response =", res)

    if (!res.success) {
      error.value = "Erreur lors de la création du produit"
      return
    }

    emit("created")
    close()

  } catch (e) {
    console.error("❌ create product error", e)
    error.value = "Erreur réseau"
  } finally {
    loading.value = false
    console.groupEnd()
  }
}
</script>

<style scoped>
/* =========================
   BACKDROP
   ========================= */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* =========================
   CARD
   ========================= */
.modal-card {
  background: #0b0c0f;
  border-radius: 18px;
  padding: 24px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6);
  color: #e6e6e6;
}

/* =========================
   TITLE
   ========================= */
h3 {
  margin: 0 0 18px;
  font-size: 1.1rem;
  font-weight: 500;
  letter-spacing: 0.3px;
}

/* =========================
   FORM
   ========================= */
label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.85rem;
  color: #b3b3b3;
  margin-bottom: 14px;
}

input,
textarea {
  background: #111318;
  border: 1px solid #1f2933;
  border-radius: 12px;
  padding: 10px 12px;
  color: #f5f5f5;
  font-size: 0.9rem;
}

input::placeholder,
textarea::placeholder {
  color: #777;
}

/* focus Apple-like */
input:focus,
textarea:focus {
  outline: none;
  border-color: #fb923c;
}

/* =========================
   ACTIONS
   ========================= */
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

/* boutons */
.btn {
  background: #fb623c;
  color: #0b0c0f;
  border: none;
  border-radius: 999px;
  padding: 8px 18px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
}

.btn:hover {
  opacity: 0.9;
}

.btn.secondary {
  background: transparent;
  color: #9a9a9a;
}

.btn.secondary:hover {
  color: #e6e6e6;
}

/* =========================
   ERROR
   ========================= */
.error {
  color: #fca5a5;
  font-size: 0.8rem;
  margin-top: 4px;
}

/* =========================
   SPINNER
   ========================= */
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.25);
  border-top-color: #fb923c;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

</style>
