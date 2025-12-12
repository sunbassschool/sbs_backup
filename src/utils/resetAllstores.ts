import { pinia } from "@/main.ts";
import type { Store } from "pinia";

export function resetAllStores() {
  console.log("♻️ Reset complet de tous les stores...");

  // 👉 On caste pinia en any pour accéder à _s
  const stores = (pinia as any)._s as Map<string, Store>;

  stores.forEach((store) => {
    if (typeof store.$reset === "function") {
      store.$reset();
    } else {
      console.warn(`⚠️ Store "${store.$id}" n'a pas de méthode $reset`);
    }
  });
}
