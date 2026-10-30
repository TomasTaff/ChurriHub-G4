// Tema claro / oscuro / automático (sigue al sistema). Se guarda por navegador.
import { html } from "htm/preact";
import { useState } from "preact/hooks";

const KEY = "churrihub:tema";
export const leerTema = () => { try { return localStorage.getItem(KEY) || "auto"; } catch (e) { return "auto"; } };

export function aplicarTema(tema) {
  const root = document.documentElement;
  if (tema === "auto") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", tema);
  const oscuro = tema === "dark" || (tema === "auto" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", oscuro ? "#140C09" : "#FFF8F2");
}

const ICONOS = {
  light: "M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66 1.41-1.41M4.93 19.07l1.41-1.41m0-11.32L4.93 4.93m14.14 14.14-1.41-1.41M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z",
  dark: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
  auto: "M3 5h18v11H3zM8 20h8M12 16v4",
};
const NOMBRES = { light: "Modo claro", dark: "Modo oscuro", auto: "Automático (según el dispositivo)" };

export function SelectorTema() {
  const [tema, setTema] = useState(leerTema);
  const elegir = t => { setTema(t); try { localStorage.setItem(KEY, t); } catch (e) { } aplicarTema(t); };
  return html`<div class="tema" role="group" aria-label="Tema de colores">${["light", "dark", "auto"].map(t => html`
    <button type="button" aria-pressed=${tema === t} title=${NOMBRES[t]} aria-label=${NOMBRES[t]} onClick=${() => elegir(t)}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d=${ICONOS[t]} /></svg>
    </button>`)}</div>`;
}
