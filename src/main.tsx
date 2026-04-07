import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Standard application mount
createRoot(document.getElementById("root")!).render(<App />);
