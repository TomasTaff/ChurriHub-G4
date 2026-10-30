import { html } from "htm/preact";
import { useState, useEffect } from "preact/hooks";
import { ars, fFecha, hoy, nf, norm, nowIso, uid } from "../lib/util.js";
import { Empty, Kpi, Modal, Suc, confirmar, guardar, toast } from "../components/ui.js";
import { parseNum } from "../lib/importacion.js";
import { api } from "../data/store.js";

function Compras(c) {
  const { st, d, esG, sucursalId, prefill, setPrefill } = c;
  const [form, setForm] = useState(null); const [estado, setEstado] = useState("todas"); const [busy, setBusy] = useState(null);
  useEffect(() => { if (prefill) { setForm({ prefill }); setPrefill(null); } }, [prefill]);
  const lista = st.data.compras.filter(x => (!sucursalId || x.sucursal_id === sucursalId || !x.sucursal_id) && (estado === "todas" || x.estado === estado)).sort((a, b) => (a.estado === "pendiente" ? 0 : 1) - (b.estado === "pendiente" ? 0 : 1) || b.fecha.localeCompare(a.fecha));
  const pendTotal = st.data.compras.filter(x => x.estado === "pendiente" && (!sucursalId || x.sucursal_id === sucursalId)).reduce((a, x) => a + x.total, 0);
  const recibir = async x => {
    if (!x.sucursal_id) return toast("Asigná una sucursal a la compra antes de recibirla.", "bad");
    if (!(await confirmar("Recibir compra", `Se va a sumar al stock de ${d.suc[x.sucursal_id]?.nombre}: ${x.items.map(i => `${nf(i.cantidad)} ${d.ins[i.insumo_id]?.unidad || ""} de ${d.ins[i.insumo_id]?.nombre || i.insumo_id}`).join(", ")}.`, "Recibir y sumar al stock"))) return;
    setBusy(x.id);
    await guardar(async () => {
      for (const it of x.items) {
        const id = `${x.sucursal_id}__insumo__${it.insumo_id}`; const s = st.data.stock.find(y => y.id === id);
        if (s) await api.update("stock", id, { cantidad: Math.round((s.cantidad + it.cantidad) * 1000) / 1000, actualizado: nowIso(), motivo: "Compra recibida" });
        else await api.set("stock", id, { sucursal_id: x.sucursal_id, tipo: "insumo", item_id: it.insumo_id, cantidad: it.cantidad, stock_minimo: d.ins[it.insumo_id]?.stock_minimo || 0, actualizado: nowIso(), motivo: "Compra recibida" });
      }
      await api.update("compras", x.id, { estado: "recibida", recibida: nowIso(), recibida_por: st.me.id, stock_aplicado: true });
    }, "Compra recibida y stock actualizado");
    setBusy(null);
  };
  const cancelar = async x => { if (await confirmar("Cancelar orden", `La orden a ${d.prov[x.proveedor_id]?.nombre || "el proveedor"} queda cancelada y no suma stock.`, "Cancelar orden")) guardar(() => api.update("compras", x.id, { estado: "cancelada" }), "Orden cancelada"); };
  const asignar = (x, sid) => guardar(() => api.update("compras", x.id, { sucursal_id: sid }), "Sucursal asignada");
  return html`
    <div class="grid g3"><${Kpi} l="Pendiente de recibir" v=${ars(pendTotal)} s=${`${st.data.compras.filter(x => x.estado === "pendiente" && (!sucursalId || x.sucursal_id === sucursalId)).length} órdenes`} /><${Kpi} l="Compras del mes" v=${ars(st.data.compras.filter(x => x.estado !== "cancelada" && x.fecha >= hoy().slice(0, 8) + "01" && (!sucursalId || x.sucursal_id === sucursalId)).reduce((a, x) => a + x.total, 0))} /><${Kpi} l="Proveedores" v=${st.data.proveedores.length} /></div>
    <div class="card"><div class="hd"><div class="seg" role="group" aria-label="Estado">${[["todas", "Todas"], ["pendiente", "Pendientes"], ["recibida", "Recibidas"], ["cancelada", "Canceladas"]].map(([k, l]) => html`<button class=${estado === k ? "on" : ""} onClick=${() => setEstado(k)}>${l}</button>`)}</div><button class="btn" onClick=${() => setForm({})}>Nueva orden de compra</button></div>
    <div class="bd" style="padding:12px 0 0">${lista.length === 0 ? html`<${Empty} titulo="No hay órdenes">Creá una orden nueva o usá “Reponer” desde Stock.<//>` : html`<div class="tablewrap"><table>
      <thead><tr><th>Fecha</th><th>Proveedor</th><th>Sucursal</th><th>Insumos</th><th class="r">Total</th><th>Estado</th><th></th></tr></thead>
      <tbody>${lista.map(x => html`<tr>
        <td class="num" style="white-space:nowrap">${fFecha(x.fecha)}</td><td><b style="font-weight:600">${d.prov[x.proveedor_id]?.nombre || "Proveedor eliminado"}</b></td>
        <td>${x.sucursal_id ? html`<${Suc} s=${d.suc[x.sucursal_id]} />` : esG && x.estado === "pendiente" ? html`<select class="in" style="width:auto;border-color:var(--warn)" aria-label="Asignar sucursal" onChange=${e => e.target.value && asignar(x, e.target.value)}><option value="">Asignar sucursal…</option>${d.sucOrden.map(s => html`<option value=${s.id}>${s.nombre}</option>`)}</select>` : html`<${Suc} s=${null} />`}</td>
        <td>${x.items.map(i => html`<span class="chip">${d.ins[i.insumo_id]?.nombre || i.insumo_id} · <b class="num">${nf(i.cantidad)}</b> × ${ars(i.precio)} = <b class="num">${ars(i.cantidad * i.precio)}</b></span>`)}${x.nota && html`<div class="small muted">${x.nota}</div>`}</td>
        <td class="r num"><b>${ars(x.total)}</b></td>
        <td>${x.estado === "pendiente" ? html`<span class="pill warn">Pendiente</span>` : x.estado === "recibida" ? html`<span class="pill ok">Recibida</span>` : html`<span class="pill mute">Cancelada</span>`}</td>
        <td class="r" style="white-space:nowrap">${x.estado === "pendiente" && html`<button class="btn sm" disabled=${busy === x.id} onClick=${() => recibir(x)}>${busy === x.id ? "Actualizando…" : "Recibir"}</button><button class="btn ghost sm" onClick=${() => cancelar(x)}>Cancelar</button>`}</td>
      </tr>`)}</tbody></table></div>`}</div></div>
    ${form && html`<${CompraForm} ...${c} pre=${form.prefill} onClose=${() => setForm(null)} />`}`;
}
function CompraForm({ st, d, esG, sucursalId, sucursalFija, pre, onClose }) {
  const provs = [...st.data.proveedores].sort((a, b) => a.nombre.localeCompare(b.nombre));
  const ins = [...st.data.insumos].sort((a, b) => a.nombre.localeCompare(b.nombre));
  const ultimoPrecio = (iid, pid) => { const cs = st.data.compras.filter(x => x.estado !== "cancelada" && (!pid || x.proveedor_id === pid)).sort((a, b) => b.fecha.localeCompare(a.fecha)); for (const x of cs) { const it = x.items.find(i => i.insumo_id === iid); if (it && it.precio > 1) return it.precio; } return ""; };
  const sugerirProv = iid => { const n = norm(d.ins[iid]?.nombre || ""); const p = provs.find(p => norm(p.insumos).split(/,\s*|\s+y\s+/).some(t => t && (n.includes(t) || t.includes(n.split(" ")[0])))); return p?.id || ""; };
  const provIni = pre ? sugerirProv(pre.insumo_id) : "";
  const [f, setF] = useState({ proveedor_id: provIni, sucursal_id: pre?.sucursal_id || sucursalId || sucursalFija || "", fecha: hoy(), items: pre ? [{ insumo_id: pre.insumo_id, cantidad: String(pre.cantidad), precio: String(ultimoPrecio(pre.insumo_id, provIni)) }] : [{ insumo_id: "", cantidad: "", precio: "" }] });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const setItem = (i, patch) => setF({ ...f, items: f.items.map((x, j) => j === i ? { ...x, ...patch } : x) });
  const items = f.items.map(x => ({ insumo_id: x.insumo_id, cantidad: parseNum(x.cantidad), precio: parseNum(x.precio) }));
  const total = items.reduce((a, x) => a + (x.cantidad || 0) * (x.precio || 0), 0);
  const enviar = async e => {
    e.preventDefault();
    if (!f.proveedor_id) return setErr("Elegí el proveedor.");
    if (!f.sucursal_id) return setErr("Elegí la sucursal que recibe la compra.");
    const ok_items = items.filter(x => x.insumo_id);
    if (!ok_items.length) return setErr("Agregá al menos un insumo.");
    if (ok_items.some(x => !(x.cantidad > 0))) return setErr("Todas las cantidades tienen que ser mayores a cero.");
    if (ok_items.some(x => !(x.precio >= 0))) return setErr("Revisá los precios.");
    if (new Set(ok_items.map(x => x.insumo_id)).size !== ok_items.length) return setErr("Hay un insumo repetido: unificá las cantidades en una sola línea.");
    setBusy(true);
    const ok = await guardar(() => api.set("compras", uid(), { proveedor_id: f.proveedor_id, sucursal_id: f.sucursal_id, fecha: f.fecha, estado: "pendiente", items: ok_items, total: ok_items.reduce((a, x) => a + x.cantidad * x.precio, 0), creado: nowIso(), usuario_id: st.me.id }), "Orden de compra creada");
    setBusy(false); if (ok) onClose();
  };
  return html`<${Modal} wide titulo="Nueva orden de compra" onClose=${onClose}><form class="form" onSubmit=${enviar}>
    <div class="three">
      <label class="f" for="co-p">Proveedor<select id="co-p" class="in" value=${f.proveedor_id} onChange=${e => setF({ ...f, proveedor_id: e.target.value })}><option value="">Elegí un proveedor</option>${provs.map(p => html`<option value=${p.id}>${p.nombre}</option>`)}</select></label>
      <label class="f" for="co-s">Sucursal que recibe<select id="co-s" class="in" value=${f.sucursal_id} disabled=${!esG} onChange=${e => setF({ ...f, sucursal_id: e.target.value })}><option value="">Elegí una sucursal</option>${d.sucOrden.map(s => html`<option value=${s.id}>${s.nombre}</option>`)}</select></label>
      <label class="f" for="co-f">Fecha<input id="co-f" class="in" type="date" value=${f.fecha} onChange=${e => setF({ ...f, fecha: e.target.value })} /></label>
    </div>
    ${f.proveedor_id && d.prov[f.proveedor_id]?.insumos && html`<p class="small muted" style="margin:0">Provee: ${d.prov[f.proveedor_id].insumos} · Pago: ${d.prov[f.proveedor_id].condiciones_pago || "—"}</p>`}
    <div style="display:grid;gap:8px">
      <div class="small muted oc-linea oc-head" style="font-weight:600"><span>Insumo</span><span>Cantidad</span><span>Precio unitario</span><span style="text-align:right">Subtotal</span><span></span></div>
      ${f.items.map((x, i) => html`<div class="oc-linea">
        <select class="in" aria-label="Insumo" value=${x.insumo_id} onChange=${e => setItem(i, { insumo_id: e.target.value, precio: x.precio || String(ultimoPrecio(e.target.value, f.proveedor_id)) })}><option value="">Elegí…</option>${ins.map(n => html`<option value=${n.id}>${n.nombre} (${n.unidad})</option>`)}</select>
        <input class="in num" aria-label="Cantidad" inputmode="decimal" value=${x.cantidad} onInput=${e => setItem(i, { cantidad: e.target.value })} />
        <input class="in num" aria-label="Precio unitario" inputmode="decimal" value=${x.precio} onInput=${e => setItem(i, { precio: e.target.value })} />
        <span class="num" style="text-align:right;font-weight:600">${ars((parseNum(x.cantidad) || 0) * (parseNum(x.precio) || 0))}</span>
        <button type="button" class="x" aria-label="Quitar línea" disabled=${f.items.length === 1} onClick=${() => setF({ ...f, items: f.items.filter((_, j) => j !== i) })}>×</button>
      </div>`)}
      <div><button type="button" class="btn ghost sm" onClick=${() => setF({ ...f, items: [...f.items, { insumo_id: "", cantidad: "", precio: "" }] })}>+ Agregar insumo</button></div>
    </div>
    <div class="row between"><span class="muted">Total de la orden: <b class="num" style="color:var(--fg);font-size:16px">${ars(total)}</b></span>${err && html`<span class="err">${err}</span>`}</div>
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn sec" onClick=${onClose}>Cancelar</button><button class="btn" disabled=${busy}>${busy ? "Guardando…" : "Crear orden"}</button></div>
  </form><//>`;
}

export { Compras, CompraForm };
