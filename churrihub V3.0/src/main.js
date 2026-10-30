import { html, render } from "htm/preact";
import "./styles.css";
import { App } from "./App.js";
import { iniciar } from "./data/store.js";
import { aplicarTema, leerTema } from "./lib/tema.js";

aplicarTema(leerTema());
window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change", () => aplicarTema(leerTema()));

iniciar();
render(html`<${App} />`, document.getElementById("app"));
