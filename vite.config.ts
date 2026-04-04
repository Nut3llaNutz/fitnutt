import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: false },
      includeAssets: ["fitnutt-logo.png"],
      manifest: {
        name: "FitNutt — Lean Bulking Tracker",
        short_name: "FitNutt",
        description: "Track macros, meals & supplements for your lean bulk",
        theme_color: "#EA5C1F",
        background_color: "#F5F5F5",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/fitnutt-logo.png", sizes: "192x192", type: "image/png" },
          { src: "/fitnutt-logo.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
