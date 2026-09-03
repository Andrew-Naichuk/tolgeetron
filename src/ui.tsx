import { createRoot } from "react-dom/client";
import { App } from "./ui/App";

const container = document.getElementById("root");
if (!container) throw new Error("Missing #root element");
createRoot(container).render(<App />);
