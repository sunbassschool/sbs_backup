<template>
  <Layout>



    <div class="account-page container py-4">

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
@change="handleAvatarUpload"
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
      </span><br />
<a
  v-if="canEditProfProfile"
  class="link-prof-profile"
  @click="showProfModal = true"
>
  ✏️ Compléter ma fiche prof
</a>




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
<router-link
  to="/mes-achats"
  class="account-action d-flex align-items-center justify-content-between text-decoration-none mt-2"
>
  <span class="text-muted small" style="font-size: 0.85rem;">
    Consulter mes achats
  </span>
  <span class="ms-2 text-warning small">→</span>
</router-link>





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
<router-link
  to="/mes-achats"
  class="account-action d-flex align-items-center justify-content-between text-decoration-none mt-2"
>
  <span class="text-muted small" style="font-size: 0.85rem;">
    Consulter mes achats
  </span>
  <span class="ms-2 text-warning small">→</span>
</router-link>
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
  ref="telephoneInput"
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
 <teleport to="body">
      <div
        v-if="showProfModal"
        class="modal-overlay"
        @click.self="showProfModal = false"
      >
        <div class="modal-card">
          <ProfProfileForm
            @saved="onSaved"
            @cancel="showProfModal = false"
          />
        </div>
      </div>
    </teleport>
  </Layout>
</template>
<script setup>
  import Layout from "@/views/Layout.vue";
import { ref, onMounted, watch, computed, nextTick } from "vue";
import { useRouter, onBeforeRouteLeave } from "vue-router";
import VueCropper from "vue-cropperjs";
import "@/assets/styles/cropper.css";
import { getProxyPostURL, getProxyGetURL } from "@/config/gas"
import ProfProfileForm from "@/components/Profs/ProfProfileForm.vue"



import { logoutUser } from "@/utils/api.ts";
import { useAuthStore } from "@/stores/authStore.js";

// === STORES ===
const authStore = useAuthStore();
const canEditProfProfile = computed(() => {
  return authStore.user?.role === "prof" || authStore.user?.role === "admin"
})

const showProfModal = ref(false)


// === ROUTER ===
const router = useRouter();

// telephone
const telephoneInput = ref(null);


// === OBJECTIF = UNE SEULE SOURCE : LE STORE ===
const objectif = computed(() => {
  return authStore.user?.objectif || "🎯 Aucun objectif défini";
});

// Texte editable
const editableObjectif = ref(objectif.value);

// Si le store change → textarea suit
watch(objectif, (v) => {
  editableObjectif.value = v;
});



// Email toujours disponible ici grâce au patch dans fetchUserData()
const email = authStore.user?.email
           || localStorage.getItem("email")
           || sessionStorage.getItem("email")
           || "";

const prenom = localStorage.getItem("prenom") || "";

// 🔥 SOURCE LOCALE FIABLE : userInfos_<prenom>
const infosKey = `userInfos_${prenom}`;
const infosRaw = localStorage.getItem(infosKey);

if (infosRaw) {
  try {
    const infos = JSON.parse(infosRaw);

   authStore.user.objectif = infos.objectif || "🎯 Aucun objectif défini";
    editableObjectif.value = objectif.value;

    console.log("⚡ Objectif chargé via userInfos :", objectif.value);
  } catch {
    authStore.user.objectif = "🎯 Aucun objectif défini";
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
  // MAJ STORE
  if (authStore.user) {
    authStore.user = {
      ...authStore.user,
      objectif: data.objectif
    };
  }

  // MAJ TEXTAREA
  editableObjectif.value = data.objectif;
}

    } catch {}
  }
}

// 🔥 SYNC STORE → OBJECTIF quand le store finit de charger
watch(
  () => authStore.user?.objectif,
  (val) => {
    if (!val) return;


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
const isReady = ref(
  !!localStorage.getItem(`userData_${localStorage.getItem("email")}`)
)

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
  // 🔥 PAS DE BLOCAGE : on laisse la sauvegarde finir en background
  console.log("⏩ Navigation autorisée pendant la sauvegarde");
}


  next();
});


function onSaved() {
  showProfModal.value = false
}
function editField(field) {
  editingField.value[field] = true;

  // focus auto après rendu
  nextTick(() => {
    if (field === "telephone" && telephoneInput.value) {
      telephoneInput.value.focus();
      telephoneInput.value.select(); // optionnel : sélectionne tout
    }
  });
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

const proxyURL = getProxyPostURL();

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

const proxyURL = getProxyPostURL();

      try {
        const res = await fetch(proxyURL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.success && data.url) {
          userData.value.avatar_url = data.url;

const userDataKey = `userData_${email}`;

    const safeLocal = JSON.parse(JSON.stringify(userData.value || {}));
safeLocal.avatar_url = data.url;

localStorage.setItem(userDataKey, JSON.stringify(safeLocal));


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

  const file = event.target.files[0];   // ✅ d’abord on déclare
  if (!file) return;

  console.log("📸 Fichier reçu :", file);

  const reader = new FileReader();

  reader.onload = async () => {
    const base64Data = reader.result.split(",")[1];
  const email = authStore.user?.email
           || localStorage.getItem("email")
           || sessionStorage.getItem("email")
           || "";


const proxyURL = getProxyPostURL();


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

      const text = await res.clone().text();
      console.log("🔍 RAW RESPONSE:", text);

      const data = await res.json();

      console.log("📨 Réponse upload avatar :", data);

      if (!data.success || !data.url) {
        console.error("❌ Upload échoué :", data.message);
        triggerToast("❌ Erreur lors de l’upload");
        return;
      }

      // 🔥 Mise à jour store
      authStore.$patch({
        user: {
          ...authStore.user,
          avatar_url: data.url
        }
      });

      // 🔥 Mise à jour userData local
      const userDataKey = `userData_${email}`;
      const safeLocal = JSON.parse(JSON.stringify(userData.value || {}));

      safeLocal.avatar_url = data.url;

      localStorage.setItem(userDataKey, JSON.stringify(safeLocal));
      userData.value.avatar_url = data.url;

      triggerToast("🖼️ Avatar mis à jour !");
    }
    catch (err) {
      console.error("❌ Erreur fetch avatar :", err);
      triggerToast("❌ Problème réseau");
    }
  };

  reader.readAsDataURL(file);
}




async function revokeSession(sessionId) {
const email = computed(() => authStore.user?.email || "");
  if (!email || !sessionId) return;

  // 💨 SUPPRESSION VISUELLE IMMÉDIATE
  const indexToRemove = sessions.value.findIndex(s => s.sessionId === sessionId);
  if (indexToRemove !== -1) {
    sessions.value.splice(indexToRemove, 1);
  }

const finalURL = getProxyGetURL(
  `route=revoke_session` +
  `&email=${encodeURIComponent(email)}` +
  `&sessionId=${encodeURIComponent(sessionId)}`
);

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

  const raw = userData.value.telephone || "";
  const cleanInput = raw.trim();

  const prenomLocal = localStorage.getItem("prenom") || "";
  const emailLocal = localStorage.getItem("email") || "";
  const jwt = localStorage.getItem("jwt") || sessionStorage.getItem("jwt") || "";

  // 🔥 RÉCUPÉRATION DU VRAI ANCIEN NUMÉRO (dans le cache, NON modifié par v-model)
  const userDataKey = `userData_${emailLocal}`;
  const cached = JSON.parse(localStorage.getItem(userDataKey) || "{}");

  const previousPhone = (cached.telephone || "").replace(/\s+/g, "").trim();
  const newPhone = cleanInput.replace(/\s+/g, "").trim();

  // 🚫 Aucun changement → on stoppe net
  if (previousPhone === newPhone) {
    console.log("☎️ Aucun changement → pas d'appel API");
    isUpdatingPhone = false;
    return;
  }

  // ❌ Vérif validité numéro
  if (!isValidPhoneNumber(cleanInput)) {
    triggerToast("⚠️ Numéro invalide");
    isUpdatingPhone = false;
    return;
  }

  // 🔥 OPTIMISTIC UPDATE : UI + cache instantané
  userData.value.telephone = cleanInput;

  // localStorage : userData_<email>
  cached.telephone = cleanInput;
  localStorage.setItem(userDataKey, JSON.stringify(cached));

  // localStorage : userInfos_<prenom>
  const userInfosKey = `userInfos_${prenomLocal}`;
  const infos = JSON.parse(localStorage.getItem(userInfosKey) || "{}");
  infos.telephone = cleanInput;
  localStorage.setItem(userInfosKey, JSON.stringify(infos));

  triggerToast("📞 Téléphone mis à jour !");

  // 🌐 API en tâche de fond
  const encodedJWT = encodeURIComponent(jwt);
  const encodedTel = encodeURIComponent(cleanInput);

const finalURL = getProxyGetURL(
  `route=updateeleve` +
  `&jwt=${encodedJWT}` +
  `&telephone=${encodedTel}`
);


  fetch(finalURL, {
    method: "GET",
    headers: { "X-Requested-With": "XMLHttpRequest" }
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.status !== "error") {
        console.log("📡 Téléphone synchronisé côté serveur !");
      } else {
        console.warn("❌ Erreur API téléphone :", data.message);
      }
    })
    .catch((err) => {
      console.warn("⚠️ Sync téléphone échouée (offline ?)", err);
    })
    .finally(() => {
      isUpdatingPhone = false;
    });
}


async function fetchSessions() {
const email =
  authStore.user?.email ||
  localStorage.getItem("email") ||
  sessionStorage.getItem("email") ||
  "";

  if (!email) {
    console.warn("❌ fetchSessions : email introuvable");
    return;
  }

const proxyURL = getProxyGetURL(
  `route=get_sessions&email=${encodeURIComponent(email)}`
);


  try {
    const res = await fetch(proxyURL);
    const data = await res.json();

    if (data.sessions) {
      sessions.value = data.sessions;
      console.log("📡 Sessions reçues :", data.sessions);
    } else {
      console.warn("⚠️ Aucune session retournée :", data);
    }
  } catch (err) {
    console.error("❌ fetchSessions error:", err);
  } finally {
    isLoadingSessions.value = false;
  }
}






async function updateObjectifOnServer(prenomLocal, jwt, objectifValue) {
  // 🧠 1. Mise à jour immédiate du localStorage
  const userInfosKey = `userInfos_${prenomLocal}`;
const email = authStore.user?.email
           || localStorage.getItem("email")
           || sessionStorage.getItem("email")
           || "";


const userDataKey = `userData_${email}`;


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
 const url = getProxyGetURL(
  `route=updateeleve` +
  `&jwt=${encodedJWT}` +
  `&objectif=${encodedObjectif}`
);


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

 const proxyURL = getProxyGetURL(
  `route=revoke_all_sessions&email=${encodeURIComponent(email)}`
);

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

  // 1️⃣ Si rien n’a changé → on sort
  if (newObjectif === objectif.value) {
    isEditing.value = false;
    savedAnimation.value = false;
    return;
  }

  const prenomLocal = localStorage.getItem("prenom") || "";
  const emailLocal = localStorage.getItem("email") || "";
  const jwt = localStorage.getItem("jwt") || sessionStorage.getItem("jwt") || "";

  // 2️⃣ 🔥 MISE À JOUR INSTANTANÉE DES CACHES (avant tout !)
  {
    const infosKey = `userInfos_${prenomLocal}`;
    const infosCache = JSON.parse(localStorage.getItem(infosKey) || "{}");
    infosCache.objectif = newObjectif;
    localStorage.setItem(infosKey, JSON.stringify(infosCache));

    const dataKey = `userData_${emailLocal}`;
    const dataCache = JSON.parse(localStorage.getItem(dataKey) || "{}");
    dataCache.objectif = newObjectif;
    localStorage.setItem(dataKey, JSON.stringify(dataCache));
  }

  console.log("⚡ Objectif MAJ instantanément dans localStorage:", newObjectif);

  // 3️⃣ Mise à jour UI immédiate
authStore.user.objectif = newObjectif;
  editableObjectif.value = newObjectif;

  isEditing.value = false;
  savedAnimation.value = true;
  triggerToast("🎯 Objectif mis à jour !");

  // 4️⃣ Signal global pour dashboard & autres composants
  window.dispatchEvent(new CustomEvent("userDataUpdated", {
    detail: { prenom: prenomLocal }
  }));

  // 5️⃣ API en tâche de fond (sans bloquer l'utilisateur)
  updateObjectifOnServer(prenomLocal, jwt, newObjectif)
    .then(() => console.log("📡 Objectif synchro serveur OK"))
    .catch(() => console.warn("⚠️ Sync serveur échouée (offline ?)"));

  // 6️⃣ Fin animation
  setTimeout(() => (savedAnimation.value = false), 1000);
}



// moncompte.vue


onMounted(async () => {
const email = authStore.user?.email
           || localStorage.getItem("email")
           || sessionStorage.getItem("email")
           || "";

const prenom = authStore.user?.prenom || localStorage.getItem("prenom") || "";

console.log("📡 authStore.email =", authStore.user?.email);
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

// 👇 AJOUTER CES 2 LIGNES
if (data.objectif) {
  authStore.user.objectif = data.objectif;
  editableObjectif.value = data.objectif;
}

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

 const proxyURL = getProxyGetURL(
  `route=getelevebyemail&email=${encodeURIComponent(email)}`
);

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
  const email = authStore.user?.email
              || localStorage.getItem("email")
              || sessionStorage.getItem("email")
              || "";

  const prenom = authStore.user?.prenom
               || localStorage.getItem("prenom")
               || "";

  if (!email || !prenom) {
    console.warn("⚠️ safeSyncUserData annulé : email ou prénom manquant");
    return;
  }

  const userDataKey = `userData_${email}`;
  const userInfosKey = `userInfos_${prenom}`;

  const cachedUserData = JSON.parse(localStorage.getItem(userDataKey) || "{}");
  const cachedInfos    = JSON.parse(localStorage.getItem(userInfosKey) || "{}");

  // 🧠 priorité à userInfos pour l’objectif
  if (cachedInfos.objectif) {
    cachedUserData.objectif = cachedInfos.objectif;
  }

  // ✅ Mise à jour uniquement si différence
  if (JSON.stringify(userData.value) !== JSON.stringify(cachedUserData)) {
    userData.value = { ...cachedUserData };
    console.log("✅ userData synchronisé proprement.");
  }

  // ✅ MAJ affichage
  editableObjectif.value = cachedUserData.objectif || "🎯 Aucun objectif défini";

  if (cachedUserData.fin_acces) {
    formattedFinAcces.value = formatDateFR(cachedUserData.fin_acces);
  }

  isRecurrent.value = (cachedUserData.recurrent || "").toLowerCase() === "oui";

  // ✅ DERNIÈRE LIGNE SEULEMENT
  await nextTick();
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

/* =========================
   🎵 SBS PREMIUM — MON COMPTE
   ========================= */

/* 🎭 Avatar */
.avatar-placeholder {
  position: relative;
  display: inline-block;
}

.avatar-uploading {
  opacity: 0.45;
  pointer-events: none;
  filter: blur(1px);
  transition: all 0.3s ease;
}

.avatar-label {
  cursor: pointer;
  position: relative;
  display: inline-block;
}

.avatar-image {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 14px;
  border: 2px solid rgba(255,255,255,0.15);
  background: #0f1115;
}

.avatar-placeholder i {
  font-size: 120px;
  color: #6b7280;
}

/* ✏️ Icône édition */
.avatar-edit-icon {
  position: absolute;
  top: 6px;
  right: 6px;
  background: linear-gradient(135deg,#fb923c,#f97316);
  color: #0b0c0f;
  border-radius: 50%;
  font-size: 0.85rem;
  padding: 6px;
  line-height: 1;
  box-shadow: 0 4px 12px rgba(249,115,22,0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.avatar-label:hover .avatar-edit-icon {
  transform: scale(1.15);
  box-shadow: 0 6px 18px rgba(249,115,22,0.55);
}

/* =========================
   📄 Page / Cards
   ========================= */

.account-page {
  color: #e5e7eb;
  background: linear-gradient(160deg,#0b0c0f,#12141a);
  padding: 28px 16px;
  border-radius: 16px;
}

.account-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  backdrop-filter: blur(10px);
  padding: 18px;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  min-height: 100%;
}

.account-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.45);
}

.account-card h5 {
  color: #fff;
  font-weight: 600;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  padding-bottom: 6px;
  margin-bottom: 12px;
}

.account-card li {
  padding: 6px 0;
  font-size: 0.95rem;
}

/* =========================
   🧩 Grille
   ========================= */

.cards-grid {
  display: grid;
  gap: 1rem;
}

@media (min-width: 768px) {
  .cards-grid {
    grid-template-columns: repeat(2,1fr);
  }
}

/* =========================
   🎨 Typo / liens
   ========================= */

h2 {
  font-size: 1.9rem;
  color: #fb923c;
}

a,
.link-edit-password {
  color: #fb923c;
  text-decoration: none;
  font-weight: 500;
}

a:hover,
.link-edit-password:hover {
  font-weight: 700;
}

.text-muted {
  color: #9ca3af !important;
}

.text-success {
  color: #fb923c !important;
}

.text-danger {
  color: #ef4444 !important;
}

/* =========================
   🚪 Bouton logout
   ========================= */

.logout-account-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 22px;
  background: linear-gradient(135deg,#ef4444,#991b1b);
  color: #fff;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(239,68,68,0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.logout-account-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(239,68,68,0.5);
}

/* =========================
   🪟 Modales
   ========================= */

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background: rgba(18,18,18,0.8);
  border: 1px solid rgba(255,255,255,0.12);
  backdrop-filter: blur(14px);
  color: #fff;
  padding: 26px 24px;
  border-radius: 22px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.7);
  animation: fadeInScale 0.25s ease;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  font-size: 1.6rem;
  color: #fb923c;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.close-btn:hover {
  transform: rotate(90deg) scale(1.15);
}

/* Inputs */
.modal-content input[type="text"] {
  width: 100%;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.15);
  padding: 10px 14px;
  color: #fff;
  font-size: 0.95rem;
  border-radius: 12px;
  outline: none;
  transition: all 0.25s ease;
  margin-top: 8px;
}

.modal-content input[type="text"]:focus {
  background: rgba(255,255,255,0.1);
  border-color: #fb923c;
  box-shadow: 0 0 0 2px rgba(251,146,60,0.35);
}

/* =========================
   🔔 Toast / loaders
   ========================= */

.toast-feedback {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(251,146,60,0.75);
  color: #0b0c0f;
  padding: 8px 18px;
  border-radius: 999px;
  font-size: 0.85rem;
  box-shadow: 0 6px 18px rgba(0,0,0,0.4);
  z-index: 9999;
  animation: slideIn 1.4s forwards ease-in-out;
}

.skeleton-item {
  height: 16px;
  background: rgba(255,255,255,0.07);
  border-radius: 999px;
  animation: pulseSkeleton 1.5s infinite;
}

/* =========================
   🔄 Animations
   ========================= */

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes fadeInScale {
  from { opacity:0; transform:scale(0.9) translateY(20px); }
  to   { opacity:1; transform:scale(1) translateY(0); }
}

@keyframes slideIn {
  0% { opacity:0; transform:translateX(-50%) translateY(20px); }
  50% { opacity:1; transform:translateX(-50%) translateY(0); }
  100% { opacity:0; transform:translateX(-50%) translateY(-10px); }
}

@keyframes pulseSkeleton {
  0%,100% { background: rgba(255,255,255,0.05); }
  50% { background: rgba(255,255,255,0.1); }
}

/* =========================
   🔗 Liens compte
   ========================= */

.account-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  margin-top: 12px;
  background: #0b0c0f;
  border-radius: 16px;
  color: #e5e7eb;
}

.account-link:hover {
  background: #111318;
}

.account-link .label {
  font-size: 0.95rem;
}

.account-link .arrow {
  color: #fb923c;
  font-size: 1rem;
}

.account-action {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.account-action:hover {
  opacity: 0.85;
  transform: translateX(2px);
}

/* ========================= */

/* =====================
   VALIDATION
   ===================== */
.is-invalid {
  border-color: #ef4444 !important;
  background: #120708;
  box-shadow: 0 0 0 2px rgba(239,68,68,0.25);
}

/* =====================
   MODALE
   ===================== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-card {
  background: #0b0b0c;
  width: 100%;
  max-width: 520px;
  border-radius: 16px;
  border: 1px solid #1f1f22;
  box-shadow: 0 25px 60px rgba(0,0,0,0.6);
}

/* =====================
   LIEN EDIT
   ===================== */
.edit-link {
  cursor: pointer;
  text-decoration: none;
  color: #9ca3af;
  font-size: 12px;
  transition: color .15s ease, opacity .15s ease;
}

.edit-link:hover {
  color: #f3f4f6;
  opacity: 1;
  text-decoration: underline;
}


</style>
