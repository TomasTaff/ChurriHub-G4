import { html } from "htm/preact";
import { useState, useEffect, useMemo } from "preact/hooks";
import { useStore, cerrarSesion } from "./data/store.js";
import { Login, CambioObligatorio, CambiarClave } from "./pages/Login.js";
import { hoy, sumarDias, rangoPeriodo, fFecha } from "./lib/util.js";
import { derivar, esCritico } from "./lib/derivados.js";
import { rolEfectivo, PAGINAS, MODULOS, ICONS, Icon } from "./lib/permisos.js";
import { Toasts, Confirm, Suc } from "./components/ui.js";
import { SelectorTema } from "./lib/tema.js";
import { Inicio } from "./pages/Inicio.js";
import { Ventas } from "./pages/Ventas.js";
import { Carga } from "./pages/Carga.js";
import { Caja } from "./pages/Caja.js";
import { Stock } from "./pages/Stock.js";
import { Compras } from "./pages/Compras.js";
import { Proveedores } from "./pages/Proveedores.js";
import { Reportes } from "./pages/Reportes.js";
import { Exportar } from "./pages/Exportar.js";
import { Catalogo } from "./pages/Catalogo.js";
import { Usuarios } from "./pages/Usuarios.js";
import { Semanal } from "./pages/Semanal.js";
import { Analytics } from "./pages/Analytics.js";

const PAGINA_COMPONENTE = { inicio: Inicio, ventas: Ventas, carga: Carga, caja: Caja, stock: Stock, compras: Compras, proveedores: Proveedores, reportes: Reportes, exportar: Exportar, catalogo: Catalogo, usuarios: Usuarios, semanal: Semanal, analytics: Analytics };

export function App() {
  const st = useStore();
  const [ruta, setRuta] = useState(() => (location.hash || "#inicio").slice(1));
  const [periodo, setPeriodo] = useState("mes");
  const [custom, setCustom] = useState({ desde: sumarDias(hoy(), -30), hasta: hoy() });
  const [sucSel, setSucSel] = useState("todas");
  const [menu, setMenu] = useState(false);
  const [prefill, setPrefill] = useState(null);
  const [cambiarClave, setCambiarClave] = useState(false);
  useEffect(() => { const f = () => { setRuta((location.hash || "#inicio").slice(1)); setMenu(false); }; addEventListener("hashchange", f); return () => removeEventListener("hashchange", f); }, []);
  const d = useMemo(() => derivar(st.data), [st.ver]);
  if (st.estado === "cargando") return html`<div class="loading"><div><div class="spin"></div>Cargando ChurriHub…</div></div>`;

  // Sin sesión: pantalla de ingreso. Con contraseña temporal: elegir una nueva antes de seguir.
  const yo = st.data.usuarios.find(u => u.id === st.me.id);
  if (!yo) return html`<${Login} st=${st} /><${Toasts} />`;
  if (yo.debe_cambiar) return html`<${CambioObligatorio} usuario=${yo} /><${Toasts} />`;

  const rol = rolEfectivo(st);
  const esG = rol.rol === "Gerente";
  const sucursalFija = esG ? null : rol.sucursal_id;
  const sucursalId = esG ? (sucSel === "todas" ? null : sucSel) : sucursalFija;
  const visibles = PAGINAS.filter(p => p.roles.includes(rol.rol));
  const pagina = visibles.find(p => p.id === ruta) || visibles[0];
  const rango = rangoPeriodo(periodo, custom);
  const ir = id => { location.hash = id; };
  const criticos = st.data.stock.filter(s => esCritico(s) && (!sucursalId || s.sucursal_id === sucursalId)).length;
  const ctx = { st, d, rol, esG, sucursalId, sucursalFija, rango, periodo, ir, prefill, setPrefill, sucursalSel: sucursalId ? d.suc[sucursalId] : null };
  const conPeriodo = ["ventas", "reportes", "exportar"].includes(pagina.id);
  const conSucursal = !["inicio", "usuarios", "catalogo", "analytics"].includes(pagina.id);
  const P = PAGINA_COMPONENTE[pagina.id];
  let grp = null;
  return html`<div class="shell">
    <aside class=${"side" + (menu ? " open" : "")} aria-label="Navegación">
      <div class="brand"><img class="logo" src="logo-tuchurrito.png" alt="Tuchurrito" width="42" height="37" /><div><b>ChurriHub</b><small>Tu Churrito</small></div></div>
      <nav class="nav">${visibles.map(p => {
        const g = p.mod !== grp ? (grp = p.mod) : null;
        return html`${g && html`<div class="grp">${MODULOS.find(m => m.id === g)?.label}</div>`}<a href=${"#" + p.id} class=${p.id === pagina.id ? "on" : ""} aria-current=${p.id === pagina.id ? "page" : null}><${Icon} n=${p.icon} />${p.label}${p.id === "stock" && criticos > 0 && html`<span class="badge">${criticos}</span>`}</a>`;
      })}</nav>
      <div class="who">
        <div class="who-u">
          <span class="avatar" aria-hidden="true">${(yo.nombre || "?").split(/\s+/).map(p => p[0]).slice(0, 2).join("").toUpperCase()}</span>
          <div class="who-info"><b>${yo.nombre}</b><span>${rol.rol}${rol.sucursal_id ? " · " + (d.suc[rol.sucursal_id]?.nombre || "") : ""}</span><small>${yo.email}</small></div>
        </div>
        <div class="who-acc">
          <button type="button" onClick=${() => setCambiarClave(true)}>Cambiar contraseña</button>
          <button type="button" id="cerrar-sesion" onClick=${cerrarSesion}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11" /></svg>Cerrar sesión</button>
        </div>
      </div>
    </aside>
    <div class=${"scrim" + (menu ? " open" : "")} onClick=${() => setMenu(false)}></div>
    <div class="main">
      <header class="top">
        <button class="burger" onClick=${() => setMenu(true)} aria-label="Abrir menú"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d=${ICONS.menu} /></svg></button>
        <div class="grow"><h1>${pagina.label}</h1><div class="sub">${conPeriodo ? rango.label + " · " : ""}${conSucursal ? (sucursalId ? d.suc[sucursalId]?.nombre : "Todas las sucursales") : "Tu Churrito"}</div></div>
        <div class="filters">
          ${conPeriodo && html`<div class="seg" role="group" aria-label="Período">${[["hoy", "Hoy"], ["semana", "7 días"], ["mes", "Mes"], ["anio", "Año"], ["custom", "Rango"]].map(([v, l]) => html`<button class=${periodo === v ? "on" : ""} onClick=${() => setPeriodo(v)}>${l}</button>`)}</div>
            ${periodo === "custom" && html`<input class="in" style="width:auto" type="date" aria-label="Desde" value=${custom.desde} max=${custom.hasta} onChange=${e => setCustom({ ...custom, desde: e.target.value })} /><input class="in" style="width:auto" type="date" aria-label="Hasta" value=${custom.hasta} min=${custom.desde} onChange=${e => setCustom({ ...custom, hasta: e.target.value })} />`}`}
          ${!conSucursal ? null : esG ? html`<select class="in" style="width:auto" aria-label="Sucursal" value=${sucSel} onChange=${e => setSucSel(e.target.value)}><option value="todas">Todas las sucursales</option>${d.sucOrden.map(s => html`<option value=${s.id}>${s.nombre}</option>`)}</select>` : (sucursalFija && html`<${Suc} s=${d.suc[sucursalFija]} />`)}
        </div>
        <${SelectorTema} />
      </header>
      <main class="content">
        ${st.errores.length > 0 && html`<div class="banner bad">${st.errores[0]}</div>`}
        ${!esG && !sucursalFija && rol.rol !== "Sin asignar" && html`<div class="banner">Este usuario no tiene una sucursal asignada. Un gerente puede asignársela en Usuarios.</div>`}
        <${P} ...${ctx} />
      </main>
    </div>
    ${cambiarClave && html`<${CambiarClave} usuario=${yo} onClose=${() => setCambiarClave(false)} />`}
    <${Toasts} /><${Confirm} />
  </div>`;
}
