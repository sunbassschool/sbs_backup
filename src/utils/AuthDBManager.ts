// AuthDBManager.ts
import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'AuthDB';
const DB_VERSION = 1;
const STORE_NAME = 'authStore';

let db: IDBPDatabase | null = null;
let isOpening = false;

async function openSafeDB(): Promise<IDBPDatabase> {
  if (isOpening) {
    await new Promise((res) => setTimeout(res, 50));
    return openSafeDB();
  }

  // 🔍 Vérifie si l’instance déjà ouverte est encore utilisable
  if (db) {
try {
  const tx = db.transaction("authStore", "readonly");
  await tx.store.get('healthcheck'); // test passif
  return db;
} catch (err) {
  console.warn("⚠️ Ancienne instance DB inutilisable. Réouverture…");
}

  }

  // 🔄 Ouverture normale
  isOpening = true;

  try {
    db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: "key" });
        }
      },
    });

    return db;

  } finally {
    isOpening = false;
  }
}


export async function resetDB() {
  // ⛔ Arrêt des writes pour éviter les réouvertures pendant suppression
  pendingWrite = Promise.resolve();

  if (db) {
    try {
      db.close();
    } catch (e) {
      console.warn("⚠️ Erreur fermeture DB :", e);
    }
    db = null;
  }

  await new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);

    req.onsuccess = () => {
      console.log("🧹 IndexedDB supprimée avec succès");
      resolve(null);
    };

    req.onerror = (event) => {
      console.error("❌ Erreur suppression IndexedDB :", event);
      reject(event);
    };

    req.onblocked = () => {
      console.warn("⚠️ Suppression bloquée par une connexion active. Fermez les autres onglets.");
      reject(new Error("Suppression bloquée par une autre connexion"));
    };
  });

  // 🔒 Sécurité : attente explicite pour éviter que `openSafeDB()` relance une ouverture en arrière-plan
  await new Promise((res) => setTimeout(res, 100));
}




let pendingWrite = Promise.resolve();

async function writeKV(key: string, value: any) {
  // Enchaînement séquentiel : on attend que les writes précédents soient terminés
  pendingWrite = pendingWrite.then(async () => {
    console.log(`💾 [writeKV] Key='${key}' / Value=`, value);

    const database = await openSafeDB();

    try {
      const tx = database.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      await store.put({ key, value });
      await tx.done;

      console.log(`✅ [writeKV] Key '${key}' saved successfully`);

    } catch (err) {
      const e = err as Error & { name?: string };
      console.error(`❌ [writeKV] Error for key '${key}':`, e);

      if (e.name === 'InvalidStateError') {
        console.warn("⚠️ DB instable, reset + retry");

        await resetDB();
        const retryDB = await openSafeDB();

        const tx = retryDB.transaction(STORE_NAME, 'readwrite');
        await tx.objectStore(STORE_NAME).put({ key, value });
        await tx.done;

        console.log(`✅ [writeKV] Retry key '${key}' successful`);

      } else {
        throw e;
      }
    }
  });

  return pendingWrite;
}


export async function readKV(key: string): Promise<any> {
  const database = await openSafeDB();

  try {
    const tx = database.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const result = await store.get(key);
    return result?.value ?? null;
  } catch (err) {
    console.error(`❌ [readKV] Erreur lecture clé '${key}' :`, err);
    return null;
  }
}

let isSaving = false; // 🔐 Verrou global

export async function saveSessionData({
  jwt,
  refreshToken,
  sessionId,
  userData,
}: {
  jwt: string;
  refreshToken: string;
  sessionId: string;
  userData?: { prenom: string; email: string };
}) {
  if (isSaving) {
    console.warn("⏳ Sauvegarde déjà en cours → skip");
    return;
  }

  isSaving = true;
  console.log("🚀 [saveSessionData] Début sauvegarde...");

  try {
    console.warn("⚠️ saveSessionData appelé avec sessionId =", sessionId);
console.trace("📍 Trace sessionId source");
    if (!jwt || !refreshToken || !sessionId) {
      console.warn("⚠️ Données manquantes :", { jwt, refreshToken, sessionId });
      throw new Error("Des données obligatoires sont absentes");
    }

    const existingSessionId = await readKV("sessionId");
    if (existingSessionId && existingSessionId !== sessionId) {
      console.warn("🚨 Tentative d'écrasement de sessionId détectée :", {
        existant: existingSessionId,
        entrant: sessionId,
      });

      // 🛡️ Ne pas écraser si on a déjà une session active différente
      // ou tu peux choisir de forcer si backend a la priorité (selon ta logique)
    } else {
      await writeKV("sessionId", sessionId);
    }

    await writeKV("jwt", jwt);
    await writeKV("refreshToken", refreshToken);

    if (userData) {
      console.log("📄 userData à stocker :", userData);
      await writeKV("prenom", userData.prenom);
      await writeKV("email", userData.email);
    }

    console.log("✅ [saveSessionData] Sauvegarde terminée !");
  } catch (err) {
    console.error("❌ [saveSessionData] ERREUR :", err);
    throw err;
  } finally {
    isSaving = false;
  }
}



export async function getSessionIdFromDB() {
  return (await readKV("sessionId")) || null;
}
