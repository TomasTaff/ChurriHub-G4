import { html } from "htm/preact";
import { useState } from "preact/hooks";
import { fFecha, norm, slug, uid } from "../lib/util.js";
import { Empty, Modal, confirmar, guardar } from "../components/ui.js";
import { api } from "../data/store.js";

function Proveedores(c) {
  const { st, d } = c; // RF-22: gerente y encargado dan de alta, editan y eliminan.
  const [ed, setEd] = useState(null);
  const lista = [...st.data.proveedores].sort((a, b) => a.nombre.localeCompare(b.nombre));
  const compras = id => st.data.compras.filter(x => x.proveedor_id === id && x.estado !== "cancelada");
  const borrar = async p => { const n = compras(p.id).length; if (await confirmar("Eliminar proveedor", n ? `${p.nombre} tiene ${n} compras registradas; se conservan, pero van a figurar como “Proveedor eliminado”.` : `Se va a eliminar ${p.nombre}.`, "Eliminar")) guardar(() => api.del("proveedores", p.id), "Proveedor eliminado"); };
  return html`<div class="row between"><p class="muted" style="margin:0">Proveedores disponibles al crear órdenes de compra.</p><button class="btn" onClick=${() => setEd({})}>Nuevo proveedor</button></div>
    ${lista.length === 0 ? html`<div class="card"><${Empty} titulo="No hay proveedores">Dá de alta el primero.<//></div>` : html`<div class="grid g3">${lista.map(p => { const cs = compras(p.id); const ult = cs.sort((a, b) => b.fecha.localeCompare(a.fecha))[0]; return html`<div class="card"><div class="bd" style="display:grid;gap:6px">
      <div class="row between"><h3 style="font-size:15px">${p.nombre}</h3><div class="row" style="gap:2px"><button class="btn ghost sm" onClick=${() => setEd(p)}>Editar</button><button class="btn ghost sm" style="color:var(--bad)" onClick=${() => borrar(p)}>Eliminar</button></div></div>
      <div class="small" style="word-break:break-word">${p.contacto}</div>
      ${p.insumos && html`<div class="small muted">Provee: ${p.insumos}</div>`}
      <div class="row small" style="margin-top:4px"><span class="pill mute">Pago: ${p.condiciones_pago || "—"}</span><span class="muted">${cs.length} compras${ult ? " · última " + fFecha(ult.fecha) : ""}</span></div>
    </div></div>`; })}</div>`}
    ${ed && html`<${ProvForm} prov=${ed.id ? ed : null} st=${st} onClose=${() => setEd(null)} />`}`;
}
function ProvForm({ prov, st, onClose }) {
  const [f, setF] = useState({ nombre: prov?.nombre || "", contacto: prov?.contacto || "", insumos: prov?.insumos || "", condiciones_pago: prov?.condiciones_pago || "" });
  const [err, setErr] = useState("");
  const enviar = async e => {
    e.preventDefault();
    if (!f.nombre.trim() || !f.contacto.trim()) return setErr("Completá nombre y contacto.");
    if (!prov && st.data.proveedores.some(p => norm(p.nombre) === norm(f.nombre))) return setErr("Ya existe un proveedor con ese nombre.");
    const data = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.trim()]));
    const ok = await guardar(() => prov ? api.update("proveedores", prov.id, data) : api.set("proveedores", slug(f.nombre) || uid(), data), prov ? "Proveedor actualizado" : "Proveedor creado");
    if (ok) onClose();
  };
  return html`<${Modal} titulo=${prov ? "Editar proveedor" : "Nuevo proveedor"} onClose=${onClose}><form class="form" onSubmit=${enviar}>
    <label class="f" for="pv-n">Nombre<input id="pv-n" class="in" value=${f.nombre} onInput=${e => setF({ ...f, nombre: e.target.value })} /></label>
    <label class="f" for="pv-c">Contacto (email y/o teléfono)<input id="pv-c" class="in" value=${f.contacto} onInput=${e => setF({ ...f, contacto: e.target.value })} /></label>
    <div class="two"><label class="f" for="pv-i">Insumos que provee<input id="pv-i" class="in" placeholder="Harina, Azúcar" value=${f.insumos} onInput=${e => setF({ ...f, insumos: e.target.value })} /></label>
      <label class="f" for="pv-p">Condiciones de pago<input id="pv-p" class="in" placeholder="30 días" value=${f.condiciones_pago} onInput=${e => setF({ ...f, condiciones_pago: e.target.value })} /></label></div>
    ${err && html`<span class="err">${err}</span>`}
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn sec" onClick=${onClose}>Cancelar</button><button class="btn">Guardar</button></div>
  </form><//>`;
}

export { Proveedores, ProvForm };
