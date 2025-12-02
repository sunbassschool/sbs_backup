export async function clearAuthStoreFromIndexedDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("AuthDB");
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("authStore")) return resolve(true);

      const tx = db.transaction(["authStore"], "readwrite");
      const store = tx.objectStore("authStore");

      store.delete("jwt");
      store.delete("refreshToken");
      store.delete("sessionId");

      tx.oncomplete = () => {
        db.close();
        resolve(true);
      };
      tx.onerror = reject;
    };
    req.onerror = reject;
  });
}
