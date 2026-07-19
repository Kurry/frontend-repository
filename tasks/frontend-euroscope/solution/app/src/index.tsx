/* @refresh reload */
import { render } from "solid-js/web";

import "./index.css";
import App from "./App";
import { installWebmcp } from "./webmcp";

const root = document.getElementById("root");

render(() => <App />, root!);

// Expose the WebMCP action surface on window (contract zto-webmcp-v1).
installWebmcp();
