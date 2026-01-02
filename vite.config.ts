import { defineConfig, loadEnv } from "vite"
import vue from "@vitejs/plugin-vue"
import { VitePWA } from "vite-plugin-pwa"
import path from "path"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  const envWithWindow = Object.keys(env).reduce((acc, key) => {
    acc[`window.${key}`] = JSON.stringify(env[key])
    return acc
  }, {} as Record<string, any>)

  return {
    // ===================================================
    // 🌍 BASE URL (SOUS-DOSSIER)
    // ===================================================
base: mode === "production" ? "/app/" : "/",

    define: {
      __APP_ENV__: `"${mode}"`,
      __BUILDSTAMP__: JSON.stringify(Date.now()),
      ...envWithWindow,
    },

    // ===================================================
    // 🔌 PLUGINS
    // ===================================================
    plugins: [
      vue(),

      VitePWA({
        registerType: "autoUpdate",
        strategies: "injectManifest",
        srcDir: "src",
        filename: "sw-custom.js",

        injectManifest: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        },

        includeAssets: ["favicon.ico", "robots.txt"],

        // ⚠️ PAS DE SLASH ICI (important)
        manifest: {
          name: "SunBassSchool",
          short_name: "SunBass",
          description: "Une école de musique pour bassistes",
          theme_color: "#1a1a2e",
          background_color: "#1a1a2e",
         start_url: "/app/",
scope: "/app/",


          icons: [
            {
              src: "logo-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "logo-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        },
      }),
    ],

    // ===================================================
    // 🧭 RESOLVE
    // ===================================================
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },

    // ===================================================
    // 🧪 DEV SERVER
    // ===================================================
    server: {
      strictPort: true,
    },

    // ===================================================
    // 🏗️ BUILD
    // ===================================================
    build: {
      target: "esnext",
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true,
        },
      },
      chunkSizeWarningLimit: 1500, // optionnel
    },

    // ===================================================
    // 🖼️ ASSETS
    // ===================================================
    assetsInclude: ["**/*.PNG", "**/*.png", "**/*.JPG", "**/*.jpg"],
  }
})
