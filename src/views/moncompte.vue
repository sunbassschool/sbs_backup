<template>
  <Layout>
<div v-if="!isReady" class="logout-container-wrapper">
  <div class="logout-container">
    <div class="logout-spinner"></div>
    <p class="logout-text">Chargement de ton compte...</p>
  </div>
</div>


    <div v-else class="account-page container py-4">

      <!-- 🧍 Avatar + Abonnement côte à côte -->
<div class="cards-grid mb-4">


<!-- 📛 Avatar -->

<div class="account-card flex-fill text-center p-3 h-100">

<div class="avatar-placeholder mb-2 position-relative">
  <label for="avatar-upload" class="avatar-label">
<img
  v-if="userData.avatar_url"
  :src="getAvatarSrc(userData.avatar_url)"
  :class="['rounded-circle avatar-image', { 'avatar-uploading': isUploadingAvatar }]"
  alt="Avatar"
/>

    <i v-else class="bi bi-person-circle text-secondary" style="font-size: 120px;"></i>
    <input
      id="avatar-upload"
      type="file"
      accept="image/*"
      @change="onSelectFile"
      style="display: none;"
    />
  <div class="avatar-edit-icon" title="Modifier l'avatar">
  📷
</div>

  </label>
</div>



    <h2 class="fw-bold mb-0">{{ userData.prenom }}</h2>

<p class="text-muted small">{{ userData.email }}</p>
    <p>
      <span @click="showModal = true" class="editable text-warning" style="cursor: pointer;">
        ✏️ Modifier mes infos
      </span>
    </p>
  </div>

<!-- 🧾 Abonnement -->
<div class="account-card flex-fill p-3 shadow-sm rounded h-100">

    <h5 class="fw-semibold mb-2">Abonnement</h5>
    <template v-if="isSubscribed">
      <span class="badge bg-success text-uppercase fw-bold px-3 py-2 mb-2">✅ Abonnement actif</span>
      <div class="text-muted small">
        Type : <strong>{{ userData.type_abonnement }}</strong><br />
        Expire le : <strong>{{ formattedFinAcces }}</strong><br />
        <span v-if="isRecurrent" class="badge bg-warning text-dark mt-2">🔁 Renouvellement automatique</span><br />
        Cursus : <strong>{{ userData.cursus || "Non défini" }}</strong>
        <span v-if="userData.trimestre"> ( {{ userData.trimestre }})</span>
 <a href="#" @click.prevent="handleResiliation" class="text-muted small d-block mt-2" style="font-size: 0.85rem;">
  Résilier mon abonnement
</a>


      </div>
    </template>
    <template v-else>
      <span class="badge bg-danger text-uppercase fw-bold px-3 py-2 mb-2">❌ Abonnement expiré</span>
      <div class="text-muted small">
        Type : <strong>{{ userData.type_abonnement || "Non renseigné" }}</strong><br />
        Dernier accès : <strong>{{ formattedFinAcces }}</strong><br />
        Cursus : <strong>{{ userData.cursus || "Non défini" }}</strong>
        <span v-if="userData.trimestre"> (trimestre {{ userData.trimestre }})</span>




      </div>
    <RouterLink
  to="/abonnements"
  class="btn btn-sm mt-2 fw-bold"
  style="background-color: #333; color: white;"
>
  🔓 Débloquer avec un abonnement
</RouterLink>

    </template>
  </div>

</div>



<!-- 🎯 Objectif éditable -->
<div v-if="isReady" class="account-card p-3 mb-3 shadow-sm rounded goal-box" :class="{ 'shake': isSaving, 'pulse': savedAnimation }">
  <h5 class="fw-semibold mb-2">Objectif</h5>

<div v-if="isEditing">
  <input
    v-model="editableObjectif"
    class="form-control editable-input"
    @keyup.enter="saveObjectif"
    @blur="saveObjectif"
    autofocus
  />
  <button @click="saveObjectif" class="btn btn-link p-0 text-success mt-2">💾</button>
</div>

<div v-else>
  <p class="text-muted mb-0 d-flex justify-content-between align-items-center">
    <span>{{ objectif || "🎯 Aucun objectif défini" }}</span>

   <span class="editable text-warning" @click="editObjectif" title="Modifier l'objectif">✏️</span>
  </p>
</div>

</div>


<!-- 📂 Ressources -->
<div class="account-card p-3 shadow-sm rounded">
  <h5 class="fw-semibold mb-2">Ressources</h5>

  <ul class="list-unstyled mb-0">

    <template v-if="!isReady">
      <!-- ⏳ Skeleton pendant chargement -->
      <li class="skeleton-item w-75 mb-2"></li>
      <li class="skeleton-item w-50"></li>
    </template>

    <template v-else-if="!hasRessources">
      <!-- 🥲 Données chargées mais vides -->
<li class="text-muted small d-flex flex-column align-items-start">
  <span>🤷‍♂️ Aucune ressource disponible pour le moment.</span>
    <RouterLink
  to="/abonnements"
  class="btn btn-sm mt-2 fw-bold"
  style="background-color: #333; color: white;"
>
  🔓 Débloquer avec un abonnement
</RouterLink>
</li>


    </template>

    <template v-else>
      <!-- ✅ Données réelles -->
      <li v-if="userData.playlist_youtube">
        ▶️ <a :href="userData.playlist_youtube" target="_blank">Playlist YouTube</a>
      </li>
      <li v-if="userData.espace_google_drive">
        📁 <a :href="userData.espace_google_drive" target="_blank">Espace Google Drive</a>
      </li>
    </template>
  </ul>
</div>

   <div class="text-center mt-4">
  <button @click="handleLogout" class="logout-account-btn">
    <i class="bi bi-box-arrow-right"></i> Déconnexion
  </button>
  <!-- 🔐 Lien pour se déconnecter de tous les appareils -->
<div class="text-center mt-2 mb-4">
  <a href="#" @click.prevent="logoutAllDevices" class="link-light">
    ⚠️ Se déconnecter de tous les appareils
  </a>
</div>

<!-- 📋 Liste des sessions actives -->
<div class="account-card p-3 mb-4 shadow-sm rounded">
  <h5 class="fw-semibold mb-2">Mes sessions actives</h5>
<ul class="list-unstyled">
  <li v-if="isLoadingSessions" class="text-center">
    <div class="spinner-border mx-auto my-3"></div>
    <p class="text-muted small">Chargement des sessions...</p>
  </li>

  <li v-else-if="(sessions || []).length === 0" class="text-muted small">Aucune session active.</li>

 <li v-else v-for="(session, idx) in sessions" :key="session.sessionId" class="mb-2 d-flex justify-content-between align-items-start">
  <div>
    <strong>{{ (session.deviceInfo || '').substr(0,20) }}...</strong><br />
    <small class="text-muted">Dernier usage : {{ formatDateFR(session.lastUsed) }}</small>
  </div>
  <button @click="revokeSession(session.sessionId)" class="btn btn-sm btn-outline-danger ms-2" title="Déconnecter">
    <i class="bi bi-x-lg"></i>
  </button>
</li>

</ul>

</div>

</div>


    </div>
    <!-- 🧊 Modale Infos perso -->
<div v-if="showModal" class="overlay" @click.self="showModal = false">
  <div class="modal-content" @click.stop>
    <button class="close-btn" @click="showModal = false">
      <i class="bi bi-x-lg"></i>
    </button>
    <h5 class="minimal-title">👤 Modifier mes infos</h5>
    <ul class="list-unstyled">
      <li class="py-2">
  <div class="d-flex align-items-center flex-wrap gap-2">
    <strong class="me-2">Téléphone :</strong>

    <span
      v-if="!editingField.telephone"
      @click="editField('telephone')"
      class="editable text-success fw-normal"
      style="cursor: pointer;"
    >
      {{ formatTelephone(userData.telephone) }}
      <i class="bi bi-pencil ms-2 text-muted"></i>
    </span>

    <input
      v-else
      v-model="userData.telephone"
      type="text"
      class="form-control form-control-sm"
      style="max-width: 160px;"
      :class="{ 'is-invalid': !isValidPhoneNumber(userData.telephone) && userData.telephone }"
      @input="userData.telephone = formatPhoneInput(userData.telephone)"
      @blur="updateTelephone"
      @keyup.enter="updateTelephone"
    />
  </div>
</li>

      <li class="py-2 text-center">
 <RouterLink to="/forgot-password" class="link-edit-password">
  🔐 Modifier mon mot de passe
</RouterLink>


      </li>
    </ul>
  </div>
</div>
<!-- ✅ Toast générique -->
<transition name="fade">
  <div v-if="toastMessage" class="toast-feedback">
    {{ toastMessage }}
  </div>
</transition>
<!-- 🌄 Modale de recadrage d'avatar -->
<div v-if="cropModalVisible" class="overlay" @click.self="cancelCrop">
  <div class="modal-content">
    <h5 class="minimal-title">Recadrer votre avatar</h5>

    <vue-cropper
      ref="cropper"
      :src="tempImageSrc"
      :aspectRatio="1"
      :viewMode="1"
      :autoCropArea="1"
      style="width:100%; max-width:400px; height:400px;"
    />

    <!-- 🔄 Spinner pendant l’upload -->
    <div v-if="isUploadingAvatar" class="text-center my-3">
      <div class="spinner-border text-light" role="status">
        <span class="visually-hidden">Chargement...</span>
      </div>
      <div class="mt-2 text-muted small">Envoi de l’avatar...</div>
    </div>

   <!-- Boutons visibles uniquement si pas d'upload en cours -->
<div v-if="!isUploadingAvatar" class="d-flex justify-content-end mt-3">
  <button @click="cancelCrop" class="btn btn-secondary me-2">
    Annuler
  </button>
  <button @click="applyCrop" class="btn btn-primary">
    Valider
  </button>
</div>

  </div>
</div>

  </Layout>
</template>
<script setup>
import { ref, onMounted, watch, computed, nextTick } from "vue";
import { useRouter, onBeforeRouteLeave } from "vue-router";
import VueCropper from "vue-cropperjs";
import "@/assets/styles/cropper.css";
import { storeToRefs } from "pinia";

import Layout from "@/views/Layout.vue";
import { logoutUser } from "@/utils/api.ts";
import { useAuthStore } from "@/stores/authStore.js";

// === STORES ===
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

// === ROUTER ===
const router = useRouter();



// === OBJECTIF (instantané grâce à l'email stocké) ===
const objectif = ref("🎯 Chargement...");
const editableObjectif = ref("");

// Email toujours disponible ici grâce au patch dans fetchUserData()
const email = localStorage.getItem("email") || "";
const prenom = localStorage.getItem("prenom") || "";

// 🔥 SOURCE LOCALE FIABLE : userInfos_<prenom>
const infosKey = `userInfos_${prenom}`;
const infosRaw = localStorage.getItem(infosKey);

if (infosRaw) {
  try {
    const infos = JSON.parse(infosRaw);

    objectif.value = infos.objectif || "🎯 Aucun objectif défini";
    editableObjectif.value = objectif.value;

    console.log("⚡ Objectif chargé via userInfos :", objectif.value);
  } catch {
    objectif.value = "🎯 Aucun objectif défini";
  }
}

// 🔥 SECOND SOURCE : userData_<email> (si existant)
if (email) {
  const dataKey = `userData_${email}`;
  const dataRaw = localStorage.getItem(dataKey);

  if (dataRaw) {
    try {
      const data = JSON.parse(dataRaw);

      if (data.objectif) {
        objectif.value = data.objectif;
        editableObjectif.value = objectif.value;

        console.log("⚡ Objectif enrichi via userData :", objectif.value);
      }
    } catch {}
  }
}

// 🔥 SYNC STORE → OBJECTIF quand le store finit de charger
watch(
  () => user.value?.objectif,
  (val) => {
    if (!val) return;

    objectif.value = val;
    editableObjectif.value = val;

    // sauvegarde
    if (email) {
      const key = `userData_${email}`;
      const cached = JSON.parse(localStorage.getItem(key) || "{}");
      cached.objectif = val;
      localStorage.setItem(key, JSON.stringify(cached));
    }

    if (prenom) {
      const infosKey = `userInfos_${prenom}`;
      const cachedInfos = JSON.parse(localStorage.getItem(infosKey) || "{}");
      cachedInfos.objectif = val;
      localStorage.setItem(infosKey, JSON.stringify(cachedInfos));
    }

    console.log("🟢 Objectif mis à jour via store :", val);
  },
  { immediate: false }
);



// === AUTRES REFS / ÉTATS ===
const cropper = ref(null);
const cropModalVisible = ref(false);
const tempImageSrc = ref(null);
let selectedFile = null;

const isEditing = ref(false);
const isSaving = ref(false);
const savedAnimation = ref(false);
const showToast = ref(false);
const toastMessage = ref("");

const ressources = ref([]);
const isLoadingResources = ref(true);
const isReady = ref(false);
const isRefreshing = ref(false);
const isPageMounted = ref(false);
const isUserDataLoaded = ref(false);

const userData = ref({});
const sessions = ref([]);
const isLoadingSessions = ref(true);

const isUploadingAvatar = ref(false);
const showModal = ref(false);
const editingField = ref({ telephone: false });
const isRecurrent = ref(false);
const formattedFinAcces = ref("");
const scrollContainer = ref(null);

// === COMPUTED ===
const isSubscribed = computed(() => {
  const statut = (userData.value?.statut || "").toLowerCase();
  return (
    ["abonné", "payant", "inscrit", "actif"].includes(statut) &&
    !!userData.value?.fin_acces
  );
});

const hasRessources = computed(() => {
  const yt = (userData.value.playlist_youtube || "").trim();
  const drive = (userData.value.espace_google_drive || "").trim();
  return yt.length > 0 || drive.length > 0;
});

// === DECONNEXION ===
const handleLogout = async () => {
  await logoutUser();
  authStore.$reset();
};



// === GUARD CHANGEMENT DE PAGE ===
onBeforeRouteLeave((to, from, next) => {
  if (isEditing.value) {
    saveObjectif().then(() => next());
    return;
  }

  if (isSaving.value) {
    const check = setInterval(() => {
      if (!isSaving.value) {
        clearInterval(check);
        next();
      }
    }, 200);
    return;
  }

  next();
});


function editField(field) {
  editingField.value[field] = true;
}
function getAvatarSrc(url) {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)\//);
  if (match) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  return url;
}
function handleResiliation() {
  if (confirm("❗ Voulez-vous vraiment résilier votre abonnement ?")) {
    resilierAbonnementStripe(email);
  }
}

function onSelectFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = () => {
    tempImageSrc.value = reader.result;
    cropModalVisible.value = true;
  };
  reader.readAsDataURL(file);
}

function cancelCrop() {
  cropModalVisible.value = false;
  tempImageSrc.value = null;
  selectedFile = null;
}
async function resilierAbonnementStripe(emailLocal) {
  const payload = {
    route: "resiliation_abonnement",
    email: emailLocal
  };

  const apiBaseURL = "https://script.google.com/macros/s/AKfycbwwOqLh1roORKXiEiqtxpmABU7uCtfsNaxs3Gej3IvLqzHsgG5Pifb_usNNi8ovSX0XgA/exec"; // Remplace par le bon ID
  const proxyURL = `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(apiBaseURL)}`;

  try {
    const res = await fetch(proxyURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (result.status === "success") {
      alert("✅ Votre abonnement a bien été résilié !");
    } else {
      alert("❌ Erreur : " + result.message);
    }
  } catch (err) {
    console.error("⛔ Erreur réseau :", err);
    alert("⛔ Une erreur réseau est survenue.");
  }
}

async function applyCrop() {
  if (!cropper.value) return;
    isUploadingAvatar.value = true; // ⏳

  if (!selectedFile) {
    triggerToast("❌ Aucun fichier sélectionné");
    return;
  }

  const canvas = cropper.value.getCroppedCanvas({
    width: 300,
    height: 300,
    fillColor: '#fff'
  });

  canvas.toBlob(async (blob) => {
    const reader = new FileReader();

    reader.onloadend = async () => {
      const base64Data = reader.result.split(',')[1];
      const emailLocal = localStorage.getItem("email") || "";

      const payload = {
        route: "upload_avatar",
        email: emailLocal,
        fileBlob: base64Data,
        filename: selectedFile.name,
        mimeType: selectedFile.type || "image/png"
      };

      const apiBaseURL = "https://script.google.com/macros/s/AKfycbwwOqLh1roORKXiEiqtxpmABU7uCtfsNaxs3Gej3IvLqzHsgG5Pifb_usNNi8ovSX0XgA/exec";
      const proxyURL = `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(apiBaseURL)}`;

      try {
        const res = await fetch(proxyURL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.success && data.url) {
          userData.value.avatar_url = data.url;

         const userDataKey = computed(() => `userData_${email.value}`);

          const updatedData = { ...userData.value, avatar_url: data.url };
          localStorage.setItem(userDataKey, JSON.stringify(updatedData));

          triggerToast("🖼️ Avatar mis à jour !");
        } else {
          triggerToast("❌ Erreur lors de l’upload.");
        }

      } catch(err) {
        triggerToast("❌ Problème de réseau.");
      }

      // ✅ seulement ici
              isUploadingAvatar.value = false;

      cancelCrop();
    };

    reader.readAsDataURL(blob);

  }, selectedFile.type || "image/png");

}

function formatTelephone(number) {
  if (!number || typeof number !== "string") return "Non renseigné";

  // Supprime tout sauf les chiffres
  const cleaned = number.replace(/\D/g, "");

  // Découpe en blocs de 2 chiffres
  return cleaned.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}
function reSyncUserDataIfNeeded() {
  const currentRoute = router.currentRoute.value.path;
  if (currentRoute === "/moncompte") {
    console.log("🔁 Re-synchronisation forcée de userData dans /moncompte");
    localStorage.setItem("resyncUserData", Date.now()); // 🔔 signal simple
  }
}
function formatPhoneInput(value) {
  if (!value) return "";
  const digits = value.replace(/\D/g, "").slice(0, 10);
  return digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}
async function handleAvatarUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = async () => {
    const base64Data = reader.result.split(",")[1];
    const email = localStorage.getItem("email") || "";

    const apiBaseURL = "https://script.google.com/macros/s/AKfycbwwOqLh1roORKXiEiqtxpmABU7uCtfsNaxs3Gej3IvLqzHsgG5Pifb_usNNi8ovSX0XgA/exec";
    const proxyURL = `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(apiBaseURL)}`;

    console.log("📡 Appel API avatar (proxy):", proxyURL);

    const payload = {
      route: "upload_avatar",
      email,
      fileBlob: base64Data,
      filename: file.name,
      mimeType: file.type || "image/png"
    };

    try {
      const res = await fetch(proxyURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      console.log("📨 Réponse upload avatar :", data);

      if (data.success && data.url) {
        userData.value.avatar_url = data.url;
       const userDataKey = computed(() => `userData_${email.value}`);

        const updatedData = { ...userData.value, avatar_url: data.url };
        localStorage.setItem(userDataKey, JSON.stringify(updatedData));
        triggerToast("🖼️ Avatar mis à jour !");
      } else {
        console.error("❌ Upload échoué :", data.message);
        triggerToast("❌ Erreur lors de l’upload.");
      }
    } catch (err) {
      console.error("❌ Erreur fetch avatar :", err);
      triggerToast("❌ Problème de réseau.");
    }
  };

  reader.readAsDataURL(file);
}



async function revokeSession(sessionId) {
 const email = computed(() => authStore.email);
  if (!email || !sessionId) return;

  // 💨 SUPPRESSION VISUELLE IMMÉDIATE
  const indexToRemove = sessions.value.findIndex(s => s.sessionId === sessionId);
  if (indexToRemove !== -1) {
    sessions.value.splice(indexToRemove, 1);
  }

  const apiBase = "https://script.google.com/macros/s/AKfycbwwOqLh1roORKXiEiqtxpmABU7uCtfsNaxs3Gej3IvLqzHsgG5Pifb_usNNi8ovSX0XgA/exec";
  const url = `${apiBase}?route=revoke_session&email=${encodeURIComponent(email)}&sessionId=${encodeURIComponent(sessionId)}`;
  const finalURL = `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(url)}`;

  console.log("🧪 URL de révocation :", finalURL);

  try {
    const res = await fetch(finalURL);
    const data = await res.json();

    if (data.success) {
      console.log(`✅ Session ${sessionId} révoquée`);
      // facultatif : re-fetch pour valider
      // await fetchSessions();
    } else {
      console.warn("❌ Révocation échouée :", data.message);
      // 👉 Optionnel : réafficher la session si besoin
    }
  } catch (err) {
    console.error("❌ Erreur API lors de la révocation :", err);
    // 👉 Optionnel : réafficher la session si besoin
  }
}



function formatDateFR(isoDate) {
  if (!isoDate) return "Date inconnue";

  const date = new Date(isoDate);
  if (isNaN(date)) return "Date inconnue";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}


function editObjectif() {
  console.log("✏️ Edit objectif");
  editableObjectif.value = objectif.value;
  isEditing.value = true;
  savedAnimation.value = false;
}
function triggerToast(message = "✅ Modification enregistrée !") {
  if (toastMessage.value) return; // 🔒 Ignore si un toast est déjà visible

  toastMessage.value = message;
  setTimeout(() => {
    toastMessage.value = "";
  }, 2000);
}

let isUpdatingPhone = false;
function isValidPhoneNumber(number) {
  if (!number) return true; // autorise vide

  const cleaned = number.replace(/\s+/g, '');
  // Numéro FR standard : 10 chiffres, commence par 0 ou +33
  const regex = /^(0\d{9}|(\+33|0033)[1-9]\d{8})$/;
  return regex.test(cleaned);
}

async function updateTelephone() {
  if (isUpdatingPhone) return;
  isUpdatingPhone = true;

  editingField.value.telephone = false;

  const jwt = localStorage.getItem("jwt") || sessionStorage.getItem("jwt");
  const telephone = userData.value.telephone?.trim() || "";

  if (!jwt) {
    console.warn("🚫 JWT manquant");
    isUpdatingPhone = false;
    return;
  }

  if (!isValidPhoneNumber(telephone)) {
    triggerToast("⚠️ Numéro invalide");
    isUpdatingPhone = false;
    return;
  }

  const encodedJWT = encodeURIComponent(jwt);
  const encodedTelephone = encodeURIComponent(telephone);

  const apiBaseURL = "https://script.google.com/macros/s/";
  const route = "AKfycbwwOqLh1roORKXiEiqtxpmABU7uCtfsNaxs3Gej3IvLqzHsgG5Pifb_usNNi8ovSX0XgA/exec";
  const finalURL = `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(
    `${apiBaseURL}${route}?route=updateeleve&jwt=${encodedJWT}&telephone=${encodedTelephone}`
  )}`;

  try {
    const res = await fetch(finalURL, {
      method: "GET",
      headers: { "X-Requested-With": "XMLHttpRequest" }
    });

    const data = await res.json();

    if (data.status !== "error") {
      console.log("📞 Téléphone mis à jour côté serveur");
      triggerToast("📞 Téléphone mis à jour !");

      const userDataKey = `userData_${prenom}`;
      const userInfosKey = `userInfos_${prenom}`;
      const updatedUserData = { ...userData.value, telephone };

      localStorage.setItem(userDataKey, JSON.stringify(updatedUserData));
      const infos = JSON.parse(localStorage.getItem(userInfosKey)) || {};
      infos.telephone = telephone;
      localStorage.setItem(userInfosKey, JSON.stringify(infos));
    } else {
      console.error("❌ Erreur API :", data.message);
    }
  } catch (err) {
    console.error("❌ Exception lors de la MAJ téléphone :", err);
  } finally {
    isUpdatingPhone = false;
  }
}
async function fetchSessions() {
  const email = computed(() => authStore.email);
  if (!email) return;
  const apiBase = "https://script.google.com/macros/s/AKfycbwwOqLh1roORKXiEiqtxpmABU7uCtfsNaxs3Gej3IvLqzHsgG5Pifb_usNNi8ovSX0XgA/exec";
  const url = `${apiBase}?route=get_sessions&email=${encodeURIComponent(email)}`;
  const proxyURL = `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(url)}`;

  try {
    const res = await fetch(proxyURL);
    const data = await res.json();
    if (data.sessions) {
      sessions.value = data.sessions;
      console.log("📡 Sessions reçues :", data.sessions);
    }
  } catch (err) {
    console.error("❌ fetchSessions error:", err);
  } finally {
    isLoadingSessions.value = false; // ✅ terminé
  }
}




async function updateObjectifOnServer(prenomLocal, jwt, objectifValue) {
  // 🧠 1. Mise à jour immédiate du localStorage
  const userInfosKey = `userInfos_${prenomLocal}`;
  const userDataKey = `userData_${prenomLocal}`;

  const userInfos = JSON.parse(localStorage.getItem(userInfosKey) || "{}");
  userInfos.objectif = objectifValue;
  localStorage.setItem(userInfosKey, JSON.stringify(userInfos));

  const userData = JSON.parse(localStorage.getItem(userDataKey) || "{}");
  if (Object.keys(userData).length > 0) {
    userData.objectif = objectifValue;
    localStorage.setItem(userDataKey, JSON.stringify(userData));
    console.log(`✅ Objectif mis à jour dans ${userDataKey}`);
  }

  // 🔔 2. Event custom pour réagir ailleurs dans l'app
  window.dispatchEvent(new CustomEvent("userDataUpdated", {
    detail: { prenom: prenomLocal }
  }));

  // 📡 3. Appel serveur ensuite
  const encodedJWT = encodeURIComponent(jwt);
  const encodedObjectif = encodeURIComponent(objectifValue);
  const url = `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(
    `https://script.google.com/macros/s/AKfycbwwOqLh1roORKXiEiqtxpmABU7uCtfsNaxs3Gej3IvLqzHsgG5Pifb_usNNi8ovSX0XgA/exec?route=updateeleve&jwt=${encodedJWT}&objectif=${encodedObjectif}`
  )}`;

  console.log("🔗 URL envoi objectif :", url);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-Requested-With": "XMLHttpRequest"
      }
    });

    const data = await res.json();
    if (data.status !== "error") {
      console.log("✅ Objectif confirmé côté serveur !");
      return true;
    } else {
      console.error("❌ Erreur retour serveur :", data.message);
      return false;
    }
  } catch (err) {
    console.error("❌ Erreur fetch objectif :", err);
    return false;
  }
}

async function logoutAllDevices() {
  const email = computed(() => authStore.email);
  if (!email) {
    alert("Adresse email introuvable.");
    return;
  }

  const apiBase = "https://script.google.com/macros/s/AKfycbwwOqLh1roORKXiEiqtxpmABU7uCtfsNaxs3Gej3IvLqzHsgG5Pifb_usNNi8ovSX0XgA/exec";
  const url = `${apiBase}?route=revoke_all_sessions&email=${encodeURIComponent(email)}`;
  const proxyURL = `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(url)}`;

  try {
    const res = await fetch(proxyURL);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error("❌ logoutAllDevices – réponse pas JSON :", text);
      alert("❌ Échec : réponse du serveur invalide.");
      return;
    }

    if (data.success) {
      alert(`✅ ${data.revoked} session(s) ont été révoquées.`);
      await handleLogout();
    } else {
      alert("❌ Impossible de révoquer les sessions.");
      console.warn("Erreur API :", data);
    }
  } catch (err) {
    console.error("❌ Erreur lors de la déconnexion globale :", err);
    alert("❌ Une erreur est survenue.");
  }
}

async function saveObjectif() {
  if (!isEditing.value) return;

  const trimmed = editableObjectif.value.trim();
  const newObjectif = trimmed || "🎯 Aucun objectif défini";
  objectif.value = newObjectif;

  isEditing.value = false;
  isSaving.value = true;
  savedAnimation.value = true;
  triggerToast("🎯 Objectif mis à jour !");

  const prenom = localStorage.getItem("prenom") || "";
  const email = localStorage.getItem("email") || "";
  const jwt = localStorage.getItem("jwt") || sessionStorage.getItem("jwt") || "";

  // 🔄 Mise à jour dans userInfos_<prenom>
  const userInfosKey = `userInfos_${prenom}`;
  const userInfosCache = JSON.parse(localStorage.getItem(userInfosKey) || "{}");
  userInfosCache.objectif = newObjectif;
  localStorage.setItem(userInfosKey, JSON.stringify(userInfosCache));

  // 🔄 Mise à jour dans userData_<email>
  const userDataKey = `userData_${email}`;
  const userDataRaw = localStorage.getItem(userDataKey);
  if (userDataRaw) {
    const userDataCache = JSON.parse(userDataRaw);
    userDataCache.objectif = newObjectif;
    localStorage.setItem(userDataKey, JSON.stringify(userDataCache));
    userData.value.objectif = newObjectif; // 🔄 MAJ immédiate du template
  }

  // 📡 API
  const success = await updateObjectifOnServer(prenom, jwt, newObjectif);
  if (!success) {
    console.error("❌ Échec mise à jour serveur.");
  }

  isSaving.value = false;
  setTimeout(() => {
    savedAnimation.value = false;
  }, 1000);
}


// moncompte.vue


onMounted(async () => {
  const email = authStore.email || authStore.user?.email || localStorage.getItem("email") || "";
const prenom = authStore.user?.prenom || localStorage.getItem("prenom") || "";

  console.log("📡 authStore.email =", authStore.email);
console.log("📡 authStore.user =", authStore.user);

  const handleRefresh = async () => {
  console.log("🔁 Pull‑to‑refresh MonCompte déclenché");
  isRefreshing.value = true;

  // Force un rechargement des données utilisateur
  await safeSyncUserData(); // ta fonction existante
  isRefreshing.value = false;
};

  fetchSessions();
const userInfosKey = `userInfos_${prenom}`;
const infosCache = JSON.parse(localStorage.getItem(userInfosKey) || "{}");



const userDataKey = `userData_${email}`;


  const rawUserData = localStorage.getItem(userDataKey);

if (rawUserData) {
  const data = JSON.parse(rawUserData);

  userData.value = { ...data };

  // 🔥 Injection immédiate de la date (fix du bug)
  if (data.fin_acces) {
    formattedFinAcces.value = formatDateFR(data.fin_acces);
    console.log("⚡ fin_acces chargée instantanément :", formattedFinAcces.value);
  }

  await safeSyncUserData();
  return;
}



else {
    // ✅ Fallback si aucune donnée en localStorage
    console.warn("⏳ userData manquant — tentative de rechargement depuis Google Sheets");

    const sheetAPI = `https://script.google.com/macros/s/AKfycbwwOqLh1roORKXiEiqtxpmABU7uCtfsNaxs3Gej3IvLqzHsgG5Pifb_usNNi8ovSX0XgA/exec`;
const queryURL = `${sheetAPI}?route=getelevebyemail&email=${encodeURIComponent(email)}`;

    const proxyURL = `https://cors-proxy-sbs.vercel.app/api/proxy?url=${encodeURIComponent(queryURL)}`;

    try {
      const res = await fetch(proxyURL);
      const data = await res.json();

if (data && data.email) {
  // données sheets OK
  userData.value = data;
  localStorage.setItem(userDataKey, JSON.stringify(data));
  await safeSyncUserData();
} else if (authStore.user?.email) {
  // fallback store (déjà chargé par initAuth)
  console.log("📥 Fallback sur authStore.user");
  userData.value = authStore.user;
  localStorage.setItem(userDataKey, JSON.stringify(authStore.user));
  await safeSyncUserData();
} else {
  console.warn("📭 Aucun fallback possible — ni Sheets ni authStore");
}

    } catch (err) {
      console.error("❌ Erreur lors du fetch de la fiche utilisateur :", err);
    }
  }

async function safeSyncUserData() {
  const email = computed(() => authStore.email);
  const prenom = computed(() => authStore.user?.prenom || "");

  const userDataKey = `userData_${email.value}`;
  const userInfosKey = `userInfos_${prenom.value}`;

  const cached = JSON.parse(localStorage.getItem(userDataKey) || "{}");
  const backup = JSON.parse(localStorage.getItem(userInfosKey) || "{}");

  // 🧠 Si userInfos contient un objectif plus récent, on le préfère
  if (backup?.objectif) {
    cached.objectif = backup.objectif;
  }

  // 🧠 Ne met à jour que si les données changent
  if (JSON.stringify(userData.value) !== JSON.stringify(cached)) {
    Object.assign(userData.value, cached);
    console.log("✅ userData.value mis à jour depuis le cache.");
  }

  objectif.value = cached.objectif || "🎯 Aucun objectif défini";
  editableObjectif.value = objectif.value;

 

 if (cached.fin_acces) {
  formattedFinAcces.value = formatDateFR(cached.fin_acces);
}

  isRecurrent.value = (cached.recurrent || "").toLowerCase() === "oui";

  isReady.value = true;
}


await nextTick();


 

window.addEventListener('userDataUpdated', (event) => {
  if (event.detail.prenom === prenom) {
    console.log("🔁 userDataUpdated event reçu dans moncompte");
    safeSyncUserData();
  }
});
});





</script>
<style scoped>

/** Avatar style  */
.avatar-placeholder {
  position: relative;
  display: inline-block;
}
.avatar-uploading {
  opacity: 0.4;
  pointer-events: none;
  filter: blur(1px);
  transition: opacity 0.3s ease;
}

.avatar-label {
  cursor: pointer;
  display: inline-block;
  position: relative;
}

.avatar-image {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border: 2px solid #666;
}

/* ✏️ Icône toujours visible */
.avatar-edit-icon {
  position: absolute;
  top: 6px;
  right: 6px;
  background: #333;
  color: white;
  border-radius: 50%;
  font-size: 0.9rem;
  padding: 5px;
  line-height: 1;
  box-shadow: 0 0 6px rgba(0,0,0,0.4);
  transition: transform 0.2s ease, background 0.2s ease;
}

.avatar-label:hover .avatar-edit-icon {
  transform: scale(1.15);
  background: #555;
}




.avatar-label:hover .avatar-edit-overlay {
  opacity: 1;
}


.account-page {
  color: #fff;
  background: linear-gradient(145deg, #1c1c1c, #111);
  padding: 30px 15px;
  border-radius: 12px;
}

.account-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  backdrop-filter: blur(6px);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.account-card:hover {
  transform: scale(1.01);
  box-shadow: 0 0 15px rgba(0, 255, 150, 0.1);
}

.avatar-placeholder i {
  font-size: 120px;
  color: #888;
}

h2 {
  font-size: 2rem;
  color: #f1c40f;
}

a {
  color: #d7491e;
  text-decoration: none;
}

a:hover {
  text-decoration: none;
  color: #d7491e;
    font-weight: bold;

}

.account-card h5 {
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 5px;
  margin-bottom: 10px;
}

.account-card li {
  padding: 5px 0;
  font-size: 1rem;
}

.text-muted {
  color: #aaa !important;
}

.text-success {
  color: #d7491e !important;
}

.text-danger {
  color: #e53935 !important;
}
.logout-account-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #ff4d4d, #b30000);
  color: white;
  font-weight: bold;
  font-size: 1rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(255, 0, 0, 0.3);
  transition: all 0.3s ease-in-out;
}

.logout-account-btn:hover {
  background: linear-gradient(135deg, #e60000, #990000);
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 20px rgba(255, 0, 0, 0.4);
}

/* style de la modale pour modifier les infos */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}
/* 🌈 Nouvelle modale */
.modal-content {
  background: rgba(18, 18, 18, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  color: #fff;
  padding: 30px 25px;
  border-radius: 20px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.6);
  position: relative;
  animation: fadeInScale 0.3s ease;
}

/* ✖️ bouton de fermeture */
.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: transparent;
  border: none;
  font-size: 1.6rem;
  color: #ff6b6b;
  cursor: pointer;
  transition: transform 0.2s ease;
}
.close-btn:hover {
  transform: rotate(90deg) scale(1.2);
}

/* 📞 Champ input téléphone */
.modal-content input[type="text"] {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 10px 14px;
  color: #fff;
  font-size: 1rem;
  border-radius: 10px;
  outline: none;
  transition: all 0.25s ease;
  margin-top: 8px;
}

.modal-content input[type="text"]:focus {
  background: rgba(255, 255, 255, 0.1);
  border-color: #1db954;
  box-shadow: 0 0 0 2px rgba(30, 215, 96, 0.3);
}

/* 🧊 apparition modale smooth */
@keyframes fadeInScale {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(30px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}


/* account card */
.account-card {
  min-height: 100%;
}
.cards-grid {
  display: grid;
  gap: 1rem;
}

@media (min-width: 768px) {
  .cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .cards-grid .account-card {
    height: 100%;
  }
}

/* TOAST de modification d'objectif */
.toast-feedback {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(40, 167, 69, 0.6);
  color: #fff;
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 0.9rem;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 9999;
  animation: slideIn 1.4s forwards ease-in-out; /* 🔥 animation complète ici */
}



/* fade-in/out transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes slideIn {
  0% {
    transform: translateX(-50%) translateY(20px);
    opacity: 0;
  }
  50% {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateX(-50%) translateY(-10px); /* vers le haut */
    opacity: 0;
  }
}
/* style lien modifier passpword */ 
.link-edit-password {
  color: #d7491e;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
  transition: color 0.2s ease;
}
.link-edit-password:hover {
  color: #d7491e;
  text-decoration: none;
    font-weight: bold;

}
/* loader RESSOURCS */
.skeleton-item {
  height: 16px;
  background: rgba(255, 255, 255, 0.07);
  border-radius: 8px;
  animation: pulseSkeleton 1.5s infinite;
}

@keyframes pulseSkeleton {
  0% {
    background-color: rgba(255, 255, 255, 0.04);
  }
  50% {
    background-color: rgba(255, 255, 255, 0.09);
  }
  100% {
    background-color: rgba(255, 255, 255, 0.04);
  }
}

/** loading style */
.loading-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
  border: 0.25em solid rgba(255, 255, 255, 0.3);
  border-top: 0.25em solid red;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
/** style message erreur téléphone */
.is-invalid {
  border-color: #dc3545;
  box-shadow: 0 0 0 0.15rem rgba(220, 53, 69, 0.25);
}
/** liens pour les boutons */
.btn-neutral {
  background-color: #333 !important;
  color: white !important;
  border: none;
}
.btn-neutral:hover {
  background-color: #444 !important;
  color: white !important;
}
.logout-container-wrapper {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 99999;
  pointer-events: none;
}

.logout-container {
  
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #121212, #1e1e1e);
  color: #ff4c4c;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid #ff4c4c33;
  box-shadow: 0 0 10px rgba(255, 76, 76, 0.25);
  border-radius: 6px;
  animation: fadeIn 0.3s ease-in-out;
  white-space: nowrap;
}

.logout-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #ff4c4c55;
  border-top: 2px solid #ff7f50;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

.logout-text {
  margin: 0;
  color: #ff7f50;
  text-shadow: 0 0 3px rgba(255, 127, 80, 0.3);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}


</style>