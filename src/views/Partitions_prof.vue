<template>
  <Layout>
    <div class="page">

      <!-- HEADER -->
      <header class="header">
    

        <button
          class="btn-primary"
          :disabled="!partitionsFolderId"
          @click="showUpload = true"
        >
          ➕ Ajouter une partition
        </button>
      </header>

      <!-- UPLOAD -->
      <UploadFileCore
        v-if="showUpload && partitionsFolderId"
        :folder-id="partitionsFolderId"
        @uploaded="onUploaded"
        @done="showUpload = false"
      />

<!-- LIST -->
<div v-if="loadingPartitions" class="loading">
  Chargement des partitions…
</div>

<div v-else-if="partitions.length" class="list">
  <div class="list-header">
    <span>Nom</span>
    <span>Date</span>
  </div>

<div
  v-for="p in partitions"
  :key="p.upload_id"
  class="row"
  @click="preview(p)"
  @contextmenu.prevent="openPartitionMenu($event, p)"
  @touchstart.passive="startLongPress($event, p)"
  @touchend="cancelLongPress"
>


  <div class="name">
      <button
    class="edit-btn inline"
    title="Éditer"
    @click.stop="openEdit(p)"
  >
    ✏️
  </button>
    <span v-if="isIncomplete(p)" class="warn">⚠️</span>

<span
  v-if="!isRenaming(p)"
  class="filename"
  @dblclick.stop="startRename(p)"
>
  {{ p.file_name }}
</span>

<input
  v-else
  class="rename-input"
  v-model="renameValue"
  @blur="confirmRename(p)"
  @keyup.enter="confirmRename(p)"
  @keyup.esc="cancelRename"
  ref="renameInput"
/>

    <!-- META BADGES -->
  <span v-if="hasVal(p.niveau)" class="badge badge-niveau">{{ p.niveau }}</span>
<span v-if="hasVal(p.style)" class="badge badge-style">{{ p.style }}</span>

  </div>

<div class="actions">



  <span class="date">
    {{ formatDate(p.created_at) }}
  </span>
</div>

</div>


</div>

<p v-else class="empty">
  Aucune partition
</p>


    </div>

    <!-- PREVIEW -->
    <div
      v-if="showPreview"
      class="preview-backdrop"
      @click.self="showPreview=false"
    >
 

      <div class="preview-panel">
        <header class="preview-header">
          <strong>{{ previewFile.file_name }}</strong>

          <div class="actions">
            <button @click="open(previewFile.file_url)">Ouvrir</button>
            <button class="close" @click="showPreview=false">✖</button>
          </div>
        </header>

        <iframe
          :src="previewFile.file_url"
          class="preview-frame"
        />
      </div>
    </div>
<!-- EDIT META MODAL -->
<div
  v-if="showEdit"
  class="edit-backdrop"
  @click.self="showEdit = false"
>
<div
  class="edit-panel"
  @keyup.enter.prevent="saveMeta"
>
    <!-- HEADER -->
    <header class="edit-header">
      <strong>Éditer les informations</strong>
      <button class="close" @click="showEdit = false">✖</button>
    </header>

    <!-- FORM -->
    <div class="edit-body">

<div class="edit-row">
  <label>Nom du fichier</label>
  <input v-model="meta.file_name" />
</div>


      <div class="edit-row">
        <label>Style</label>
        <input v-model="meta.style" />
      </div>

      <div class="edit-row">
        <label>Niveau</label>
        <select v-model="meta.niveau">
          <option value="">—</option>
          <option>Débutant</option>
          <option>Intermédiaire</option>
          <option>Avancé</option>
        </select>
      </div>

      <div class="edit-row">
        <label>Compositeur</label>
        <input v-model="meta.compositeur" />
      </div>

      <div class="edit-row">
        <label>Tags</label>
        <input v-model="meta.tags" placeholder="walking,swing" />
      </div>

      <div class="edit-row">
        <label>Visibilité</label>
        <select v-model="meta.visibility">
          <option value="prof">Prof uniquement</option>
          <option value="eleves">Tous les élèves</option>
          <option value="restricted">Élèves spécifiques</option>
        </select>
      </div>

      <div
        v-if="meta.visibility === 'restricted'"
        class="edit-row"
      >
        <label>IDs élèves</label>
        <input
          v-model="meta.allowed_eleves"
          placeholder="eleve_123,eleve_456"
        />
      </div>
    </div>

    <!-- ACTIONS -->
    <footer class="edit-footer">
      <button class="btn-secondary" @click="showEdit = false">
        Annuler
      </button>
      <button class="btn-primary" @click="saveMeta">
        Enregistrer
      </button>
    </footer>

  </div>
</div>
<div
  v-if="contextMenu.visible"
  class="context-overlay"
  @click="closeContextMenu"
>
  <div
    class="context-menu"
    :style="{ top: contextMenu.y+'px', left: contextMenu.x+'px' }"
    @click.stop
  >
    <div
      class="context-item danger"
      @click="softDeletePartition(contextMenu.target); closeContextMenu()"
    >
      🗑️ Supprimer
    </div>
  </div>
</div>


  </Layout>
</template>



<script setup>
import { ref, onMounted, watch } from "vue"
import Layout from "@/views/Layout.vue"
import UploadFileCore from "@/components/UploadFileCore.vue"
import { useAuthStore } from "@/stores/authStore"
import { getProxyPostURL } from "@/config/gas"

// =====================================================
// SETUP
// =====================================================
const auth = useAuthStore()
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  target: null
})

const proxyUrl = getProxyPostURL()
const openEdit = (p) => {
  previewFile.value = p
  meta.value = {
      file_name: p.file_name || "",
    style: p.style || "",
    niveau: p.niveau || "",
    compositeur: p.compositeur || "",
    tags: p.tags || "",
    visibility: p.visibility || "prof",
    allowed_eleves: p.allowed_eleves || ""
  }
  showEdit.value = true
}

const showEdit = ref(false)
const hasVal = (v) => {
  if (v === null || v === undefined) return false
  return String(v).trim().length > 0
}

const isIncomplete = (p) => !hasVal(p?.niveau) || !hasVal(p?.style)
const saveQueue = ref([])
let isSaving = false
const enqueueSave = (payload) => {
  saveQueue.value.push(payload)
  processQueue()
}
const processQueue = async () => {
  if (isSaving || saveQueue.value.length === 0) return

  isSaving = true
  const payload = saveQueue.value.shift()

  try {
    const res = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })

    const text = await res.text()
    const data = JSON.parse(text)

    if (!data.success) {
      console.warn("⚠️ save failed", data)
    }
  } catch (err) {
    console.warn("⚠️ save network error", err)
  } finally {
    isSaving = false
    processQueue() // 🔁 suivant
  }
}
const stripExtension = (name = "") =>
  name.replace(/\.[^/.]+$/, "")

const partitions = ref([])
const partitionsFolderId = ref(null)
let longPressTimer = null

const startLongPress = (e, p) => {
  longPressTimer = setTimeout(() => {
    const touch = e.touches[0]
    openPartitionMenu(
      { clientX: touch.clientX, clientY: touch.clientY, preventDefault() {} },
      p
    )
  }, 500)
}

const cancelLongPress = () => {
  clearTimeout(longPressTimer)
}

const showUpload = ref(false)
const showPreview = ref(false)
const previewFile = ref(null)

const loadingPartitions = ref(true)
const meta = ref({
  style: "",
  niveau: "",
  compositeur: "",
  tags: "",
  visibility: "prof",
  allowed_eleves: ""
})

const renamingId = ref(null)
const renameValue = ref("")
const renameInput = ref(null)

const isRenaming = (p) => renamingId.value === p.upload_id

const startRename = (p) => {
  renamingId.value = p.upload_id
  renameValue.value = p.file_name
// soft delete 

  // focus input
  requestAnimationFrame(() => {
    renameInput.value?.focus()
    renameInput.value?.select()
  })
}

const cancelRename = () => {
  renamingId.value = null
  renameValue.value = ""
}
const saveMetaRename = async (upload_id, file_name) => {
  const res = await fetch(proxyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      route: "updateuploadmeta",
      upload_id,
      meta: { file_name }
    })
  })

  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new Error("Rename failed (non JSON response)")
  }
}
const openPartitionMenu = (e, p) => {
  e.preventDefault()
  contextMenu.value = {
    visible: true,
    x: e.clientX,
    y: e.clientY,
    target: p
  }
}

const closeContextMenu = () => {
  contextMenu.value.visible = false
}

const confirmRename = async (p) => {
  const newName = renameValue.value.trim()

  if (!newName || newName === p.file_name) {
    cancelRename()
    return
  }

  try {
    await saveMetaRename(p.upload_id, newName)

    // ✅ UPDATE RÉACTIF DANS LE TABLEAU
    const idx = partitions.value.findIndex(
      x => x.upload_id === p.upload_id
    )

    if (idx !== -1) {
      partitions.value[idx] = {
        ...partitions.value[idx],
        file_name: newName
      }
    }

    // ✅ SYNC PREVIEW SI OUVERTE
    if (previewFile.value?.upload_id === p.upload_id) {
      previewFile.value.file_name = newName
    }

    // ✅ CACHE
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        ts: Date.now(),
        data: partitions.value
      })
    )

  } catch (e) {
    console.error("❌ confirmRename ERROR", e)
  } finally {
    cancelRename()
  }
}


// =====================================================
// CACHE
// =====================================================
const CACHE_KEY = `partitions_${auth.user.prof_id}`
const CACHE_TTL = 5 * 60 * 1000 // 5 min

// =====================================================
// INIT
// =====================================================
onMounted(() => {
  const cached = sessionStorage.getItem(CACHE_KEY)
  if (cached) {
    try {
      const { data } = JSON.parse(cached)
      partitions.value = data
      loadingPartitions.value = false
    } catch {}
  }

  initFolder()
})

// quand le folder est prêt → load
watch(partitionsFolderId, (id) => {
  if (id) loadPartitions()
})

// =====================================================
// FOLDER
// =====================================================
const initFolder = async () => {
  const res = await fetch(proxyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      route: "getorcreateprofpartitionsfolder",
      jwt: auth.jwt,
      prof_id: auth.user.prof_id
    })
  }).then(r => r.json())

  if (res.success) {
    partitionsFolderId.value = res.folder_id
  }
}

// ouverture modal meta 

// =====================================================
// LOAD PARTITIONS
// =====================================================
const loadPartitions = async () => {
  loadingPartitions.value = partitions.value.length === 0

  const cached = sessionStorage.getItem(CACHE_KEY)
  if (cached) {
    try {
      const { ts, data } = JSON.parse(cached)
      if (Date.now() - ts < CACHE_TTL) {
        partitions.value = data
        loadingPartitions.value = false
        refreshPartitions() // refresh silencieux
        return
      }
    } catch {
      sessionStorage.removeItem(CACHE_KEY)
    }
  }

  await refreshPartitions()
}

const refreshPartitions = async () => {
  try {
    const res = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        route: "getuploadsbyprof",
        jwt: auth.jwt,
        prof_id: auth.user.prof_id
      })
    }).then(r => r.json())

    if (res.success) {
   const fresh = res.uploads
  .filter(u =>
    u.folder_id === partitionsFolderId.value &&
    !u.deleted_at // ou !u.is_deleted
  )

        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      partitions.value = fresh

      sessionStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ ts: Date.now(), data: fresh })
      )
    }
  } catch (e) {
    console.error("❌ refreshPartitions", e)
  } finally {
    loadingPartitions.value = false
  }
}

// =====================================================
// PREVIEW
// =====================================================
const preview = (p) => {
  meta.value = {
    style: p.style || "",
    niveau: p.niveau || "",
    compositeur: p.compositeur || "",
    tags: p.tags || "",
    visibility: p.visibility || "prof",
    allowed_eleves: p.allowed_eleves || ""
  }

  if (!p.file_type?.includes("pdf")) {
    open(p.file_url)
    return
  }

  previewFile.value = p
  showPreview.value = true
}

// save meta
const saveMeta = () => {
  if (!previewFile.value) return

  const uploadId = previewFile.value.upload_id

  // snapshot des valeurs actuelles du formulaire
  const metaSnapshot = {
    file_name: meta.value.file_name || "",
    style: meta.value.style || "",
    niveau: meta.value.niveau || "",
    compositeur: meta.value.compositeur || "",
    tags: meta.value.tags || "",
    visibility: meta.value.visibility || "prof",
    allowed_eleves: meta.value.allowed_eleves || ""
  }

  // ==============================
  // 1️⃣ DIFF (évite appels inutiles)
  // ==============================
  const metaDiff = {}

  Object.keys(metaSnapshot).forEach(key => {
    const prev = previewFile.value[key] ?? ""
    const next = metaSnapshot[key] ?? ""

    if (String(prev) !== String(next)) {
      metaDiff[key] = next
    }
  })

  // rien à sauvegarder
  if (Object.keys(metaDiff).length === 0) {
    showEdit.value = false
    return
  }

  const payload = {
    route: "updateuploadmeta",
    upload_id: uploadId,
    meta: metaDiff
  }

  // ==============================
  // 2️⃣ OPTIMISTIC UI
  // ==============================
  const idx = partitions.value.findIndex(p => p.upload_id === uploadId)
  if (idx !== -1) {
    partitions.value[idx] = {
      ...partitions.value[idx],
      ...metaDiff
    }
  }

  Object.assign(previewFile.value, metaDiff)

  sessionStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      ts: Date.now(),
      data: partitions.value
    })
  )

  showEdit.value = false

  // ==============================
  // 3️⃣ BACKEND (QUEUE)
  // ==============================
  enqueueSave(payload)
}




// softdelete 
const softDeletePartition = async (p) => {
  console.group("🗑️ [softDeletePartition]")
  console.log("▶️ partition cible :", p)

  if (!p?.upload_id) {
    console.error("❌ upload_id manquant")
    console.groupEnd()
    return
  }

  if (!confirm(`Supprimer la partition "${p.file_name}" ?`)) {
    console.log("⏹️ annulé par l'utilisateur")
    console.groupEnd()
    return
  }

  const snapshot = [...partitions.value]

  // ⚡ UI instant
  partitions.value = partitions.value.filter(
    x => x.upload_id !== p.upload_id
  )

  sessionStorage.setItem(
    CACHE_KEY,
    JSON.stringify({ ts: Date.now(), data: partitions.value })
  )

  const payload = {
    route: "softdeleteupload",
    jwt: auth.jwt,
    prof_id: auth.user.prof_id, // ✅ OBLIGATOIRE
    upload_id: p.upload_id
  }

  console.log("📡 payload envoyé :", payload)

  try {
    const res = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })

    const text = await res.text()
    console.log("📥 réponse brute :", text)

    const data = JSON.parse(text)
    console.log("✅ réponse parsée :", data)

    if (!data.success) {
      throw new Error(data.message || "backend_error")
    }

    console.log("🎉 soft delete confirmé")

  } catch (e) {
    console.error("🔥 ERREUR soft delete", e)

    // rollback
    partitions.value = snapshot
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ ts: Date.now(), data: snapshot })
    )

    alert("Erreur suppression partition")
  } finally {
    console.groupEnd()
  }
}





// =====================================================
// UPLOAD CALLBACK
// =====================================================
const onUploaded = (file) => {
  if (file.folder_id !== partitionsFolderId.value) return

  // 1️⃣ ajout instant dans la liste
  partitions.value.unshift(file)

  sessionStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      ts: Date.now(),
      data: partitions.value
    })
  )

  // 2️⃣ préparer l’édition meta (👈 ICI)
  previewFile.value = file
  meta.value = {
    file_name: stripExtension(file.file_name || ""),
    style: file.style || "",
    niveau: file.niveau || "",
    compositeur: file.compositeur || "",
    tags: file.tags || "",
    visibility: file.visibility || "prof",
    allowed_eleves: file.allowed_eleves || ""
  }

  // 3️⃣ ouvrir la modale d’édition
  showEdit.value = true
}



// =====================================================
// HELPERS
// =====================================================
const open = url => window.open(url, "_blank")
const formatDate = d => new Date(d).toLocaleDateString("fr-FR")

window.addEventListener("beforeunload", () => {
  saveQueue.value.forEach(payload => {
    navigator.sendBeacon(proxyUrl, JSON.stringify(payload))
  })
})

</script>



<style scoped>
  .context-menu {
  position: fixed;
  z-index: 9999;
  min-width: 180px;
  background: #1f1f1f;
  border: 1px solid #2e2e2e;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  padding: 6px 0;
  color: #f1f1f1;
  font-size: 14px;
}

.context-item {
  padding: 10px 14px;
  cursor: pointer;
  white-space: nowrap;
}

.context-item:hover {
  background: #2b2b2b;
}

.context-item.danger {
  color: #ff6b6b;
}

.context-item.danger:hover {
  background: rgba(255, 107, 107, 0.15);
}

.page {
  padding: 20px;
  max-width: 1100px;
  margin: 0 auto;
}
.actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.edit-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  opacity: 0.5;
  font-size: 0.9rem;
}

.row:hover .edit-btn {
  opacity: 1;
}

.edit-btn:hover {
  transform: scale(1.1);
}

.date {
  font-size: 0.8rem;
  color: #666;
}

/* HEADER */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header h2 {
  margin: 0;
  font-size: 1.6rem;
}

.subtitle {
  font-size: 0.85rem;
  color: #666;
}

/* BUTTON */
.btn-primary {
  background: #ff8c00;
  color: #000;
  border: none;
  padding: 8px 14px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* LIST */
.list {
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

/* HEADER ROW */
.list-header {
  display: grid;
  grid-template-columns: 1fr 140px;
  padding: 10px 14px;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: .04em;
  background: #f6f6f6;
  color: #777;
}

/* ROW */
.row {
  display: grid;
  grid-template-columns: 1fr 140px;
  padding: 10px 14px;
  align-items: center;
  cursor: pointer;
  border-top: 1px solid #eee;
  transition: background .12s ease;
}

.row:hover {
  background: #f9f9f9;
}

/* CELLS */
.name {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.filename {
  font-size: 0.9rem;
  color: #111;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.icon {
  font-size: 1.1rem;
}

.date {
  font-size: 0.8rem;
  color: #666;
  text-align: right;
}

/* EMPTY */
.empty {
  margin-top: 40px;
  text-align: center;
  color: #777;
}

/* PREVIEW */
.preview-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.75);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-panel {
  width: 92%;
  margin-top:90px;
  height: 92%;
  background: #fff;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
}

.preview-header {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.preview-header strong {
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actions button {
  margin-left: 8px;
  border: none;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
}

.actions .close {
  background: #eee;
}

.preview-frame {
  flex: 1;
  width: 100%;
  border: none;
}

/* MOBILE */
@media (max-width: 600px) {
  .list-header {
    display: none;
  }

  .row {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .date {
    text-align: left;
    font-size: 0.75rem;
  }

  .btn-primary {
    width: 100%;
    margin-top: 8px;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

/* ================================
   EDIT META MODAL
================================ */

.edit-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.55);
  z-index: 1100;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* PANEL */
.edit-panel {
  width: 420px;
  max-width: 92%;
  background: #fff;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,.25);
  animation: edit-pop .18s ease-out;
}

/* HEADER */
.edit-header {
  padding: 14px 16px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.edit-header strong {
  font-size: 1rem;
}

.edit-header .close {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  opacity: .6;
}

.edit-header .close:hover {
  opacity: 1;
}

/* BODY */
.edit-body {
  padding: 16px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

/* ROW */
.edit-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.edit-row label {
  font-size: 0.75rem;
  color: #666;
}

/* INPUTS */
.edit-row input,
.edit-row select {
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 0.85rem;
}

.edit-row input:focus,
.edit-row select:focus {
  outline: none;
  border-color: #ff8c00;
  box-shadow: 0 0 0 2px rgba(255,140,0,.2);
}

/* FOOTER */
.edit-footer {
  padding: 12px 16px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* BUTTONS */
.btn-primary {
  background: #ff8c00;
  color: #000;
  border: none;
  padding: 8px 14px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}

.btn-secondary {
  background: #eee;
  border: none;
  padding: 8px 14px;
  border-radius: 10px;
  cursor: pointer;
}

/* ANIMATION */
@keyframes edit-pop {
  from {
    transform: scale(.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* MOBILE */
@media (max-width: 480px) {
  .edit-panel {
    width: 100%;
    height: 100%;
    border-radius: 0;
    animation: none;
  }

  .edit-body {
    overflow-y: auto;
  }
}


.badge {
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: 6px;
  margin-left: 6px;
  white-space: nowrap;
}

.badge-niveau {
  background: #eef4ff;
  color: #1a4fd8;
}

.badge-style {
  background: #f2f2f2;
  color: #444;
}

.warn {
  font-size: 0.8rem;
  opacity: 0.6;
}

.warn:hover {
  opacity: 1;
}
/* =========================
   RESPONSIVE LIST ROW
========================= */

@media (max-width: 640px) {

  .row {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .name {
    flex-wrap: wrap;
    row-gap: 4px;
  }

  .filename {
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .badge {
    margin-left: 0;
    margin-right: 6px;
  }

  .actions {
    justify-content: space-between;
    width: 100%;
  }

  .date {
    font-size: 0.7rem;
    color: #888;
  }
}

@media (max-width: 640px) {

  .row {
    grid-template-columns: 1fr;
    padding: 12px;
    gap: 8px;
  }

  /* TEXTE */
  .name {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .filename {
    font-size: 0.9rem;
    font-weight: 500;
    line-height: 1.3;
  }

  /* BADGES */
  .badge {
    margin: 0 6px 0 0;
    font-size: 0.65rem;
  }

  /* ACTIONS */
  .actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .edit-btn {
    font-size: 0.85rem;
    opacity: 1;
  }

  /* WARNING */
  .warn {
    margin-left: auto;
    margin-right: 8px;
  }

  /* DATE */
  .date {
    font-size: 0.7rem;
    color: #999;
    white-space: nowrap;
  }
}

/* ✏️ INLINE EDIT – MOBILE */
@media (max-width: 640px) {

  .name {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }

  .edit-btn.inline {
    order: -1;
    opacity: 1;
    font-size: 0.9rem;
    padding: 2px 4px;
  }

  .icon {
    display: none; /* optionnel : enlève 📄 si trop chargé */
  }

  .filename {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .badge {
    margin-left: 0;
  }
}
.rename-input {
  font-size: 0.9rem;
  padding: 2px 4px;
  border-radius: 4px;
  border: 1px solid #ccc;
  width: 100%;
}
.context-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
}

</style>