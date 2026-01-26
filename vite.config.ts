import { defineConfig, loadEnv } from "vite"
import vue from "@vitejs/plugin-vue"
import { VitePWA } from "vite-plugin-pwa"
import path from "path"

export default defineConfig(({ mode }) => {
  // 🔑 charge UNIQUEMENT les variables VITE_
  loadEnv(mode, process.cwd(), "VITE_")

  return {
    // ===================================================
    // 🌍 BASE URL
    // ===================================================
    base: mode === "production" ? "/app/" : "/",

    // ===================================================
    // 🌱 ENV
    // ===================================================
    envPrefix: ["VITE_"],

    define: {
      __APP_ENV__: `"${mode}"`,
      __BUILDSTAMP__: JSON.stringify(Date.now()),
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
          globPatterns: ["assets/**/*.{js,css,svg,png,woff2}"],
        },

        includeAssets: ["favicon.ico", "robots.txt"],

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
      chunkSizeWarningLimit: 1500,
    },

    // ===================================================
    // 🖼️ ASSETS
    // ===================================================
    assetsInclude: ["**/*.PNG", "**/*.png", "**/*.JPG", "**/*.jpg"],
  }
})
