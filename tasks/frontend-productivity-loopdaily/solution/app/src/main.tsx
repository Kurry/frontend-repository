import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "jotai";
import App from "./App";
import { jotaiStore } from "./store";
import { initWebMcp } from "./webmcp";
import "./index.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("No root element found");

createRoot(rootEl).render(
  <StrictMode>
    <Provider store={jotaiStore}>
      <App />
    </Provider>
  </StrictMode>
);

initWebMcp();
