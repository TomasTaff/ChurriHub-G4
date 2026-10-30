// Reportes gerenciales: RF-05 (métricas por canal, producto, sucursal y comparativa entre períodos),
// RF-27 (indicadores generales), RF-28 (evolución), RF-29 (Wilde vs Miramar) y RF-30 (rankings).
import { html } from "htm/preact";
import { useState } from "preact/hooks";
import { DIAS, ars, fFecha, nf, parseF, rangoAnterior, CANALES, MEDIOS } from "../lib/util.js";
import { metricas, pct, topProductos, agrupar } from "../lib/derivados.js";
import { Delta, Empty, Kpi, LineChart, Suc, colorSuc, seriesPorSucursal } from "../components/ui.js";

const Barras = ({ filas, total, etiqueta = k => k }) => html`<div style="display:grid;gap:8px">${filas.map(([k, v]) => html`<div>
  <div class="row between small"><span>${etiqueta(k)}</span><b class="num">${ars(v)} <span class="muted">· ${total ? (v / total * 100).toFixed(0) : 0}%</span></b></div>
  <div class="bar" style="margin-top:3px"><i style=${`width:${total ? v / total * 100 : 0}%`}></i></div></div>`)}</div>`;

export function Reportes(c) {
  const { d, sucursalId, rango } = c;
  const [rankPor, setRankPor] = useState("q");
  const enSuc = v => !sucursalId || v.sucursal_id === sucursalId;
  const ven = d.ventas.filter(v => v.f >= rango.desde && v.f <= rango.hasta && enSuc(v));
  const ant = rangoAnterior(rango);
  const prev = d.ventas.filter(v => v.f >= ant.desde && v.f <= ant.hasta && enSuc(v));
  const m = metricas(ven), mp = metricas(prev);
  const top = topProductos(ven, 1, "q")[0];
  const sucs = sucursalId ? [d.suc[sucursalId]] : d.sucOrden;
  const comp = d.sucOrden.map(s => { const v = d.ventas.filter(x => x.f >= rango.desde && x.f <= rango.hasta && x.sucursal_id === s.id); return { s, ...metricas(v), top: topProductos(v, 1, "q")[0] }; });
  const rank = topProductos(ven, 10, rankPor === "q" ? "q" : "total"); const maxR = rank[0]?.[rankPor === "q" ? "q" : "total"] || 1;
  const dows = Array(7).fill(0).map(() => ({ t: 0, n: new Set() }));
  ven.forEach(v => { const k = parseF(v.f).getDay(); dows[k].t += v.total; dows[k].n.add(v.f + v.sucursal_id); });
  const dowProm = [1, 2, 3, 4, 5, 6, 0].map(k => [DIAS[k], dows[k].n.size ? dows[k].t / dows[k].n.size : 0]); const maxD = Math.max(1, ...dowProm.map(x => x[1]));
  const lider = !sucursalId && comp.length >= 2 ? [...comp].sort((a, b) => b.total - a.total) : null;

  if (!ven.length) return html`<div class="card"><${Empty} titulo="Sin ventas en el período">Elegí otro período desde la barra superior.${d.ventas[0] ? ` La última venta registrada es del ${fFecha(d.ventas[0].f)}.` : ""}<//></div>`;
  return html`
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(150px,100%),1fr))">
      <${Kpi} l="Ventas totales" v=${ars(m.total)} s=${html`<${Delta} v=${pct(m.total, mp.total)} />`} />
      <${Kpi} l="Transacciones" v=${nf(m.transacciones)} s=${html`<${Delta} v=${pct(m.transacciones, mp.transacciones)} />`} />
      <${Kpi} l="Ticket promedio" v=${ars(m.ticket)} s=${html`<${Delta} v=${pct(m.ticket, mp.ticket)} />`} />
      <${Kpi} l="Unidades vendidas" v=${nf(m.unidades)} s=${html`<${Delta} v=${pct(m.unidades, mp.unidades)} />`} />
      <${Kpi} l="Producto más vendido" v=${top ? top.nombre : "—"} s=${top ? `${nf(top.q)} u. · ${ars(top.total)}` : ""} />
    </div>
    <p class="small muted" style="margin:-6px 0 0">Período anterior de comparación: ${fFecha(ant.desde)} – ${fFecha(ant.hasta)}. Cada registro de venta cuenta como una transacción.</p>

    ${!sucursalId && comp.length > 1 && html`
      ${lider && lider[0].total > 0 && html`<div class="banner info"><b>${lider[0].s.nombre}</b> vendió ${ars(lider[0].total - lider[1].total)} más que ${lider[1].s.nombre} en el período${lider[1].total ? ` (${((lider[0].total / lider[1].total - 1) * 100).toFixed(1)}% más)` : ""}.</div>`}
      <div class="card"><div class="hd"><h3>Comparativa entre sucursales</h3><span class="note">${rango.label}</span></div><div class="bd" style="padding:12px 0 0"><div class="tablewrap"><table>
        <thead><tr><th>Indicador</th>${comp.map(x => html`<th class="r"><${Suc} s=${x.s} /></th>`)}</tr></thead>
        <tbody>
          <tr><td>Ventas totales</td>${comp.map(x => html`<td class="r num"><b>${ars(x.total)}</b></td>`)}</tr>
          <tr><td>Participación</td>${comp.map(x => html`<td class="r"><div class="bar" style="width:120px;margin-left:auto;display:inline-block;vertical-align:middle"><i style=${`width:${m.total ? x.total / comp.reduce((a, y) => a + y.total, 0) * 100 : 0}%;background:${colorSuc(x.s)}`}></i></div> <span class="num small">${comp.reduce((a, y) => a + y.total, 0) ? (x.total / comp.reduce((a, y) => a + y.total, 0) * 100).toFixed(0) : 0}%</span></td>`)}</tr>
          <tr><td>Transacciones</td>${comp.map(x => html`<td class="r num">${nf(x.transacciones)}</td>`)}</tr>
          <tr><td>Ticket promedio</td>${comp.map(x => html`<td class="r num">${ars(x.ticket)}</td>`)}</tr>
          <tr><td>Unidades vendidas</td>${comp.map(x => html`<td class="r num">${nf(x.unidades)}</td>`)}</tr>
          <tr><td>Promedio por día con ventas</td>${comp.map(x => html`<td class="r num">${ars(x.promDia)}</td>`)}</tr>
          <tr><td>Producto más vendido</td>${comp.map(x => html`<td class="r">${x.top?.nombre || "—"}</td>`)}</tr>
        </tbody></table></div></div></div>`}

    <div class="card"><div class="hd"><h3>Evolución de las ventas por fecha</h3><span class="note">${rango.label}</span></div><div class="bd"><${LineChart} desde=${rango.desde} hasta=${rango.hasta} series=${seriesPorSucursal(ven, sucs)} /></div></div>

    <div class="grid g21">
      <div class="card"><div class="hd"><h3>Ranking de productos</h3>
        <div class="seg" role="group" aria-label="Ordenar ranking"><button class=${rankPor === "q" ? "on" : ""} onClick=${() => setRankPor("q")}>Por unidades</button><button class=${rankPor === "total" ? "on" : ""} onClick=${() => setRankPor("total")}>Por ingresos</button></div></div>
        <div class="bd"><div class="rank">${rank.map((p, i) => html`
          <span class=${"n" + (i === 0 ? " top" : "")}>${i + 1}</span>
          <div style="min-width:0"><div class="row between" style="flex-wrap:nowrap"><span style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.nombre}</span><span class="small muted num" style="white-space:nowrap">${rankPor === "q" ? ars(p.total) : nf(p.q) + " u."}</span></div><div class="bar" style="margin-top:4px"><i style=${`width:${(rankPor === "q" ? p.q : p.total) / maxR * 100}%`}></i></div></div>
          <b class="num" style="text-align:right">${rankPor === "q" ? nf(p.q) + " u." : ars(p.total)}</b>`)}</div></div></div>
      <div style="display:grid;gap:14px;align-content:start">
        <div class="card"><div class="hd"><h3>Ventas por canal</h3></div><div class="bd"><${Barras} filas=${agrupar(ven, v => v.c)} total=${m.total} etiqueta=${k => CANALES[k] || k} /></div></div>
        <div class="card"><div class="hd"><h3>Por medio de pago</h3></div><div class="bd"><${Barras} filas=${agrupar(ven, v => v.m)} total=${m.total} etiqueta=${k => MEDIOS[k] || k} /></div></div>
      </div>
    </div>
    <div class="grid g2">
      <div class="card"><div class="hd"><h3>Por categoría de producto</h3></div><div class="bd"><${Barras} filas=${agrupar(ven, v => v.categoria)} total=${m.total} /></div></div>
      <div class="card"><div class="hd"><h3>Promedio por día de la semana</h3></div><div class="bd" style="display:grid;gap:6px">${dowProm.map(([k, v]) => html`<div style="display:grid;grid-template-columns:34px minmax(0,1fr) 84px;gap:8px;align-items:center" class="small"><span class="muted">${k}</span><div class="bar"><i style=${`width:${v / maxD * 100}%`}></i></div><b class="num" style="text-align:right">${v ? ars(v) : "—"}</b></div>`)}</div></div>
    </div>`;
}
