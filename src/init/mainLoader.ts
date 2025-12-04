// src/init/mainLoader.ts
import { initializeApp } from "/src/main.ts";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const el = await waitForElement("#app");
    console.log("✅ #app trouvé, lancement Vue");
    el.classList.add("app-visible");
    await initializeApp();
  } catch (e) {
    console.error("❌ Erreur mainLoader:", e);
  }
});

function waitForElement(selector: string, timeout = 5000): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    const el = document.querySelector(selector);
    if (el) return resolve(el as HTMLElement);

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el as HTMLElement);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      reject(`⛔ Élément ${selector} introuvable après ${timeout}ms`);
    }, timeout);
  });
}
