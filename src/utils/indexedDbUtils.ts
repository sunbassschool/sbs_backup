import { openDB, type IDBPDatabase } from "idb";

// 🧠 Instance cache
let dbInstance: IDBPDatabase<any> | null = null;

export async function getAuthDB(): Promise<IDBPDatabase<any>> {
  if (dbInstance) return dbInstance;
  dbInstance = await ensureAuthStoreReady();
  return dbInstance;
}

export async function ensureAuthStoreReady(): Promise<IDBPDatabase<any>> {
  const db = await openDB("AuthDB", 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("authStore")) {
        db.createObjectStore("authStore", { keyPath: "key" });
        console.log("✅ Object store 'authStore' créé !");
      }
    }
  });

  return db;
}
export async function closeAuthDB() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    console.log("🔒 DB fermée manuellement.");
  }
}

export async function resetAuthDB(): Promise<void> {
  try {
    if (dbInstance) {
      console.log("🔒 Fermeture de la DB avant suppression...");
      dbInstance.close(); // 👈 Ferme proprement
      dbInstance = null;  // Ensuite, vide la référence
    }

    await new Promise<void>((resolve, reject) => {
      const req = window.indexedDB.deleteDatabase("AuthDB");

      req.onsuccess = () => {
        console.log("✅ IndexedDB supprimée avec succès !");
        resolve();
      };
      req.onerror = () => {
        console.error("❌ Échec suppression IndexedDB :", req.error);
        reject(req.error);
      };
      req.onblocked = () => {
        alert("❗ La base locale est bloquée. Ferme les autres onglets de l'application.");
        console.warn("⚠️ Suppression DB bloquée — fermer les autres onglets.");
      };
    });
  } catch (err) {
    console.error("❌ Erreur inattendue dans resetAuthDB:", err);
  }
}

export async function waitForAuthDBReady(timeout = 2000, interval = 100): Promise<boolean> {
  const maxTries = timeout / interval;
  for (let i = 0; i < maxTries; i++) {
    try {
      const db = await getAuthDB();
      const tx = db.transaction("authStore", "readonly");
      await tx.done;
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, interval));
    }
  }
  return false;
}
