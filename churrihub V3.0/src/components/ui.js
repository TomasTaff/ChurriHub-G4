import { html } from "htm/preact";
import { useState, useEffect } from "preact/hooks";
import { ars, fCorta, fFecha, sumarDias, uid } from "../lib/util.js";

let toastSet = null;
function toast(msg, tipo) { toastSet && toastSet(t => [...t, { id: uid(), msg, tipo }]); }
function Toasts() {
  const [t, setT] = useState([]); toastSet = setT;
  useEffect(() => { if (!t.length) return; const h = setTimeout(() => setT(x => x.slice(1)), 3600); return () => clearTimeout(h); }, [t]);
  return html`<div class="toasts" role="status">${t.map(x => html`<div class=${"toast " + (x.tipo || "")} key=${x.id}>${x.msg}</div>`)}</div>`;
}
let confirmSet = null;
const confirmar = (titulo, texto, ok = "Confirmar") => new Promise(res => confirmSet && confirmSet({ titulo, texto, ok, res }));
function Confirm() {
  const [c, setC] = useState(null); confirmSet = setC;
  if (!c) return null;
  const fin = v => { c.res(v); setC(null); };
  return html`<${Modal} titulo=${c.titulo} onClose=${() => fin(false)}>
    <p style="margin:0 0 16px">${c.texto}</p>
    <div class="row" style="justify-content:flex-end"><button class="btn sec" onClick=${() => fin(false)}>Cancelar</button><button class="btn danger" onClick=${() => fin(true)}>${c.ok}</button></div>
  <//>`;
}
function Modal({ titulo, onClose, children, wide }) {
  useEffect(() => { const k = e => e.key === "Escape" && onClose(); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, []);
  return html`<div class="modal-bg" onClick=${e => e.target === e.currentTarget && onClose()}>
    <div class=${"modal" + (wide ? " wide" : "")} role="dialog" aria-modal="true" aria-label=${titulo}>
      <div class="mh"><h3>${titulo}</h3><button class="x" onClick=${onClose} aria-label="Cerrar">×</button></div>
      <div class="mb">${children}</div>
    </div></div>`;
}
// Cada sucursal trae su propio color (RNF-05: sumar sucursales sin tocar el código).
const PALETA_SUC = ["#D9A21B", "#2B7FB8", "#2F8A4E", "#8E5BC8", "#C2412F", "#1F9C9C"];
const colorSuc = s => s?.color || PALETA_SUC[Math.abs([...String(s?.id || "")].reduce((a, c) => a + c.charCodeAt(0), 0)) % PALETA_SUC.length];
const Suc = ({ s }) => s ? html`<span class="suc"><i style=${"background:" + colorSuc(s)}></i>${s.nombre}</span>` : html`<span class="pill warn">Sin sucursal</span>`;
const Empty = ({ titulo, children }) => html`<div class="empty"><b>${titulo}</b>${children}</div>`;
const Kpi = ({ l, v, s }) => html`<div class="card kpi"><div class="l">${l}</div><div class="v num" title=${typeof v === "string" ? v : ""}>${v}</div>${s && html`<div class="s">${s}</div>`}</div>`;
const Delta = ({ v }) => v == null ? html`<span class="muted">sin período previo</span>` : html`<span class=${"delta " + (v >= 0 ? "up" : "down")}>${v >= 0 ? "▲" : "▼"} ${Math.abs(v).toFixed(1)}%</span> <span class="muted">vs período anterior</span>`;
async function guardar(fn, okMsg) {
  try { await fn(); okMsg && toast(okMsg); return true; }
  catch (e) { console.error(e); toast(e?.message && e.code !== "not_found" ? "No se pudo guardar: " + e.message : "No se pudo guardar. Intentá de nuevo.", "bad"); return false; }
}


function LineChart({ desde, hasta, series, alto = 240 }) {
  const [hover, setHover] = useState(null);
  const dias = []; let f = desde, guard = 0; while (f <= hasta && guard++ < 400) { dias.push(f); f = sumarDias(f, 1); }
  const W = 720, H = alto, L = 56, R = 12, T = 12, B = 28;
  const max = Math.max(1, ...series.flatMap(s => dias.map(d => s.valores[d] || 0)));
  const paso = Math.pow(10, Math.floor(Math.log10(max))); const nice = Math.ceil(max / paso) * paso;
  const ticks = [0, .25, .5, .75, 1].map(t => t * nice);
  const x = i => L + (dias.length <= 1 ? (W - L - R) / 2 : i * (W - L - R) / (dias.length - 1));
  const y = v => T + (H - T - B) * (1 - v / nice);
  const etiquetas = Math.max(1, Math.ceil(dias.length / 8));
  const k = v => v >= 1e6 ? (v / 1e6).toFixed(1).replace(".0", "") + "M" : v >= 1e3 ? (+(v / 1e3).toFixed(1)).toLocaleString("es-AR") + "k" : v;
  const mover = e => { const r = e.currentTarget.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width * W; let best = 0, bd = 1e9; dias.forEach((d, i) => { const dd = Math.abs(x(i) - px); if (dd < bd) { bd = dd; best = i; } }); setHover(best); };
  return html`<div class="chart">
    <div class="legend" style="margin-bottom:6px">${series.map(s => html`<span><i style=${"background:" + s.color}></i>${s.nombre}</span>`)}
      ${hover != null && html`<span style="margin-left:auto;color:var(--fg)"><b>${fFecha(dias[hover])}</b>${series.map(s => html` · ${s.nombre}: <b class="num">${ars(s.valores[dias[hover]] || 0)}</b>`)}</span>`}</div>
    <svg viewBox=${`0 0 ${W} ${H}`} role="img" aria-label="Evolución de ventas por día" onMouseMove=${mover} onMouseLeave=${() => setHover(null)}>
      ${ticks.map(t => html`<line x1=${L} x2=${W - R} y1=${y(t)} y2=${y(t)} stroke="var(--line)" stroke-dasharray=${t ? "3 4" : ""} /><text x=${L - 8} y=${y(t) + 4} text-anchor="end">$${k(t)}</text>`)}
      ${dias.map((d, i) => i % etiquetas === 0 && html`<text x=${x(i)} y=${H - 8} text-anchor="middle">${fCorta(d)}</text>`)}
      ${hover != null && html`<line x1=${x(hover)} x2=${x(hover)} y1=${T} y2=${H - B} stroke="var(--line-strong)" />`}
      ${series.map(s => { const pts = dias.map((d, i) => `${x(i)},${y(s.valores[d] || 0)}`).join(" ");
        return html`<polygon points=${`${x(0)},${y(0)} ${pts} ${x(dias.length - 1)},${y(0)}`} fill=${s.color} opacity=".07" /><polyline points=${pts} fill="none" stroke=${s.color} stroke-width="2.2" stroke-linejoin="round" />
        ${hover != null && html`<circle cx=${x(hover)} cy=${y(s.valores[dias[hover]] || 0)} r="4" fill=${s.color} stroke="var(--surface)" stroke-width="2" />`}
        ${dias.length > 0 && html`<circle cx=${x(dias.length - 1)} cy=${y(s.valores[dias[dias.length - 1]] || 0)} r="3" fill=${s.color} />`}`; })}
    </svg></div>`;
}
function seriesPorSucursal(ventas, sucursales) {
  return sucursales.map(s => { const valores = {}; ventas.forEach(v => { if (v.sucursal_id === s.id) valores[v.f] = (valores[v.f] || 0) + v.total; }); return { nombre: s.nombre, color: colorSuc(s), valores }; });
}

export { toast, Toasts, confirmar, Confirm, Modal, Suc, colorSuc, PALETA_SUC, Empty, Kpi, Delta, guardar, LineChart, seriesPorSucursal };
