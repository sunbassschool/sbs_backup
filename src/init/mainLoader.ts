// src/init/mainLoader.ts
import { initializeApp } from "../main.ts";

let appStarted = false;

requestAnimationFrame(() => {
  requestAnimationFrame(async () => {
    if (appStarted) return;
    appStarted = true;

    const app = document.getElementById("app");
    if (!app) return;

    app.classList.add("app-visible");

    // 🚀 init APRES paint réel
    await initializeApp();
  });
});
