// Reporte gerencial semanal (RF-04). Se arma solo a partir de los datos cargados:
// no hay que consolidar nada a mano. Por defecto muestra la última semana completa (lunes a domingo).
import { html } from "htm/preact";
import { useState } from "preact/hooks";
import { ars, nf, fFecha, hoy, sumarDias, lunesDe, DIAS, parseF, nowIso } from "../lib/util.js";
import { metricas, pct, topProductos, esCritico, nombreItem, unidadItem } from "../lib/derivados.js";
import { Suc, Delta, Empty } from "../components/ui.js";
import { descargar, aCsv } from "../lib/archivos.js";

export function Semanal({ st, d, sucursalId }) {
  const ultimaCompleta = sumarDias(lunesDe(hoy()), -7);
  const [lunes, setLunes] = useState(ultimaCompleta);
  const domingo = sumarDias(lunes, 6);
  const semanas = Array.from({ length: 12 }, (_, i) => sumarDias(lunesDe(hoy()), -7 * i));
  const sucs = sucursalId ? [d.suc[sucursalId]] : d.sucOrden;
  const enSuc = x => !sucursalId || x.sucursal_id === sucursalId;
  const ven = d.ventas.filter(v => v.f >= lunes && v.f <= domingo && enSuc(v));
  const prev = d.ventas.filter(v => v.f >= sumarDias(lunes, -7) && v.f <= sumarDias(lunes, -1) && enSuc(v));
  const m = metricas(ven), mp = metricas(prev);
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
  const cierres = st.data.cierres.filter(x => x.fecha >= lunes && x.fecha <= domingo && enSuc(x));
  const compras = st.data.compras.filter(x => x.fecha >= lunes && x.fecha <= domingo && enSuc(x) && x.estado !== "cancelada");
  const criticos = st.data.stock.filter(s => esCritico(s) && enSuc(s));
  const top = topProductos(ven, 5, "q");
  const enCurso = lunes === lunesDe(hoy());

  const csv = () => {
    const filas = [];
    sucs.forEach(s => dias.forEach(f => { const v = ven.filter(x => x.sucursal_id === s.id && x.f === f); const mm = metricas(v); filas.push({ semana: `${lunes} a ${domingo}`, sucursal: s.nombre, fecha: f, ventas: Math.round(mm.total), transacciones: mm.transacciones, unidades: mm.unidades }); }));
    descargar(`reporte_semanal_${lunes}.csv`, aCsv(filas), "text/csv;charset=utf-8");
  };

  return html`
    <div class="card no-print"><div class="bd row between">
      <label class="f" for="sem-sel" style="min-width:240px">Semana
        <select id="sem-sel" class="in" value=${lunes} onChange=${e => setLunes(e.target.value)}>${semanas.map(l => html`<option value=${l}>${fFecha(l)} – ${fFecha(sumarDias(l, 6))}${l === lunesDe(hoy()) ? " (en curso)" : ""}</option>`)}</select></label>
      <div class="row"><button class="btn sec" onClick=${csv}>Descargar CSV</button><button class="btn" onClick=${() => window.print()}>Imprimir o guardar PDF</button></div>
    </div></div>

    <div class="card"><div class="bd" style="display:grid;gap:16px">
      <div class="row between" style="align-items:flex-start">
        <div><h2 style="font-size:22px">Reporte semanal de ventas</h2><div class="muted">${fFecha(lunes)} al ${fFecha(domingo)} · ${sucursalId ? d.suc[sucursalId]?.nombre : "Todas las sucursales"}</div></div>
        <div class="small muted" style="text-align:right">Generado automáticamente<br />${fFecha(hoy())}</div>
      </div>
      ${enCurso && html`<div class="banner">La semana está en curso: los números van a cambiar hasta el domingo.</div>`}
      ${!ven.length ? html`<${Empty} titulo="No hay ventas cargadas en esta semana">Importá los archivos de ventas de la semana y el reporte se arma solo.<//>` : html`
      <div class="grid g4">
        <div class="kpi" style="padding:0"><div class="l">Ventas</div><div class="v num">${ars(m.total)}</div><div class="s"><${Delta} v=${pct(m.total, mp.total)} /></div></div>
        <div class="kpi" style="padding:0"><div class="l">Transacciones</div><div class="v num">${nf(m.transacciones)}</div><div class="s"><${Delta} v=${pct(m.transacciones, mp.transacciones)} /></div></div>
        <div class="kpi" style="padding:0"><div class="l">Ticket promedio</div><div class="v num">${ars(m.ticket)}</div></div>
        <div class="kpi" style="padding:0"><div class="l">Unidades</div><div class="v num">${nf(m.unidades)}</div></div>
      </div>
      <div class="tablewrap"><table>
        <thead><tr><th>Sucursal</th>${dias.map(f => html`<th class="r">${DIAS[parseF(f).getDay()]} ${parseF(f).getDate()}</th>`)}<th class="r">Semana</th><th class="r">vs anterior</th></tr></thead>
        <tbody>${sucs.map(s => { const vs = ven.filter(x => x.sucursal_id === s.id), tot = metricas(vs).total, totPrev = metricas(prev.filter(x => x.sucursal_id === s.id)).total, p = pct(tot, totPrev); return html`<tr>
          <td><${Suc} s=${s} /></td>${dias.map(f => html`<td class="r num small">${ars(vs.filter(x => x.f === f).reduce((a, x) => a + x.total, 0))}</td>`)}
          <td class="r num"><b>${ars(tot)}</b></td><td class="r small">${p == null ? "—" : html`<span class=${"delta " + (p >= 0 ? "up" : "down")}>${p >= 0 ? "▲" : "▼"} ${Math.abs(p).toFixed(1)}%</span>`}</td></tr>`; })}</tbody>
      </table></div>
      <div class="grid g2">
        <div><h3 style="font-size:15px;margin-bottom:8px">Productos más vendidos</h3><ol style="margin:0;padding-left:20px;display:grid;gap:4px">${top.map(p => html`<li><b style="font-weight:600">${p.nombre}</b> <span class="muted num">· ${nf(p.q)} u. · ${ars(p.total)}</span></li>`)}</ol></div>
        <div><h3 style="font-size:15px;margin-bottom:8px">Cierres de caja</h3>${cierres.length ? html`<div class="small" style="display:grid;gap:3px">${cierres.sort((a, b) => a.fecha.localeCompare(b.fecha)).map(x => html`<div class="row between"><span>${DIAS[parseF(x.fecha).getDay()]} ${fFecha(x.fecha)} · ${d.suc[x.sucursal_id]?.nombre}</span><b class="num">${ars(x.ingresos - x.egresos)}</b></div>`)}</div>` : html`<p class="small muted" style="margin:0">No se registraron cierres esta semana.</p>`}
          <p class="small muted" style="margin:6px 0 0">${cierres.length} de ${dias.length * sucs.length} cierres esperados.</p></div>
      </div>`}
      <div class="grid g2">
        <div><h3 style="font-size:15px;margin-bottom:8px">Compras de la semana</h3>${compras.length ? html`<p class="small" style="margin:0">${compras.length} órdenes por <b class="num">${ars(compras.reduce((a, x) => a + x.total, 0))}</b> · ${compras.filter(x => x.estado === "pendiente").length} pendientes de recibir.</p>` : html`<p class="small muted" style="margin:0">Sin órdenes de compra.</p>`}</div>
        <div><h3 style="font-size:15px;margin-bottom:8px">Stock crítico hoy</h3>${criticos.length ? html`<div class="small">${criticos.map(s => html`<span class="chip">${nombreItem(d, s)} · ${d.suc[s.sucursal_id]?.nombre} · ${nf(s.cantidad)}/${nf(s.stock_minimo)} ${unidadItem(d, s)}</span>`)}</div>` : html`<p class="small muted" style="margin:0">Ningún insumo bajo el mínimo.</p>`}</div>
      </div>
    </div></div>
    <p class="small muted no-print" style="margin:0">Para que este reporte llegue solo por correo cada lunes hace falta el servidor (backend). Mientras tanto se genera al abrir esta pantalla y se puede guardar como PDF.</p>`;
}
