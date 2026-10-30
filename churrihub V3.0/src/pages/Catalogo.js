import { html } from "htm/preact";
import { useState, useMemo } from "preact/hooks";
import { ars, nf, norm, slug, uid } from "../lib/util.js";
import { Modal, Suc, PALETA_SUC, confirmar, guardar } from "../components/ui.js";
import { parseNum } from "../lib/importacion.js";
import { api } from "../data/store.js";

function Catalogo(c) {
  const { st, d } = c;
  const [tab, setTab] = useState("productos"); const [ed, setEd] = useState(null);
  const lista = [...st.data[tab]].sort((a, b) => a.nombre.localeCompare(b.nombre));
  const usoVentas = useMemo(() => { const m = {}; d.ventas.forEach(v => { if (v.p) m[v.p] = (m[v.p] || 0) + 1; }); return m; }, [d]);
  const fuera = useMemo(() => { const m = {}; d.ventas.forEach(v => { if (!v.p) m[v.nombre] = (m[v.nombre] || 0) + 1; }); return Object.entries(m); }, [d]);
  return html`
    ${fuera.length > 0 && html`<div class="banner">Hay ventas con productos que no están en el catálogo: ${fuera.map(([n, k]) => html`<span class="chip">${n} (${k})</span>`)} Agregalos como productos con el mismo nombre para que se agrupen en los reportes.</div>`}
    <div class="card"><div class="hd" style="padding-bottom:0">
      <div class="tabs" role="tablist">${[["productos", "Productos"], ["insumos", "Insumos"], ["sucursales", "Sucursales"]].map(([v, l]) => html`<button role="tab" aria-selected=${tab === v} class=${tab === v ? "on" : ""} onClick=${() => setTab(v)}>${l} <span class="muted">${st.data[v].length}</span></button>`)}</div>
      <button class="btn" onClick=${() => setEd({})}>${{ productos: "Nuevo producto", insumos: "Nuevo insumo", sucursales: "Nueva sucursal" }[tab]}</button>
    </div><div class="bd" style="padding:12px 0 0"><div class="tablewrap"><table>
      ${tab === "sucursales" ? html`<thead><tr><th>Sucursal</th><th>Dirección</th><th>Teléfono</th><th class="r">Ventas registradas</th><th></th></tr></thead>
        <tbody>${lista.map(x => html`<tr><td><${Suc} s=${x} /></td><td>${x.direccion || "—"}</td><td class="small">${x.telefono || "—"}</td><td class="r num muted">${nf(d.ventas.filter(v => v.sucursal_id === x.id).length)}</td><td class="r"><button class="btn ghost sm" onClick=${() => setEd(x)}>Editar</button></td></tr>`)}</tbody>`
      : tab === "productos" ? html`<thead><tr><th>Producto</th><th>Categoría</th><th>Unidad</th><th class="r">Precio de lista</th><th class="r">Ventas registradas</th><th>Estado</th><th></th></tr></thead>
        <tbody>${lista.map(p => html`<tr><td><b style="font-weight:600">${p.nombre}</b></td><td>${p.categoria}</td><td class="small">${p.unidad}</td><td class="r num">${p.precio ? ars(p.precio) : html`<span class="pill warn">sin precio</span>`}</td><td class="r num muted">${usoVentas[p.id] || 0}</td><td>${p.activo === false ? html`<span class="pill mute">Inactivo</span>` : html`<span class="pill ok">Activo</span>`}</td><td class="r"><button class="btn ghost sm" onClick=${() => setEd(p)}>Editar</button></td></tr>`)}</tbody>`
      : html`<thead><tr><th>Insumo</th><th>Unidad</th><th class="r">Mínimo sugerido</th><th class="r">Stock total</th><th></th></tr></thead>
        <tbody>${lista.map(i => html`<tr><td><b style="font-weight:600">${i.nombre}</b></td><td class="small">${i.unidad}</td><td class="r num">${nf(i.stock_minimo)}</td><td class="r num muted">${nf(st.data.stock.filter(s => s.tipo === "insumo" && s.item_id === i.id).reduce((a, s) => a + s.cantidad, 0))} ${i.unidad}</td><td class="r"><button class="btn ghost sm" onClick=${() => setEd(i)}>Editar</button></td></tr>`)}</tbody>`}
    </table></div></div></div>
    ${ed && tab === "sucursales" && html`<${SucursalForm} item=${ed.id ? ed : null} st=${st} onClose=${() => setEd(null)} />`}
    ${ed && tab !== "sucursales" && html`<${CatForm} tipo=${tab} item=${ed.id ? ed : null} st=${st} enUso=${ed.id ? (usoVentas[ed.id] || st.data.stock.some(s => s.item_id === ed.id) || st.data.compras.some(x => x.items.some(i => i.insumo_id === ed.id))) : false} onClose=${() => setEd(null)} />`}`;
}
function CatForm({ tipo, item, st, enUso, onClose }) {
  const esP = tipo === "productos";
  const [f, setF] = useState(esP ? { nombre: item?.nombre || "", categoria: item?.categoria || "Churros", precio: String(item?.precio ?? ""), unidad: item?.unidad || "unidad", activo: item?.activo !== false } : { nombre: item?.nombre || "", unidad: item?.unidad || "kg", stock_minimo: String(item?.stock_minimo ?? "") });
  const [err, setErr] = useState("");
  const enviar = async e => {
    e.preventDefault();
    if (!f.nombre.trim()) return setErr("Poné un nombre.");
    if (!item && st.data[tipo].some(x => norm(x.nombre) === norm(f.nombre))) return setErr("Ya existe con ese nombre.");
    const data = esP ? { nombre: f.nombre.trim(), categoria: f.categoria, precio: parseNum(f.precio) || 0, unidad: f.unidad, activo: f.activo } : { nombre: f.nombre.trim(), unidad: f.unidad, stock_minimo: parseNum(f.stock_minimo) || 0 };
    const ok = await guardar(() => item ? api.update(tipo, item.id, data) : api.set(tipo, slug(f.nombre) || uid(), data), item ? "Cambios guardados" : "Agregado al catálogo");
    if (ok) onClose();
  };
  const borrar = async () => { if (await confirmar("Eliminar del catálogo", `Se va a eliminar ${item.nombre}.`, "Eliminar")) { await guardar(() => api.del(tipo, item.id), "Eliminado"); onClose(); } };
  return html`<${Modal} titulo=${item ? "Editar " + item.nombre : esP ? "Nuevo producto" : "Nuevo insumo"} onClose=${onClose}><form class="form" onSubmit=${enviar}>
    <label class="f" for="ct-n">Nombre<input id="ct-n" class="in" value=${f.nombre} onInput=${e => setF({ ...f, nombre: e.target.value })} /></label>
    ${esP ? html`<div class="three">
        <label class="f" for="ct-c">Categoría<select id="ct-c" class="in" value=${f.categoria} onChange=${e => setF({ ...f, categoria: e.target.value })}>${["Churros", "Churros rellenos", "Churros salados", "Cafetería", "Bebidas", "Combos", "Otro"].map(x => html`<option>${x}</option>`)}</select></label>
        <label class="f" for="ct-p">Precio de lista<input id="ct-p" class="in num" inputmode="decimal" value=${f.precio} onInput=${e => setF({ ...f, precio: e.target.value })} /></label>
        <label class="f" for="ct-u">Unidad<select id="ct-u" class="in" value=${f.unidad} onChange=${e => setF({ ...f, unidad: e.target.value })}>${["unidad", "docena", "porción", "litro"].map(x => html`<option>${x}</option>`)}</select></label></div>
      <label class="row small" style="cursor:pointer"><input type="checkbox" id="ct-a" checked=${f.activo} onChange=${e => setF({ ...f, activo: e.target.checked })} /> Activo (aparece al registrar ventas)</label>`
      : html`<div class="two"><label class="f" for="ct-u2">Unidad<select id="ct-u2" class="in" value=${f.unidad} onChange=${e => setF({ ...f, unidad: e.target.value })}>${["kg", "gramos", "litros", "unidades"].map(x => html`<option>${x}</option>`)}</select></label>
        <label class="f" for="ct-m">Mínimo sugerido<input id="ct-m" class="in num" inputmode="decimal" value=${f.stock_minimo} onInput=${e => setF({ ...f, stock_minimo: e.target.value })} /></label></div>`}
    ${err && html`<span class="err">${err}</span>`}
    <div class="row" style="justify-content:flex-end">${item && (enUso ? html`<span class="small muted" style="margin-right:auto">${esP ? "Tiene ventas registradas: desactivalo en lugar de eliminarlo." : "Está en uso en stock o compras."}</span>` : html`<button type="button" class="btn ghost" style="margin-right:auto;color:var(--bad)" onClick=${borrar}>Eliminar</button>`)}<button type="button" class="btn sec" onClick=${onClose}>Cancelar</button><button class="btn">Guardar</button></div>
  </form><//>`;
}

export { Catalogo, CatForm };

// RNF-05: las sucursales se agregan desde acá, sin tocar el modelo de datos ni el código.
function SucursalForm({ item, st, onClose }) {
  const usados = st.data.sucursales.map(x => x.color);
  const [f, setF] = useState({ nombre: item?.nombre || "", direccion: item?.direccion || "", telefono: item?.telefono || "", color: item?.color || PALETA_SUC.find(c => !usados.includes(c)) || PALETA_SUC[0] });
  const [err, setErr] = useState("");
  const enUso = item && (st.data.lotes.some(l => l.sucursal_id === item.id) || st.data.stock.some(x => x.sucursal_id === item.id) || st.data.usuarios.some(u => u.sucursal_id === item.id));
  const enviar = async e => {
    e.preventDefault();
    if (!f.nombre.trim()) return setErr("Poné el nombre de la sucursal.");
    if (st.data.sucursales.some(x => x.id !== item?.id && norm(x.nombre) === norm(f.nombre))) return setErr("Ya existe una sucursal con ese nombre.");
    const data = { nombre: f.nombre.trim(), direccion: f.direccion.trim(), telefono: f.telefono.trim(), color: f.color };
    const ok = await guardar(() => item ? api.update("sucursales", item.id, data) : api.set("sucursales", slug(f.nombre) || uid(), data), item ? "Sucursal actualizada" : "Sucursal creada");
    if (ok) onClose();
  };
  const borrar = async () => { if (await confirmar("Eliminar sucursal", `Se va a eliminar ${item.nombre}.`, "Eliminar")) { await guardar(() => api.del("sucursales", item.id), "Sucursal eliminada"); onClose(); } };
  return html`<${Modal} titulo=${item ? "Editar " + item.nombre : "Nueva sucursal"} onClose=${onClose}><form class="form" onSubmit=${enviar}>
    <label class="f" for="sc-n">Nombre<input id="sc-n" class="in" value=${f.nombre} onInput=${e => setF({ ...f, nombre: e.target.value })} /></label>
    <label class="f" for="sc-d">Dirección<input id="sc-d" class="in" value=${f.direccion} onInput=${e => setF({ ...f, direccion: e.target.value })} /></label>
    <div class="two">
      <label class="f" for="sc-t">Teléfono<input id="sc-t" class="in" value=${f.telefono} onInput=${e => setF({ ...f, telefono: e.target.value })} /></label>
      <div class="f">Color en gráficos<div class="row" style="gap:6px">${PALETA_SUC.map(c => html`<button type="button" aria-label=${"Color " + c} aria-pressed=${f.color === c} onClick=${() => setF({ ...f, color: c })} style=${`width:26px;height:26px;border-radius:50%;cursor:pointer;background:${c};border:3px solid ${f.color === c ? "var(--fg)" : "transparent"}`}></button>`)}</div></div>
    </div>
    ${err && html`<span class="err">${err}</span>`}
    <div class="row" style="justify-content:flex-end">${item && (enUso ? html`<span class="small muted" style="margin-right:auto">Tiene ventas, stock o usuarios asociados: no se puede eliminar.</span>` : html`<button type="button" class="btn ghost" style="margin-right:auto;color:var(--bad)" onClick=${borrar}>Eliminar</button>`)}<button type="button" class="btn sec" onClick=${onClose}>Cancelar</button><button class="btn">Guardar</button></div>
  </form><//>`;
}
