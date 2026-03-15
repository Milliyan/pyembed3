import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App            from "./App.jsx";

// ── Stylesheets (order matters) ──────────────
import "./styles/global.css";
import "./styles/nav.css";
import "./styles/hero.css";
import "./styles/sections.css";
import "./styles/compiler.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
