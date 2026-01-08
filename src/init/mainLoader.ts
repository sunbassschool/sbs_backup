// src/init/mainLoader.ts
import { initializeApp } from "../main.ts";

let appStarted = false;

(async function bootstrap() {
  try {
    const app = await waitForElement("#app", 3000);

    if (appStarted) return;
    appStarted = true;

    app.classList.add("app-visible");

    await initializeApp(); // ✅ UNE SEULE FOIS

  } catch (e) {
    console.error("❌ Erreur mainLoader:", e);
  }
})();

function waitForElement(selector: string, timeout = 3000): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    const start = performance.now();

    const check = () => {
      const el = document.querySelector(selector);
      if (el) return resolve(el as HTMLElement);
      if (performance.now() - start > timeout)
        return reject(`⛔ ${selector} introuvable`);
      requestAnimationFrame(check);
    };

    check();
  });
}
