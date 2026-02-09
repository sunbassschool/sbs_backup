// AuthDBManager.ts
import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "AuthDB";
const DB_VERSION = 1;
const STORE_NAME = "authStore";

let db: IDBPDatabase | null = null;
let openingPromise: Promise<IDBPDatabase> | null = null;

// ======================================================
// 🔐 OPEN DB (SAFE + NON BLOQUANT)
// ======================================================
async function openSafeDB(): Promise<IDBPDatabase> {
  if (db) return db;

  if (!openingPromise) {
    openingPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: "key" });
        }
      },
    })
      .then((database) => {
        db = database;
        openingPromise = null;
        return database;
      })
      .catch((e) => {
        openingPromise = null;
        throw e;
      });
  }

  return openingPromise;
}

// ======================================================
// 🧹 RESET DB
// ======================================================
let pendingWrite = Promise.resolve();

export async function resetDB() {
  pendingWrite = Promise.resolve();

  if (db) {
    try {
      db.close();
    } catch {}
    db = null;
  }

  await new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);

    req.onsuccess = () => {
      console.log("🧹 IndexedDB supprimée");
      resolve(null);
    };

    req.onerror = (e) => {
      console.error("❌ Erreur suppression IndexedDB", e);
      reject(e);
    };

    req.onblocked = () => {
      console.warn("⚠️ Suppression bloquée (autre onglet ?)");
      reject(new Error("DB deletion blocked"));
    };
  });

  await new Promise((res) => setTimeout(res, 100));
}

// ======================================================
// 💾 WRITE KV (QUEUE)
// ======================================================
async function writeKV(key: string, value: any) {
  pendingWrite = pendingWrite.then(async () => {
    const database = await openSafeDB();

    try {
      const tx = database.transaction(STORE_NAME, "readwrite");
      await tx.objectStore(STORE_NAME).put({ key, value });
      await tx.done;
    } catch (err: any) {
      console.error(`❌ writeKV '${key}'`, err);

      if (err?.name === "InvalidStateError") {
        console.warn("⚠️ DB instable → reset + retry");
        await resetDB();
        const retryDB = await openSafeDB();
        const tx = retryDB.transaction(STORE_NAME, "readwrite");
        await tx.objectStore(STORE_NAME).put({ key, value });
        await tx.done;
      } else {
        throw err;
      }
    }
  });

  return pendingWrite;
}

// ======================================================
// 📖 READ KV
// ======================================================
export async function readKV(key: string): Promise<any> {
  try {
    const database = await openSafeDB();
    const tx = database.transaction(STORE_NAME, "readonly");
    const result = await tx.objectStore(STORE_NAME).get(key);
    return result?.value ?? null;
  } catch (err) {
    console.error(`❌ readKV '${key}'`, err);
    return null;
  }
}

// ======================================================
// 🚀 SAVE SESSION DATA
// ======================================================
export async function saveSessionData({
  jwt,
  refreshToken,
  sessionId,
  userData,
}: {
  jwt: string
  refreshToken: string
  sessionId: string
  userData?: { prenom: string; email: string }
}) {
  console.time("SS TOTAL")

  if (!jwt || !refreshToken || !sessionId) {
    throw new Error("Missing session data")
  }

  const database = await openSafeDB()

  console.time("SS TX")
  const tx = database.transaction(STORE_NAME, "readwrite")
  const store = tx.objectStore(STORE_NAME)

  const existing = await store.get("sessionId")

  if (!existing || existing.value === sessionId) {
    store.put({ key: "sessionId", value: sessionId })
  }

  store.put({ key: "jwt", value: jwt })
  store.put({ key: "refreshToken", value: refreshToken })

  if (userData) {
    store.put({ key: "prenom", value: userData.prenom })
    store.put({ key: "email", value: userData.email })
  }

  await tx.done
  console.timeEnd("SS TX")
  console.timeEnd("SS TOTAL")
}


// ======================================================
// 🔎 GET SESSION ID
// ======================================================
export async function getSessionIdFromDB() {
  return (await readKV("sessionId")) || null;
}
