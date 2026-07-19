import { render } from "solid-js/web";
import App from "./App";
import { installWebmcp } from "./webmcp";
import "./global.css";

installWebmcp();

const root = document.getElementById("root");
render(() => <App />, root!);
