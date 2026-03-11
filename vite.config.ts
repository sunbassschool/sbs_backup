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
base: "/",

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
  globPatterns: [
    "**/*.{js,css,html,svg,png,woff2}"
  ],
  globIgnores: [
    "**/bg-masterclass.png"
  ]
},



        includeAssets: ["favicon.ico", "robots.txt"],

manifest: {
  name: "SunBassSchool",
  short_name: "SunBass",
  description: "Une école de musique pour bassistes",
  theme_color: "#000000",
  background_color: "#000000",
  start_url: "/",
  scope: "/",
  display: "standalone",
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
        cssCodeSplit: true,   // 🔥 AJOUTE ÇA

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
