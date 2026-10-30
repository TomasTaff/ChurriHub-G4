import { html } from "htm/preact";
import { useState, useEffect, useMemo } from "preact/hooks";
import { MEDIOS, CANALES, ars, fFecha, fHora, hoy, nf, norm, nowIso } from "../lib/util.js";
import { metricas, nombreUsuario } from "../lib/derivados.js";
import { Empty, Kpi, Modal, Suc, confirmar, guardar } from "../components/ui.js";
import { parseNum } from "../lib/importacion.js";
import { api } from "../data/store.js";

function Ventas(c) {
  const { st, d, esG, sucursalId, rango } = c;
  const [q, setQ] = useState(""); const [medio, setMedio] = useState("todos"); const [canal, setCanal] = useState("todos"); const [detalle, setDetalle] = useState(null); const [pag, setPag] = useState(0); const [nueva, setNueva] = useState(false);
  const lista = useMemo(() => d.ventas.filter(v => v.f >= rango.desde && v.f <= rango.hasta && (!sucursalId || v.sucursal_id === sucursalId) && (medio === "todos" || v.m === medio) && (canal === "todos" || v.c === canal) && (!q || norm(v.nombre).includes(norm(q)))), [d, rango.desde, rango.hasta, sucursalId, medio, canal, q]);
  useEffect(() => setPag(0), [q, medio, canal, rango.desde, rango.hasta, sucursalId]);
  const m = metricas(lista); const POR = 50; const paginas = Math.ceil(lista.length / POR);
  const porMedio = Object.keys(MEDIOS).map(k => [k, lista.filter(v => v.m === k).reduce((a, v) => a + v.total, 0)]);
  const anular = async v => {
    if (!(await confirmar("Anular venta", `Se va a quitar la línea "${v.nombre}" del ${fFecha(v.f)} (${ars(v.total)}). Esta acción no se puede deshacer.`, "Anular"))) return;
    const lote = st.data.lotes.find(l => l.id === v.lote_id); if (!lote) return;
    const filas = lote.filas.filter((_, i) => i !== v.idx);
    await guardar(() => filas.length ? api.update("lotes", lote.id, { filas }) : api.del("lotes", lote.id), "Venta anulada");
  };
  return html`
    <div class="grid g4">
      <${Kpi} l="Total" v=${ars(m.total)} s=${`${lista.length} líneas de venta`} />
      ${porMedio.map(([k, v]) => html`<${Kpi} l=${MEDIOS[k]} v=${ars(v)} s=${m.total ? `${(v / m.total * 100).toFixed(0)}% del total` : "—"} />`)}
    </div>
    <div class="card"><div class="hd">
      <div class="row" style="flex:1"><input class="in" style="max-width:260px" placeholder="Buscar producto…" aria-label="Buscar producto" value=${q} onInput=${e => setQ(e.target.value)} />
        <select class="in" style="width:auto" aria-label="Medio de pago" value=${medio} onChange=${e => setMedio(e.target.value)}><option value="todos">Todos los medios</option>${Object.entries(MEDIOS).map(([k, l]) => html`<option value=${k}>${l}</option>`)}</select>
        <select class="in" style="width:auto" aria-label="Canal" value=${canal} onChange=${e => setCanal(e.target.value)}><option value="todos">Todos los canales</option>${Object.entries(CANALES).map(([k, l]) => html`<option value=${k}>${l}</option>`)}</select></div>
      <button class="btn" onClick=${() => setNueva(true)}>Registrar venta</button>
    </div><div class="bd" style="padding:12px 0 0">
      ${lista.length === 0 ? html`<${Empty} titulo="No hay ventas para estos filtros">Probá con otro período o sucursal.<//>` : html`<div class="tablewrap"><table>
        <thead><tr><th>Fecha</th><th>Sucursal</th><th>Producto</th><th class="r">Cant.</th><th class="r">P. unit.</th><th class="r">Total</th><th>Pago</th><th>Canal</th><th></th></tr></thead>
        <tbody>${lista.slice(pag * POR, pag * POR + POR).map(v => html`<tr key=${v.lote_id + v.idx} style="cursor:pointer" onClick=${() => setDetalle(v)}>
          <td class="num" style="white-space:nowrap">${fFecha(v.f)}</td><td><${Suc} s=${d.suc[v.sucursal_id]} /></td>
          <td><b style="font-weight:600">${v.nombre}</b>${!v.p && html` <span class="pill warn" title="No está en el catálogo">fuera de catálogo</span>`}</td>
          <td class="r num">${nf(v.q)}</td><td class="r num muted">${ars(v.pu)}</td><td class="r num"><b>${ars(v.total)}</b></td><td class="small">${MEDIOS[v.m] || v.m}</td><td class="small">${CANALES[v.c] || v.c}</td>
          <td class="r"><button class="btn ghost sm" onClick=${e => { e.stopPropagation(); setDetalle(v); }}>Ver</button></td></tr>`)}</tbody></table></div>
        ${paginas > 1 && html`<div class="row between" style="padding:10px 16px;border-top:1px solid var(--line)"><span class="small muted">Página ${pag + 1} de ${paginas}</span><div class="row"><button class="btn sec sm" disabled=${pag === 0} onClick=${() => setPag(pag - 1)}>Anterior</button><button class="btn sec sm" disabled=${pag >= paginas - 1} onClick=${() => setPag(pag + 1)}>Siguiente</button></div></div>`}`}
    </div></div>
    ${nueva && html`<${NuevaVenta} ...${c} onClose=${() => setNueva(false)} />`}
    ${detalle && html`<${DetalleVenta} st=${st} d=${d} v=${detalle} esG=${esG} onAnular=${async () => { await anular(detalle); setDetalle(null); }} onClose=${() => setDetalle(null)} />`}`;
}

// Detalle de una venta (RF-12).
function DetalleVenta({ st, d, v, esG, onAnular, onClose }) {
  const lote = st.data.lotes.find(l => l.id === v.lote_id);
  const origen = { excel: "Importación de archivo", manual: "Venta registrada a mano", migracion: "Migración del prototipo", base: "Datos de muestra" }[lote?.tipo] || "—";
  return html`<${Modal} titulo="Detalle de la venta" onClose=${onClose}>
    <dl class="dl" style="font-size:14px;gap:8px 18px">
      <dt>Fecha</dt><dd>${fFecha(v.f)}</dd>
      <dt>Sucursal</dt><dd><${Suc} s=${d.suc[v.sucursal_id]} /></dd>
      <dt>Producto</dt><dd>${v.nombre} <span class="muted small">· ${v.categoria}</span></dd>
      <dt>Cantidad</dt><dd class="num">${nf(v.q)}</dd>
      <dt>Precio unitario</dt><dd class="num">${ars(v.pu)}</dd>
      <dt>Total</dt><dd class="num" style="font-size:18px">${ars(v.total)}</dd>
      <dt>Medio de pago</dt><dd>${MEDIOS[v.m] || v.m}</dd>
      <dt>Canal</dt><dd>${CANALES[v.c] || v.c}</dd>
      <dt>Origen</dt><dd>${origen}${lote?.tipo === "excel" ? html` <span class="muted small">· ${lote.nombre}</span>` : ""}</dd>
      <dt>Cargada por</dt><dd>${nombreUsuario(st, v.u || lote?.usuario_id)}${v.t || lote?.creado ? html` <span class="muted small">· ${fHora(v.t || lote.creado)}</span>` : ""}</dd>
    </dl>
    <div class="row" style="justify-content:flex-end;margin-top:16px">${esG && html`<button class="btn ghost" style="color:var(--bad);margin-right:auto" onClick=${onAnular}>Anular venta</button>`}<button class="btn sec" onClick=${onClose}>Cerrar</button></div>
  <//>`;
}
function NuevaVenta({ st, d, esG, sucursalId, sucursalFija, onClose }) {
  const activos = st.data.productos.filter(p => p.activo !== false).sort((a, b) => a.nombre.localeCompare(b.nombre));
  const [f, setF] = useState({ sucursal_id: sucursalId || sucursalFija || "", fecha: hoy(), p: activos[0]?.id || "", q: "1", pu: String(activos[0]?.precio || ""), m: "efectivo", c: "local" });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const enviar = async e => {
    e.preventDefault();
    const q = parseNum(f.q), pu = parseNum(f.pu);
    if (!f.sucursal_id) return setErr("Elegí la sucursal.");
    if (!f.p) return setErr("Elegí un producto.");
    if (!(q > 0)) return setErr("La cantidad tiene que ser mayor a cero.");
    if (!(pu >= 0)) return setErr("Revisá el precio.");
    if (f.fecha > hoy()) return setErr("La fecha no puede ser futura.");
    setBusy(true);
    const id = `manual-${f.sucursal_id}-${f.fecha}`; const lote = st.data.lotes.find(l => l.id === id);
    const fila = { f: f.fecha, p: f.p, q, pu, m: f.m, c: f.c, u: st.me.id, t: nowIso() };
    const ok = await guardar(async () => {
      if (lote) await api.update("lotes", id, { filas: [...lote.filas, fila], hasta: f.fecha });
      else await api.set("lotes", id, { sucursal_id: f.sucursal_id, tipo: "manual", nombre: `Ventas manuales ${fFecha(f.fecha)}`, creado: nowIso(), usuario_id: st.me.id, desde: f.fecha, hasta: f.fecha, filas: [fila], errores: [] });
      await descontarProductos(st, f.sucursal_id, [fila]);
    }, "Venta registrada");
    setBusy(false); if (ok) onClose();
  };
  return html`<${Modal} titulo="Registrar venta" onClose=${onClose}><form class="form" onSubmit=${enviar}>
    <div class="two">
      <label class="f" for="nv-suc">Sucursal<select id="nv-suc" class="in" value=${f.sucursal_id} disabled=${!esG} onChange=${e => setF({ ...f, sucursal_id: e.target.value })}><option value="">Elegí una sucursal</option>${d.sucOrden.map(s => html`<option value=${s.id}>${s.nombre}</option>`)}</select></label>
      <label class="f" for="nv-f">Fecha<input id="nv-f" class="in" type="date" max=${hoy()} value=${f.fecha} onChange=${e => setF({ ...f, fecha: e.target.value })} /></label>
    </div>
    <label class="f" for="nv-p">Producto<select id="nv-p" class="in" value=${f.p} onChange=${e => { const p = d.prod[e.target.value]; setF({ ...f, p: e.target.value, pu: String(p?.precio ?? "") }); }}>${activos.map(p => html`<option value=${p.id}>${p.nombre} · ${ars(p.precio)}</option>`)}</select></label>
    <div class="three">
      <label class="f" for="nv-q">Cantidad<input id="nv-q" class="in num" inputmode="decimal" value=${f.q} onInput=${e => setF({ ...f, q: e.target.value })} /></label>
      <label class="f" for="nv-pu">Precio unitario<input id="nv-pu" class="in num" inputmode="decimal" value=${f.pu} onInput=${e => setF({ ...f, pu: e.target.value })} /></label>
      <label class="f" for="nv-m">Medio de pago<select id="nv-m" class="in" value=${f.m} onChange=${e => setF({ ...f, m: e.target.value })}>${Object.entries(MEDIOS).map(([k, l]) => html`<option value=${k}>${l}</option>`)}</select></label>
    </div>
    <label class="f" for="nv-c" style="max-width:260px">Canal<select id="nv-c" class="in" value=${f.c} onChange=${e => setF({ ...f, c: e.target.value })}>${Object.entries(CANALES).map(([k, l]) => html`<option value=${k}>${l}</option>`)}</select></label>
    <div class="row between"><span class="muted">Total: <b class="num" style="color:var(--fg)">${ars((parseNum(f.q) || 0) * (parseNum(f.pu) || 0))}</b></span>${err && html`<span class="err">${err}</span>`}</div>
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn sec" onClick=${onClose}>Cancelar</button><button class="btn" disabled=${busy}>${busy ? "Guardando…" : "Guardar venta"}</button></div>
  </form><//>`;
}
async function descontarProductos(st, sucId, filas) {
  const porProd = {}; filas.forEach(r => { if (r.p) porProd[r.p] = (porProd[r.p] || 0) + r.q; });
  for (const [pid, q] of Object.entries(porProd)) {
    const s = st.data.stock.find(x => x.id === `${sucId}__producto__${pid}`);
    if (s) await api.update("stock", s.id, { cantidad: Math.max(0, s.cantidad - q), actualizado: nowIso(), motivo: "Venta" });
  }
}

export { Ventas, NuevaVenta, descontarProductos };
