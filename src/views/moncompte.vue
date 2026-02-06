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
  v-if="avatarSrc"
  :src="avatarSrc"
  :class="['rounded-circle avatar-image', { 'avatar-uploading': isUploadingAvatar }]"
  alt="Avatar"
/>
<!--<pre v-if="auth.user">
{{ JSON.stringify(auth.user, null, 2) }}
</pre> -->


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



<h2 class="fw-bold mb-0">{{ displayPrenom }}</h2>
<p class="text-muted small">{{ displayEmail }}</p>

    <p>
      <span @click="showModal = true" class="editable text-warning" style="cursor: pointer;">
        ✏️ Modifier mes infos
      </span><br />
<a
  v-if="canEditProfProfile"
  class="link-prof-profile"
  style="cursor: pointer;"
  @click="showProfModal = true"
>
   Compléter ma fiche prof
</a>




    </p>
  </div>

<!-- 🧾 Abonnement -->
<div class="account-card flex-fill p-3 shadow-sm rounded h-100">

    <h5 class="fw-semibold mb-2">Statut </h5>

<template v-if="!privilegesResolved">

  <div class="skeleton-wrap">
    <div class="skeleton badge-skel mb-2"></div>
    <div class="skeleton line-skel w-75 mb-1"></div>
    <div class="skeleton line-skel w-50 mb-3"></div>
    <div class="skeleton line-skel w-40 mb-2"></div>
    <div class="skeleton line-skel w-60"></div>
  </div>


</template>

<template v-else-if="hasPrivileges">
  <div class="sub-card">

    <div class="sub-header">
  <span class="sub-status is-premium">
    Accès privilégié
  </span>
</div>


    <div class="sub-main">
    <div class="sub-line">
  <span class="label">Cursus : </span>
  <span class="value">
    {{ userData.cursus || "Non défini" }}
    <span v-if="userData.trimestre"> · {{ userData.trimestre }}</span>
  </span>
</div>

    </div>

  <div class="sub-actions">
  <button class="sub-action" @click="show = true">
    Gérer l’abonnement
  </button>

  <RouterLink to="/mes-achats" class="sub-action sub-action-muted">
    Voir mes achats
  </RouterLink>
</div>


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
  to="/eleve/offres"
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
<div class="account-card p-3 mb-3 shadow-sm rounded goal-box" :class="{ 'shake': isSaving, 'pulse': savedAnimation }">
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


<!-- PAS de skeleton ici -->

 <template v-if="!ressourcesReady">
    <li class="text-muted small">
      Chargement des ressources…
    </li>
  </template>
<!-- 🤷‍♂️ prêt mais vide -->
  <template v-else-if="!hasAnyRessource">
    <li class="text-muted small d-flex flex-column align-items-start">
      <span>🤷‍♂️ Aucune ressource disponible pour le moment.</span>
    </li>
  </template>
<template v-else>
  <li v-if="playlistYoutube">
    ▶️
    <a :href="playlistYoutube" target="_blank">
      Playlist YouTube
    </a>
  </li>

  <li v-if="espaceGoogleDrive">
    📁
    <a :href="espaceGoogleDrive" target="_blank">
      Espace Google Drive
    </a>
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
    <teleport to="body">
  <SubscriptionsModal
    v-if="show"
    @close="show = false"
  />
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
import SubscriptionsModal from "@/components/User/SubscriptionsModal.vue"



import { logoutUser } from "@/utils/api.ts";
import { useAuthStore } from "@/stores/authStore.js";

// === STORES ===

const authStore = useAuthStore();
const auth = useAuthStore()

const isAuthReady = computed(
  () => authStore.authReady && authStore.onboardingReady
)
const ressourcesReady = ref(
  !!localStorage.getItem(`userData_${localStorage.getItem("email")}`)
)



const avatarSrc = computed(() => {
  // 1️⃣ cache en priorité (instantané)
  const email = authStore.user?.email || localStorage.getItem("email")
  if (email) {
    const cached = JSON.parse(
      localStorage.getItem(`userData_${email}`) || "{}"
    )
    if (cached.avatar_url) {
      return getAvatarSrc(cached.avatar_url)
    }
  }

  // 2️⃣ store ensuite
  if (authStore.user?.avatar_url) {
    return getAvatarSrc(authStore.user.avatar_url)
  }

  return ""
})

const canEditProfProfile = computed(() => {
  return authStore.user?.role === "prof" || authStore.user?.role === "admin"
})
const show = ref(false)

const showProfModal = ref(false)
const statusReady = computed(() =>
  authStore.authReady &&
  userDataLoaded &&        // ex: userData !== null
  privilegesChecked       // ex: hasPrivileges !== null
)

const privilegesResolved = computed(() =>
  authStore.privilegesStatus === "active" ||
  authStore.privilegesStatus === "expired"
)
const displayPrenom = computed(() =>
  authStore.user?.prenom ||
  userData.value?.prenom ||
  localStorage.getItem("prenom") ||
  ""
)

const displayEmail = computed(() =>
  authStore.user?.email ||
  userData.value?.email ||
  localStorage.getItem("email") ||
  ""
)

const isPrivilegesPending = computed(
  () => authStore.privilegesStatus === "pending"
)
// === ROUTER ===
const router = useRouter();

// telephone
const telephoneInput = ref(null);


// === OBJECTIF = UNE SEULE SOURCE : LE STORE ===
const objectif = computed(() => {
  // 1️⃣ store = source de vérité
  if (authStore.user?.objectif) {
    return authStore.user.objectif
  }

  // 2️⃣ fallback cache (si store vide)
  const email = authStore.user?.email
  if (email) {
    const cached = JSON.parse(
      localStorage.getItem(`userData_${email}`) || "{}"
    )
    if (cached.objectif) return cached.objectif
  }

  return "🎯 Aucun objectif défini"
})

const playlistYoutube = computed(() => {
  if (authStore.user?.playlist_youtube) {
    return authStore.user.playlist_youtube
  }

  const email = authStore.user?.email
  if (email) {
    const cached = JSON.parse(
      localStorage.getItem(`userData_${email}`) || "{}"
    )
    if (cached.playlist_youtube) return cached.playlist_youtube
  }

  return ""
})

const espaceGoogleDrive = computed(() => {
  if (authStore.user?.espace_google_drive) {
    return authStore.user.espace_google_drive
  }

  const email = authStore.user?.email
  if (email) {
    const cached = JSON.parse(
      localStorage.getItem(`userData_${email}`) || "{}"
    )
    if (cached.espace_google_drive) return cached.espace_google_drive
  }

  return ""
})

const hasAnyRessource = computed(() => {
  return !!(
    playlistYoutube.value ||
    espaceGoogleDrive.value
  )
})

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
    const infos = JSON.parse(infosRaw)

    if (authStore.user) {
      authStore.user = {
        ...authStore.user,
        objectif: infos.objectif || "🎯 Aucun objectif défini"
      }
    }

    editableObjectif.value =
      infos.objectif || "🎯 Aucun objectif défini"

    console.log("⚡ Objectif chargé via userInfos :", editableObjectif.value)

  } catch {
    editableObjectif.value = "🎯 Aucun objectif défini"
  }
}


// 🔥 SECOND SOURCE : userData_<email> (si existant)
if (email) {
  const dataKey = `userData_${email}`
  const dataRaw = localStorage.getItem(dataKey)

  if (dataRaw) {
    try {
      const data = JSON.parse(dataRaw)

      if (data.objectif) {
        // ✅ MAJ STORE SAFE
        authStore.$patch(state => {
          if (state.user) {
            state.user.objectif = data.objectif
          }
        })

        // ✅ MAJ UI
        editableObjectif.value = data.objectif
      }

    } catch {}
  }
}


// 🔥 SYNC STORE → OBJECTIF quand le store finit de charger




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
const isReady = ref(false)


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
const hasPrivileges = computed(() =>
  authStore.privilegesStatus === "active"
)


;
const isPro = computed(() => {
  return auth.user?.plan === "premium" || auth.user?.abo === "pro"
})
;
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
  if (!url || typeof url !== "string") return ""

  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)\//)
  if (match) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`
  }

  return url
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
        patchUserData({
  avatar_url: data.url
})


;






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
function patchUserData(patch) {
  const email =
    authStore.user?.email ||
    localStorage.getItem("email")

  if (!email) return

  const key = `userData_${email}`
  const current = JSON.parse(localStorage.getItem(key) || "{}")

  const updated = { ...current, ...patch }

  localStorage.setItem(key, JSON.stringify(updated))

  // sync UI + store
  userData.value = { ...updated }

  authStore.$patch({
    user: {
      ...authStore.user,
      ...patch
    }
  })
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
  `route=revoke_session&sessionId=${encodeURIComponent(sessionId)}`
)
;

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

patchUserData({
  objectif: newObjectif
})

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
  // 1️⃣ AUTH READY (OBLIGATOIRE)
  if (!authStore.isInitDone) {
    await authStore.initAuth()
  }

  const email =
    authStore.user?.email ||
    localStorage.getItem("email") ||
    sessionStorage.getItem("email")

const cached = JSON.parse(
  localStorage.getItem(`userData_${email}`) || "{}"
)

if (cached.objectif) {
  ressourcesReady.value = true
}

  if (!email) return

  const prenom =
    authStore.user?.prenom ||
    localStorage.getItem("prenom") ||
    ""

  const userDataKey = `userData_${email}`
  const userInfosKey = `userInfos_${prenom}`

  // 2️⃣ TENTATIVE CACHE (PRIORITÉ)
  const cachedRaw = localStorage.getItem(userDataKey)
  if (cachedRaw) {
    const cached = JSON.parse(cachedRaw)

    // hydrate store depuis cache (AVANT RENDER)
    authStore.$patch({
      user: {
        ...authStore.user,
        avatar_url: cached.avatar_url || authStore.user.avatar_url,
        playlist_youtube: cached.playlist_youtube || authStore.user.playlist_youtube,
        espace_google_drive: cached.espace_google_drive || authStore.user.espace_google_drive,
        objectif: cached.objectif || authStore.user.objectif
      }

    })

    // hydrate UI locale
    userData.value = { ...cached }
  ressourcesReady.value = true

    if (cached.fin_acces) {
      formattedFinAcces.value = formatDateFR(cached.fin_acces)
    }

  }

  // 3️⃣ PAS DE CACHE → FETCH BACKEND
  if (!cachedRaw) {
    try {
      const res = await fetch(
        getProxyGetURL(
          `route=getelevebyemail&email=${encodeURIComponent(email)}`
        )
      )

      const data = await res.json()
      if (!data?.email) return

      // hydrate store
      authStore.$patch({
        user: {
          ...authStore.user,
          ...data
        }
      })

      // hydrate UI
      userData.value = { ...data }

      if (data.fin_acces) {
        formattedFinAcces.value = formatDateFR(data.fin_acces)
      }

      // sauvegarde cache
const prev = JSON.parse(localStorage.getItem(userDataKey) || "{}")

localStorage.setItem(
  userDataKey,
  JSON.stringify({ ...prev, ...data })
)
    ressourcesReady.value = true



    } catch (e) {
      console.error("❌ fetch userData failed", e)
          ressourcesReady.value = true // pour ne jamais bloquer

    }
  }

  // 4️⃣ SYNC OBJECTIF (userInfos_<prenom> prioritaire)
  const infosRaw = localStorage.getItem(userInfosKey)
  if (infosRaw) {
    const infos = JSON.parse(infosRaw)
    if (infos.objectif) {
      authStore.$patch(state => {
        if (state.user) state.user.objectif = infos.objectif
      })

      const cached = JSON.parse(
        localStorage.getItem(userDataKey) || "{}"
      )
      cached.objectif = infos.objectif
      localStorage.setItem(userDataKey, JSON.stringify(cached))
      ressourcesReady.value = true

    }
  }

  // 5️⃣ SESSIONS
  fetchSessions()

  // 6️⃣ EVENT GLOBAL (UPDATE OBJECTIF / AVATAR / ETC)
  window.addEventListener("userDataUpdated", (event) => {
    if (event.detail?.prenom !== prenom) return

    const cached = JSON.parse(
      localStorage.getItem(userDataKey) || "{}"
    )

    userData.value = { ...cached }

    authStore.$patch({
      user: {
        ...authStore.user,
        avatar_url: cached.avatar_url || authStore.user.avatar_url,
        playlist_youtube: cached.playlist_youtube || authStore.user.playlist_youtube,
        espace_google_drive: cached.espace_google_drive || authStore.user.espace_google_drive,
        objectif: cached.objectif || authStore.user.objectif
      }
    })

    if (cached.fin_acces) {
      formattedFinAcces.value = formatDateFR(cached.fin_acces)
    }
  })

  await nextTick()
  isReady.value = true
})






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

.skeleton {
background: linear-gradient(
  90deg,
  rgba(255,255,255,0.06) 25%,
  rgba(255,255,255,0.12) 37%,
  rgba(255,255,255,0.06) 63%
);
  background-size: 400% 100%;
  animation: skel 1.4s ease infinite;
  border-radius: 6px;
}
.badge-skel { height: 32px; width: 180px; }
.line-skel { height: 14px; }
.w-75 { width: 75%; }
.w-60 { width: 60%; }
.w-50 { width: 50%; }
.w-40 { width: 40%; }

@keyframes skel {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}
.subs-link {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.15);
  color: #e5e7eb;
  font-size: 0.9rem;
  padding: 8px 14px;
  border-radius: 10px;
  transition: background .15s ease, border-color .15s ease, color .15s ease;
}

.subs-link:hover {
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.25);
  color: #fff;
}

.sub-card {
  margin-top: 10px;
  padding: 14px 0;
  border-top: 1px solid rgba(255,255,255,0.08);
}

.sub-header {
  margin-bottom: 8px;
}

.sub-status {
  font-size: 0.7rem;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: #9ca3af;
}

.sub-main {
  margin-bottom: 12px;
}

.sub-line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.sub-line .label {
  color: #9ca3af;
  white-space: nowrap;
}

.sub-line .value {
  color: #e5e7eb;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}


.sub-actions {
  display: flex;
  gap: 10px;
}

.sub-action {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.15);
  color: #e5e7eb;
  font-size: 0.85rem;
  padding: 6px 14px;
  border-radius: 999px;
  transition: background .15s ease, border-color .15s ease, color .15s ease;
  cursor: pointer;
}

.sub-action:hover {
  background: rgba(255,255,255,0.06);
  border-color: rgba(255,255,255,0.25);
}

.sub-action-muted {
  border-color: rgba(255,255,255,0.08);
  color: #cbd5f5;
}

.sub-action-muted:hover {
  background: rgba(255,255,255,0.04);
  border-color: rgba(255,255,255,0.18);
}


.sub-link {
  font-size: 0.85rem;
  color: #9ca3af;
  text-decoration: none;
  transition: color .15s ease;
}

.sub-link:hover {
  color: #e5e7eb;
}
.sub-status {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.7rem;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.sub-status.is-premium {
  color: #f5d08a;
  background: linear-gradient(
    135deg,
    rgba(245,208,138,0.14),
    rgba(245,208,138,0.04)
  );
  border: 1px solid rgba(245,208,138,0.35);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04);
}

</style>
