import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Preload fonts to avoid FOUT (Flash of Unstyled Text)
document.fonts.ready.then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
