<template>
  <div class="prof-profile-form dark">

    <h3>Profil public</h3>
    <p class="subtitle">Visible par les élèves et sur ta page publique</p>

    <div class="grid">
      <div class="field full">
        <label>Statut public</label>
        <input v-model="form.statut_public" placeholder="Prof de basse · Artiste" />
      </div>

      <div class="field full">
        <label>Bio</label>
        <textarea v-model="form.bio" rows="4" placeholder="Ton parcours, ta vision, ton approche…" />
      </div>

      <div class="field">
        <label>Spécialités</label>
        <input v-model="form.specialites" placeholder="Jazz, Funk, Débutants…" />
      </div>

      <div class="field">
        <label>Site web</label>
        <input v-model="form.site_web" placeholder="https://…" />
      </div>

      <div class="field">
        <label>Logo (URL)</label>
        <input v-model="form.logo_url" placeholder="https://…" />
      </div>

      <div class="field color">
        <label>Couleur thème</label>
        <input type="color" v-model="form.couleur_theme" />
        <span class="color-preview" :style="{ background: form.couleur_theme }" />
      </div>
    </div>

    <div class="actions">
      <button class="btn ghost" @click="$emit('cancel')">Annuler</button>
      <button class="btn primary" :disabled="saving" @click="save">
        {{ saving ? "Enregistrement…" : "Enregistrer" }}
      </button>
    </div>

  </div>
</template>

<script setup>
import { reactive, watch, ref } from "vue"
import { useAuthStore, useProfStore } from "@/stores/authStore"
import { gasPost } from "@/config/gas.ts"

const emit = defineEmits(["saved", "cancel"])

const profStore = useProfStore()
const auth = useAuthStore()
const saving = ref(false)

const form = reactive({
  statut_public: "",
  bio: "",
  specialites: "",
  site_web: "",
  logo_url: "",
  couleur_theme: "#000000"
})

// hydrate depuis le store
watch(
  () => profStore.prof,
  prof => {
    if (!prof) return
    Object.assign(form, {
      statut_public: prof.statut_public || "",
      bio: prof.bio || "",
      specialites: prof.specialites || "",
      site_web: prof.site_web || "",
      logo_url: prof.logo_url || "",
      couleur_theme: prof.couleur_theme || "#000000"
    })
  },
  { immediate: true }
)

async function save() {
  saving.value = true
  try {
    await gasPost("updateProfProfile", {
      prof_id: auth.user.prof_id,
      ...form
    })

    await profStore.fetchProf(true) // refresh cache
    emit("saved")
  } finally {
    saving.value = false
  }
}
</script>
<style>
.prof-profile-form.dark {
  background: #0b0b0c;
  border: 1px solid #1f1f22;
  border-radius: 14px;
  padding: 20px;
  color: #e5e7eb;
}

h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.subtitle {
  font-size: 12px;
  opacity: 0.6;
  margin-bottom: 14px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.field.full {
  grid-column: span 2;
}

.field label {
  font-size: 11px;
  opacity: 0.7;
  margin-bottom: 4px;
  display: block;
}

.field input,
.field textarea {
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #1f1f22;
  background: #111113;
  color: #f3f4f6;
  font-size: 13px;
}

.field input::placeholder,
.field textarea::placeholder {
  color: #6b7280;
}

.field input:focus,
.field textarea:focus {
  outline: none;
  border-color: #444;
  background: #141416;
}

.field.color {
  display: flex;
  align-items: center;
  gap: 10px;
}

.field.color input[type="color"] {
  width: 40px;
  height: 34px;
  padding: 0;
  border: none;
  background: transparent;
}

.color-preview {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid #333;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

.btn {
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}

.btn.primary {
  background: #f3f4f6;
  color: #0b0b0c;
  border: none;
}

.btn.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn.ghost {
  background: transparent;
  color: #9ca3af;
  border: 1px solid #1f1f22;
}

</style>
