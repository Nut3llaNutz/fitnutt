import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// @ts-ignore
import { registerSW } from "virtual:pwa-register";

// Boot up the Service Worker immediately
registerSW({ immediate: true });

// Standard application mount
createRoot(document.getElementById("root")!).render(<App />);
