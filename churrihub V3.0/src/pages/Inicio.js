// Inicio (RF-10): pantalla informativa y de presentación, sin datos ni métricas.
// Los accesos directos se filtran por rol (RF-11).
import { html } from "htm/preact";
import { MODULOS, PAGINAS, Icon } from "../lib/permisos.js";
import { Suc } from "../components/ui.js";

export function Inicio({ d, rol }) {
  const permitidas = PAGINAS.filter(p => p.mod && p.roles.includes(rol.rol));
  const mods = MODULOS.map(m => ({ ...m, paginas: permitidas.filter(p => p.mod === m.id) })).filter(m => m.paginas.length);
  return html`
    <section class="hero">
      <img src="logo-tuchurrito.png" alt="Logo de Tuchurrito" width="132" height="118" />
      <div>
        <h2>ChurriHub</h2>
        <div class="tag">Gestión de sucursales de Tu Churrito</div>
        <p>Plataforma que centraliza en un solo lugar la información operativa y de ventas de todas las sucursales: ventas, caja, stock, compras a proveedores y reportes para la gerencia. Reemplaza la consolidación manual de fin de semana por datos unificados y disponibles para todo el equipo.</p>
      </div>
    </section>

    ${rol.rol === "Sin asignar" ? html`<div class="banner">Tu usuario todavía no tiene un rol asignado. Pedile a un gerente que te dé de alta en Usuarios.</div>` : html`
    <div>
      <h3 style="font-size:17px;margin-bottom:10px">Tus módulos</h3>
      <div class="mods">${mods.map(m => html`<div class="card mod">
        <span class="ic"><${Icon} n=${m.icon} /></span>
        <div style="min-width:0"><b>${m.label}</b><div class="small muted">${m.desc}</div>
          <div class="links">${m.paginas.map(p => html`<a href=${"#" + p.id}>${p.label} →</a>`)}</div></div>
      </div>`)}</div>
    </div>`}

    <div class="grid g2">
      <div class="card"><div class="hd"><h3>Áreas que administra</h3></div><div class="bd">
        <ul style="margin:0;padding-left:18px;display:grid;gap:4px">${MODULOS.map(m => html`<li><b style="font-weight:600">${m.label}:</b> <span class="muted">${m.desc}</span></li>`)}</ul>
      </div></div>
      <div class="card"><div class="hd"><h3>Sucursales</h3><span class="note">${d.sucOrden.length} locales</span></div><div class="bd" style="display:grid;gap:14px">
        ${d.sucOrden.map(s => html`<div style="display:grid;gap:4px"><${Suc} s=${s} /><dl class="dl"><dt>Dirección</dt><dd>${s.direccion || "—"}</dd><dt>Teléfono</dt><dd>${s.telefono || "—"}</dd></dl></div>`)}
      </div></div>
    </div>`;
}
