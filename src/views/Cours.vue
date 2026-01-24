<template>

  <Layout><div class="cours-theme">
    <div class="container-xxl mt-4">

      <!-- ✅ Sélecteur de prénom -->
      <div class="mb-3 text-center">
<select v-model="selectedStudent" class="form-select mt-2" id="studentSelect">
  <option value="">Tous les élèves</option>
<option v-for="eleve in elevesInscrits" :key="eleve.email" :value="eleve.prenom">
  {{ eleve.prenom }}
</option>

</select>
<!-- ✅ Sélecteur de semaine -->
<div class="mb-3 text-center">
  <select v-model="selectedWeek" class="form-select mt-2" id="weekSelect">
    <option value="">Toutes les semaines</option>
    <option v-for="week in weeks" :key="week.start" :value="week">
      {{ week.label }}
    </option>
  </select>
</div>
<div v-if="successMessage" class="alert alert-success text-center mt-3">
  {{ successMessage }}
</div>
</div>
      <!-- ✅ Chargement -->
      <div v-if="loading" class="d-flex flex-column align-items-center mt-4">
        <div class="spinner-border text-primary mb-2" role="status"></div>
        <p class="text-muted">Chargement des cours...</p>
      </div>

      <!-- ✅ Message si aucun cours trouvé -->
      <div v-if="!loading && filteredCours.length === 0" class="alert alert-warning text-center mt-3">
        <p>Aucun cours trouvé.</p>
      </div>
<!-- ✅ Bouton pour activer/désactiver le filtre -->
<div class="mb-3 d-flex align-items-center gap-2">
 <!--
  <input
    type="checkbox"
    id="filterUpcoming"
    v-model="filterUpcoming"
    class="form-check-input"
  />
 <label for="filterUpcoming" class="form-check-label">
    Afficher uniquement les cours à venir 📅
  </label>

  !-->
</div>

<div class="d-flex justify-content-center align-items-center gap-2 mt-2">
  <button class="btn btn-outline-light" @click="goToPreviousWeek">⬅</button>
<div class="d-flex justify-content-center mt-2">
  <button class="btn btn-primary" @click="selectNextWeekFromNow">📅 Prochaine semaine </button>
</div>
  <button class="btn btn-outline-light" @click="goToNextWeek">➡️</button>
</div>


      <!-- ✅ Tableau des cours -->
      <div v-if="!loading && filteredCours.length > 0" class="table-responsive mt-3">
<div v-if="!loading && filteredCours.length > 0" class="table-responsive mt-3">
  <table class="table table-hover shadow-sm">
    <thead class="table-dark">
      <tr>
        <th scope="col">📆 Date & Heure</th>
        <th scope="col">🎸 Élève</th>
        <th scope="col">🔗 Lien visio</th>
        <th scope="col">📝 Commentaires</th>

        <th scope="col">👀 Présence</th>
      </tr>
    </thead>
    <tbody>
      <tr
  v-for="(cours, index) in filteredCours"
  :key="index"
  @click="openEditModal(cours)"
  class="clickable-row"
  :class="{
    'past-course': isPastCourse(cours), // ✅ Ajoute la classe past-course si le cours est passé
    'future-course': !isPastCourse(cours), // ✅ Sinon, future-course
    'selected-row': editedCours && editedCours.AncienneDate === cours['Date et heure'] // ✅ Surbrillance sur cours sélectionné
  }"
>



        <!-- ✅ Format compact de la date -->
        <td><strong>{{ formatCompactDate(cours['Date et heure']) }}</strong></td>

        <!-- ✅ Prénom de l'élève -->
        <td>{{ cours.Prénom }}</td>

        <!-- ✅ Lien Google Meet avec icône cliquable -->
        <td>
          <a :href="cours['Lien Google Meet']" target="_blank" class="btn btn-primary btn-sm">
            📎 Ouvrir
          </a>
        </td>

        <!-- ✅ Commentaires -->
        <td>{{ cours.Commentaires || "Aucun commentaire" }}</td>

        <!-- ✅ Synthèse -->


        <!-- ✅ Case à cocher pour la présence -->
<td>
  <input
  type="checkbox"
  :checked="Boolean(cours.Présence)"
  @change.prevent="updatePresence(cours, $event.target.checked)"
  @click.stop
/>

</td>


      </tr>
    </tbody>
  </table>
</div>



      </div>
    </div></div>
  </Layout>
<!-- 🟣 PREMIUM PROF – MODAL MODIFICATION COURS -->
<EditCoursModal
  v-model="editModalOpen"
  :cours="editedCours"
  :loading="updating"
  @save="(c) => { editedCours = c; updateCours() }"
/>




</template>

<script>
import Layout from "../views/Layout.vue";
import axios from "axios";
import { getProxyPostURL, getProxyGetURL } from "@/config/gas"
import EditCoursModal from "@/components/admin/EditCoursModal.vue"

import { ref, computed, onMounted, watch } from "vue";
import { useRouter,useRoute  } from "vue-router";
import { getValidToken } from "@/utils/api.ts"; // 🔐 Import sécurisé
import { useAuthStore } from "@/stores/authStore.js";
import { useCoursStore } from "@/stores/coursStore"


export default {
  name: "Cours",
  components: { Layout,EditCoursModal  },
  setup() {
    const route = useRoute();

    const authStore = useAuthStore();
const profId = computed(() => authStore.user?.prof_id);
    const filterUpcoming = ref(false);
    const elevesInscrits = ref([]);
const selectNextWeekFromNow = () => {
  const now = new Date();
  const nextWeek = weeks.value.find(week => week.start > now);
  if (nextWeek) {
    selectedWeek.value = nextWeek;
  }
};
const coursStore = useCoursStore()
const TTL = 15 * 60 * 1000 // 15 min

    const router = useRouter();
    const coursData = ref([]);
    const loading = ref(true);
    const deleting = ref(false);
    const updating = ref(false);
    const selectedStudent = ref("");
    const editModalOpen = ref(false);
    const editedCours = ref({});
    const selectedWeek = ref(""); // Stocke la semaine sélectionnée
    const successMessage = ref("");
    const isPastCourse = (cours) => {
  if (!cours || !cours["Date et heure"]) return false;
  const courseDate = new Date(cours["Date et heure"]);
  return courseDate.getTime() < Date.now(); // ✅ Compare avec le timestamp actuel
};
const fetchElevesInscrits = async () => {
  try {
const jwt = authStore.jwt
if (!jwt) return
const proxyUrl = getProxyPostURL()

const res = await fetch(proxyUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    route: "getelevesbyprof",
    jwt,
    prof_id: profId.value
  })
})


    const text = await res.text()
    console.log("📥 RAW RESPONSE :", text)

    const json = JSON.parse(text)
    console.log("📥 PARSED JSON :", json)

    if (json?.success && Array.isArray(json.eleves)) {
      elevesInscrits.value = json.eleves.filter(
        e => e && e.statut === "inscrit"
      )
    } else {
      console.warn("⚠️ Format inattendu getElevesByProf :", json)
    }
  } catch (e) {
    console.error("❌ fetchElevesInscrits:", e)
  }
}

;
const CACHE_KEY = "cours_cache"


const loadFromStore = () => {
  const raw = localStorage.getItem(CACHE_KEY)
  if (!raw) return false

  try {
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > TTL) return false

    coursData.value = data
    return true
  } catch {
    return false
  }
}

const saveToStore = () => {
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      data: coursData.value,
      ts: Date.now()
    })
  )
}

;
const goToPreviousWeek = () => {
  if (!selectedWeek.value || weeks.value.length === 0) return;

  const currentIndex = weeks.value.findIndex(
    week => week.start.getTime() === selectedWeek.value.start.getTime()
  );

  if (currentIndex > 0) {
    selectedWeek.value = weeks.value[currentIndex - 1];
  }
};

const goToNextWeek = () => {
  if (!selectedWeek.value || weeks.value.length === 0) return;

  const currentIndex = weeks.value.findIndex(
    week => week.start.getTime() === selectedWeek.value.start.getTime()
  );

  if (currentIndex !== -1 && currentIndex < weeks.value.length - 1) {
    selectedWeek.value = weeks.value[currentIndex + 1];
  }
};



    const showSuccessMessage = (message) => {
      successMessage.value = message;
      setTimeout(() => {
        successMessage.value = "";
      }, 4000);
    };

    const API_URL =
      "https://cors-proxy-37yu.onrender.com/https://script.google.com/macros/s/AKfycbxvaZgqAbC8icJJTtJ9cETcet2dWu8FVJre9yKgmyJpSqPhFmdgKOT5yWnFxPmVbk4D_w/exec";

    // ✅ Vérifie si l'utilisateur est connecté
    const isLoggedIn = computed(() => !!localStorage.getItem("jwt"));
    if (!isLoggedIn.value) {
      router.replace("/login");
    }

    // ✅ Récupérer les cours depuis Google Sheets
const fetchCours = async (noCache = false) => {
  try {
    const jwt = authStore.jwt
    if (!profId.value) throw new Error("prof_id manquant")

  const proxyUrl = getProxyGetURL(
  `route=suiviCours` +
  `&prof_id=${encodeURIComponent(profId.value)}` +
  `&jwt=${encodeURIComponent(jwt)}` +
  (noCache ? `&t=${Date.now()}` : "")
)

const response = await axios.get(proxyUrl)


    console.log("📥 RAW RESPONSE (cours) :", response.data)

    coursData.value = Array.isArray(response.data)
      ? response.data
      : Object.values(response.data || {})

    console.log("📊 coursData length :", coursData.value.length)

    saveToStore()
  } catch (e) {
    console.error("❌ fetchCours:", e)
  }
}
;




    // ✅ Liste unique des prénoms
    const uniqueStudents = computed(() => {
      if (!coursData.value || coursData.value.length === 0) return [];
      const students = new Set(
        coursData.value
          .map((cours) => cours.Prénom?.trim())
          .filter(Boolean) // Supprime les valeurs vides
      );
      return Array.from(students).sort();
    });

    // ✅ Générer les semaines disponibles
    const weeks = computed(() => {
  const uniqueWeeks = new Map(); // Utilisation de Map pour éviter les doublons

  coursData.value.forEach((cours) => {
    if (cours["Date et heure"]) {
      const date = new Date(cours["Date et heure"]);
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Lundi de la semaine
      startOfWeek.setHours(0, 0, 0, 0); // Réinitialise l'heure pour éviter les différences

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Dimanche de la semaine
      endOfWeek.setHours(23, 59, 59, 999); // Fin de journée pour éviter les erreurs de comparaison

      const key = `${startOfWeek.toISOString()}_${endOfWeek.toISOString()}`; // Clé unique

      if (!uniqueWeeks.has(key)) {
        uniqueWeeks.set(key, {
          start: startOfWeek,
          end: endOfWeek,
          label: `Semaine du ${startOfWeek.getDate()} ${startOfWeek.toLocaleString("fr", { month: "long" })}`
        });
      }
    }
  });

  // ✅ Retourne les semaines triées par date de début
  return Array.from(uniqueWeeks.values()).sort((a, b) => a.start - b.start);
});

const selectClosestWeek = () => {
  if (weeks.value.length === 0) return;

  const now = new Date();

  // ✅ Trouver la première semaine qui contient AU MOINS un cours futur
  let closestWeek = weeks.value.find(week => {
    return coursData.value.some(cours => {
      const courseDate = new Date(cours["Date et heure"]);
      return courseDate >= now && courseDate >= week.start && courseDate <= week.end;
    });
  });

  // ✅ Si aucune semaine avec un cours futur n’est trouvée, prendre la première semaine future
  if (!closestWeek) {
    closestWeek = weeks.value.find(week => now < week.start);
  }

  // ✅ Appliquer la semaine trouvée
  if (closestWeek) {
    selectedWeek.value = closestWeek;
  }
};


    // ✅ Filtrage des cours par élève, semaine et cours à venir
    const filteredCours = computed(() => {
  let filtered = [...coursData.value];

  if (selectedStudent.value) {
const normalize = (s = "") =>
  s
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

filtered = filtered.filter(
  (cours) =>
    normalize(cours.Prénom) === normalize(selectedStudent.value)
);

  }

  if (filterUpcoming.value) {
    const now = new Date();
    filtered = filtered.filter((cours) => {
      const courseDate = new Date(cours["Date et heure"]);
      return courseDate > now;
    });
  }

  if (selectedWeek.value) {
    filtered = filtered.filter((cours) => {
      const courseDate = new Date(cours["Date et heure"]);
      return (
        courseDate >= new Date(selectedWeek.value.start) &&
        courseDate <= new Date(selectedWeek.value.end)
      );
    });
  }

  // ✅ Trier par date et heure dans l'ordre chronologique
filtered.sort((a, b) => {
  const da = new Date(a["Date et heure"]);
  const db = new Date(b["Date et heure"]);

  // ✅ Toutes les semaines → plus récent → plus ancien
  if (!selectedWeek.value) {
    return db - da;
  }

  // ✅ Semaine sélectionnée → chronologique
  return da - db;
});


  return filtered;
});


    // ✅ Supprimer les cours d'un élève
    const supprimerCours = async () => {
  if (!selectedStudent.value) {
    alert("❌ Sélectionnez un élève !");
    return;
  }

  const confirmation = confirm(`Voulez-vous vraiment supprimer tous les cours de ${selectedStudent.value} ?`);
  if (!confirmation) return;

  deleting.value = true;
  try {
    const jwt = authStore.jwt;

    // ✅ Construction de l'URL via le proxy
   const proxyUrl = getProxyPostURL()

const response = await fetch(proxyUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    route: "supprimerCoursEleve",
    jwt,
    prenom: selectedStudent.value
  })
})


    const result = await response.json();

    if (result.status === "success") {
      showSuccessMessage(`✅ Les cours de ${selectedStudent.value} ont été supprimés avec succès !`);
      await fetchCours(true);
    } else {
      alert(`❌ Erreur : ${result.message}`);
    }
  } catch (error) {
    console.error("❌ Erreur de suppression :", error);
    alert("❌ Une erreur est survenue.");
  } finally {
    deleting.value = false;
  }
};



    // ✅ Ouvrir la modale d'édition
    const openEditModal = (cours) => {
editedCours.value = {
  ...cours,
  Présence: cours["Présence"] === true
};

  // ✅ Sauvegarde la date d'origine pour que l'API puisse retrouver le cours
  editedCours.value.AncienneDate = cours["Date et heure"];

  // ✅ Vérifie et reformate la date pour l'input datetime-local
  if (editedCours.value["Date et heure"]) {
    const dateObj = new Date(editedCours.value["Date et heure"]);

    if (!isNaN(dateObj.getTime())) {
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      const hours = String(dateObj.getHours()).padStart(2, "0");
      const minutes = String(dateObj.getMinutes()).padStart(2, "0");

      editedCours.value["Date et heure"] = `${year}-${month}-${day}T${hours}:${minutes}`;
    } else {
      console.error("❌ Date invalide :", editedCours.value["Date et heure"]);
      editedCours.value["Date et heure"] = "";
    }
  }

  editModalOpen.value = true;
};

const updatePresence = async (cours, isPresent) => {
  // patch local immédiat (UX instant)
  cours.Présence = isPresent === true

  editedCours.value = {
    ...cours,
    Présence: cours.Présence,
    AncienneDate: cours["Date et heure"]
  }

  await updateCours()
}
;

    // ✅ Fermer la modale d'édition
    const closeEditModal = () => {
      editModalOpen.value = false;
      editedCours.value = {};
    };

    // ✅ Met à jour un cours
const updateCours = async (noCache = false, jwtOverride = null) => {
  if (!editedCours.value.Prénom || !editedCours.value["Date et heure"]) {
    alert("❌ Tous les champs doivent être remplis !");
    return;
  }

  updating.value = true;
  try {
const jwt = authStore.jwt
if (!jwt) return
const proxyUrl = getProxyPostURL()

const response = await fetch(proxyUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    route: "updateCours",
    jwt,
    cours: {
      ...editedCours.value,
      AncienneDate: editedCours.value.AncienneDate
    }
  })
})


    const result = await response.json();

    if (result.status === "success") {
      showSuccessMessage("✅ Cours mis à jour avec succès !");
  editModalOpen.value = false   // 👈 fermer tout de suite
// patch local optimiste
const idx = coursData.value.findIndex(
  c => c["Date et heure"] === editedCours.value.AncienneDate
)
if (idx !== -1) {
  coursData.value[idx] = {
    ...coursData.value[idx],
    ...editedCours.value
  }
}
     // refresh en background
  editedCours.value = {};
      closeEditModal();
    } else {
      alert("❌ Erreur : " + result.message);
    }
 } catch (error) {
  console.error("❌ Erreur de mise à jour :", error);

  // 👉 Ignore l'erreur si le cours a été mis à jour malgré tout
  if (!error || (error.response && error.response.status === 200)) {
    return;
  }

  alert("❌ Une erreur est survenue.");
} finally {
    updating.value = false;
  }
};




    // ✅ Format compact de la date
    const formatCompactDate = (isoDate) => {
      if (!isoDate) return "Date invalide";
      const dateObj = new Date(isoDate);
      if (isNaN(dateObj.getTime())) return "Date invalide";

      return `${dateObj.getDate().toString().padStart(2, "0")}/${(dateObj.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${dateObj.getFullYear()} à ${dateObj.getHours()
        .toString()
        .padStart(2, "0")}H${dateObj.getMinutes().toString().padStart(2, "0")}`;
    };

onMounted(async () => {
  const eleveFromQuery = route.query.eleve;
  const fromCreatePlanning =
    typeof eleveFromQuery === "string" && eleveFromQuery.length;

  if (fromCreatePlanning) {
    selectedStudent.value = eleveFromQuery;
    selectedWeek.value = ""; // 👉 toutes les semaines
  }

  try {
    await getValidToken()
  } catch {
    router.replace("/login")
    return
  }

  // cache immédiat
  const hasCache = loadFromStore()
  loading.value = !hasCache

  // ⚠️ NE PAS auto-sélectionner une semaine si on vient du wizard
  if (!fromCreatePlanning) {
    selectClosestWeek()
  }

  fetchElevesInscrits()
  fetchCours(true).finally(() => {
    loading.value = false

    if (!fromCreatePlanning) {
      selectClosestWeek()
    }
  })
});


;

//==================================================
//==================================================
// ------------------WATCHERS-----------------------
//==================================================
//==================================================

watch(editModalOpen, v => {
  console.log("🟣 MODAL OPEN =", v)
})
;
watch(selectedStudent, () => {
  selectedWeek.value = "" // reset semaine
})
;
    return {
      coursData, loading, deleting, updating, selectedStudent, filterUpcoming, filteredCours,
      supprimerCours, openEditModal, closeEditModal, updateCours, editModalOpen,goToPreviousWeek,selectNextWeekFromNow
,

      editedCours, formatCompactDate, uniqueStudents, selectedWeek, weeks, successMessage,elevesInscrits ,goToNextWeek, isPastCourse,  updatePresence

    };
  },
};
</script>

<style scoped>
.cours-theme {
  /* ===== SURFACES ===== */
  --surface-page: #000000;
  --surface-panel: #000000;
  --surface-glass: rgba(0, 0, 0, 0.95);
  --surface-hover: #f3f4f6;

 --bg-panel: var(--surface-glass);
  --bg-glass: var(--surface-glass);
  --bg-hover: var(--surface-hover);


  /*=== input ==== */
  --input-bg: var(--surface-hover);

  /* ===== TEXT ===== */
  --text-main: #ff5100;
  --text-strong: #0f172a;
  --text-muted: #ff5100;

  /* ===== BRAND ===== */
  --brand-accent: #292929;
  --brand-accent-strong: #303030;

  /* ===== BORDERS ===== */
  --border-soft: #e5e7eb;
  --border-focus: var(--brand-accent);

  /* ===== INPUT TOKENS ===== */
  --input-surface: var(--surface-panel);
  --input-text: var(--text-main);
  --input-border: var(--border-soft);
  --input-placeholder: var(--text-muted);

  /* ===== RADIUS / SHADOW ===== */
  --radius-md: 12px;
  --shadow-panel: 0 24px 70px rgba(0,0,0,0.18);
}

/* état normal (idle) */
select,
input,
textarea {
  background-color: var(--input-bg);
  color: var(--input-text);
}



/* options du dropdown */


/* option "Tous / vide" */
select option[value=""] {
  color: var(--input-placeholder);
}

/* ==================================================
   PANEL LIGHT
   ================================================== */

.container-xxl {
  background: var(--bg-panel);
  color: var(--text-main);
  border-radius: var(--radius-xl);
  padding: 28px;
  box-shadow: var(--shadow-panel);
}

/* neutralise bootstrap dark */
.container-xxl .text-white {
  color: var(--text-main) !important;
}

.container-xxl .table-dark {
  background: transparent !important;
  color: var(--text-main) !important;
}

/* ==================================================
   TITRES / LABELS
   ================================================== */

.container-xxl h2 {
  color: var(--text-strong);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.container-xxl label,
.container-xxl .form-check-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
}

/* ==================================================
   INPUTS / SELECTS / TEXTAREA
   ================================================== */

.form-select,
.form-control,
textarea {
  border-radius: var(--radius-md);
  border: 1px solid var(--border-soft);
  transition: all 0.25s ease;
}

.form-select:hover,
.form-control:hover,
textarea:hover {
  border-color: var(--border-focus);
}

.form-select:focus,
.form-control:focus,
textarea:focus {
  outline: none;
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(250,204,21,0.25);
}

/* select minimal */
.container-xxl select.form-select {
  appearance: none;
  padding: 6px 36px 6px 14px;
  height: 36px;
  font-size: 0.85rem;
  font-weight: 500;

  background-image:
    linear-gradient(45deg, transparent 50%, var(--text-muted) 50%),
    linear-gradient(135deg, var(--text-muted) 50%, transparent 50%);
  background-position:
    calc(100% - 18px) 52%,
    calc(100% - 12px) 52%;
  background-size: 6px 6px;
  background-repeat: no-repeat;
}

/* ==================================================
   CHECKBOX
   ================================================== */

.container-xxl input[type="checkbox"],
.container-xxl .form-check-input {
  width: 14px;
  height: 14px;
  accent-color: var(--brand-accent);
  cursor: pointer;
}

/* ==================================================
   FILTER BAR
   ================================================== */

.filter-container {
  background: var(--bg-soft);
  border-radius: var(--radius-lg);
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: inset 0 0 0 1px var(--border-soft);
}

/* ==================================================
   TABLE → CARD LIST
   ================================================== */

.table-responsive {
  max-height: calc(100vh - 260px);
  overflow-y: auto;
}

.table {
  border-collapse: separate;
  border-spacing: 0 14px;
}



.table tbody tr {
  background: var(--bg-panel);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
  transition: all 0.25s ease;
}

.table tbody tr:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
  cursor: pointer;
}

.table td {
  padding: 14px 16px;
  border: none;
  white-space: nowrap;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-main);
}

.table td:first-child {
  font-weight: 600;
  color: var(--text-strong);
}

.table td:nth-child(2) {
  font-weight: 700;
}

/* ==================================================
   STATES
   ================================================== */

.past-course {
  background: var(--danger-bg) !important;
}

.past-course td:first-child {
  border-left: 5px solid var(--danger-border);
}

.future-course {
  background: var(--success-bg) !important;
}

.future-course td:first-child {
  border-left: 5px solid var(--success-border);
}

/* ==================================================
   SELECTED ROW
   ================================================== */
.selected-row {
  outline: none;
}

.selected-row td:first-child {
  box-shadow: inset 4px 0 0 var(--brand-accent);
}



/* ==================================================
   BUTTONS
   ================================================== */

.btn {
  font-weight: 600;
  border-radius: var(--radius-md);
  transition: all 0.25s ease;
}

.btn-primary {
  background: linear-gradient(
    135deg,
    var(--brand-accent),
    var(--brand-accent-strong)
  );
  border: none;
  color: var(--text-main);
  padding: 6px 16px;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(250,204,21,0.45);
}

.btn-danger {
  border-radius: var(--radius-md);
}

/* week navigation */
.container-xxl .btn-outline-light {
  width: 38px;
  height: 32px;
  padding: 0;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-soft);
  background: var(--bg-panel);

  display: inline-flex;
  align-items: center;
  justify-content: center;

  font-size: 0;
}

.container-xxl .btn-outline-light::before {
  content: "←";
  font-size: 16px;
  color: var(--text-main);
}

.container-xxl .btn-outline-light:last-child::before {
  content: "→";
}

.container-xxl .btn-outline-light:hover {
  background: var(--bg-hover);
}

.container-xxl .btn-primary {
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
  background-clip: padding-box;
}





/* ==================================================
   ALERTS / LOADER
   ================================================== */

.alert {
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-soft);
  border: none;
}

.spinner-border {
  width: 2.2rem;
  height: 2.2rem;
}

/* ==================================================
   MOBILE
   ================================================== */

@media (max-width: 768px) {
  .container-xxl {
    padding: 16px;
  }

  .table td {
    padding: 12px;
    font-size: 0.85rem;
  }


}
.container-xxl select.form-select {
  text-align: center;
  text-align-last: center; /* 🔑 pour l’option sélectionnée */
}

/* ==================================================
   RESPONSIVE — GARDER 3 COLONNES (MOBILE)
   ================================================== */
@media (max-width: 768px) {

  /* cache colonnes 4, 5, 6 */
  .table th:nth-child(4),
  .table td:nth-child(4),
  .table th:nth-child(5),
  .table td:nth-child(5),
  .table th:nth-child(6),
  .table td:nth-child(6) {
    display: none;
  }

  /* optimise l’espace */
  .table td {
    max-width: none;
    white-space: normal;
    font-size: 0.85rem;
  }

  /* bouton "ouvrir" plus compact */
  .table .btn-sm {
    padding: 4px 10px;
    font-size: 0.75rem;
  }
}

.sbs-modal-dialog {
  margin-left: auto;
  margin-right: auto;
}
select:disabled {
  background-color: #e5e7eb !important;
  color: #475569 !important;
  border-color: #cbd5e1 !important;
}
.container-xxl select.form-select:disabled {
  background-color: #e5e7eb !important;
  color: #64748b !important;
  border-color: #cbd5e1 !important;
  opacity: 1 !important;
  cursor: not-allowed;
}
.container-xxl select.form-select:disabled option {
  color: #94a3b8 !important;
}

.container-xxl select.form-select:disabled,
.container-xxl select.form-select:disabled:hover,
.container-xxl select.form-select:disabled:focus {
  background-color: #e5e7eb !important;
  color: #64748b !important;
  border-color: #cbd5e1 !important;
  box-shadow: none !important;
  outline: none !important;
}

</style>
