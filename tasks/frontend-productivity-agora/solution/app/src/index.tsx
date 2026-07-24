import { render } from "solid-js/web";
import App from "./App";
import "./index.css";
import { initWebMcp } from "./webmcp";

render(() => <App />, document.getElementById("root")!);

initWebMcp();
