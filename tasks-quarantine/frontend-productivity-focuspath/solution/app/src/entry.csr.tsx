import { render } from "@builder.io/qwik";
import { App } from "./components/App";
import "./global.css";
import "./scripts/webmcp";

const rootEl = document.getElementById("app");
if (!rootEl) throw new Error("Missing #app mount element");

render(rootEl, <App />);
