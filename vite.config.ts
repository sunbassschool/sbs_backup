import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  const envWithWindow = Object.keys(env).reduce((acc, key) => {
    acc[`window.${key}`] = JSON.stringify(env[key]);
    return acc;
  }, {} as Record<string, any>);

  return {
    base: env.VITE_BASE_URL || "/",

 define: {
  __APP_ENV__: `"${mode}"`,
  ...envWithWindow,
  __BUILDSTAMP__: JSON.stringify(Date.now()),
},


    plugins: [
      vue(),

      // 🎯 MODE CUSTOM SERVICE WORKER
   VitePWA({
  registerType: "autoUpdate",
  strategies: "injectManifest",
  srcDir: "src",
  filename: "sw-custom.js",

  injectManifest: {
    globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
  },

  includeAssets: ["favicon.ico", "robots.txt"],

  manifest: {
    name: "SunBassSchool",
    short_name: "SunBass",
    description: "Une école de musique pour bassistes",
    theme_color: "#1a1a2e",
    background_color: "#1a1a2e",
    icons: [
      {
        src: `/logo-192x192.png`,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: `/logo-512x512.png`,
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
})
,
    ],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },

    server: {
      strictPort: true,
    },

    build: {
      target: "esnext",
      minify: "terser",
      terserOptions: {
        compress: { drop_console: true },
      },
    },

    assetsInclude: ["**/*.PNG", "**/*.png", "**/*.JPG", "**/*.jpg"],
  };
});
