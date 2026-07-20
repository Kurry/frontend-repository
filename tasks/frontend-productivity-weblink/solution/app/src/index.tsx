import { render } from "solid-js/web";
import App from "./App";
import { installWebmcp } from "./webmcp";
import { pauseAllActiveTransfers } from "./store";
import "./global.css";

installWebmcp();

const flushTransfers = () => pauseAllActiveTransfers();
window.addEventListener("pagehide", flushTransfers);
window.addEventListener("beforeunload", flushTransfers);

const root = document.getElementById("root");
render(() => <App />, root!);
