import { html } from "htm/preact";
import { useState } from "preact/hooks";
import { fHora, nf, nowIso } from "../lib/util.js";
import { esCritico, nombreItem, unidadItem } from "../lib/derivados.js";
import { Empty, Modal, Suc, confirmar, guardar } from "../components/ui.js";
import { parseNum } from "../lib/importacion.js";
import { api } from "../data/store.js";

function Stock(c) {
  const { st, d, rol, esG, sucursalId, ir, setPrefill } = c;
  const [tab, setTab] = useState("insumo"); const [soloCrit, setSoloCrit] = useState(false); const [ajuste, setAjuste] = useState(null); const [nuevo, setNuevo] = useState(false);
  const gestiona = ["Gerente", "Encargado"].includes(rol.rol);
  const base = st.data.stock.filter(s => (!sucursalId || s.sucursal_id === sucursalId));
  const lista = base.filter(s => s.tipo === tab && (!soloCrit || esCritico(s))).sort((a, b) => (esCritico(b) - esCritico(a)) || nombreItem(d, a).localeCompare(nombreItem(d, b)) || a.sucursal_id.localeCompare(b.sucursal_id));
  const nCrit = base.filter(s => s.tipo === tab && esCritico(s)).length;
  return html`
    <div class="card"><div class="hd" style="padding-bottom:0">
      <div class="tabs" role="tablist">${[["insumo", "Insumos"], ["producto", "Productos"]].map(([v, l]) => html`<button role="tab" aria-selected=${tab === v} class=${tab === v ? "on" : ""} onClick=${() => setTab(v)}>${l} <span class="muted">${base.filter(s => s.tipo === v).length}</span></button>`)}</div>
      <div class="row"><label class="row small" style="cursor:pointer"><input type="checkbox" id="st-crit" checked=${soloCrit} onChange=${e => setSoloCrit(e.target.checked)} /> Solo críticos (${nCrit})</label>${gestiona && html`<button class="btn" onClick=${() => setNuevo(true)}>Agregar ítem</button>`}</div>
    </div><div class="bd" style="padding:12px 0 0">
      ${lista.length === 0 ? html`<${Empty} titulo=${soloCrit ? "Nada crítico por acá" : "Sin ítems cargados"}>${soloCrit ? "Ningún ítem está por debajo del mínimo." : tab === "producto" ? "Agregá productos envasados (por ejemplo bebidas) para controlar su stock; se descuentan solos al cargar ventas." : "Agregá los insumos que maneja la sucursal."}<//>` : html`<div class="tablewrap"><table>
        <thead><tr><th>Ítem</th><th>Sucursal</th><th class="r">Cantidad</th><th class="r">Mínimo</th><th>Estado</th><th>Actualizado</th><th></th></tr></thead>
        <tbody>${lista.map(s => { const cr = esCritico(s), u = unidadItem(d, s); return html`<tr class=${cr ? "crit" : ""}>
          <td><b style="font-weight:600">${nombreItem(d, s)}</b></td><td><${Suc} s=${d.suc[s.sucursal_id]} /></td>
          <td class="r num"><b style=${cr ? "color:var(--bad)" : ""}>${nf(s.cantidad)}</b> <span class="small muted">${u}</span></td>
          <td class="r num muted">${s.stock_minimo ? nf(s.stock_minimo) + " " + u : "—"}</td>
          <td>${cr ? html`<span class="pill bad">Por reponer</span>` : (s.stock_minimo && s.cantidad <= s.stock_minimo * 1.3) ? html`<span class="pill warn">Bajo</span>` : html`<span class="pill ok">OK</span>`}</td>
          <td class="small muted">${fHora(s.actualizado)}${s.motivo ? html`<br />${s.motivo}` : ""}</td>
          ${html`<td class="r" style="white-space:nowrap"><button class="btn ghost sm" onClick=${() => setAjuste(s)}>Ajustar</button>${gestiona && cr && s.tipo === "insumo" && html`<button class="btn sec sm" onClick=${() => { setPrefill({ sucursal_id: s.sucursal_id, insumo_id: s.item_id, cantidad: Math.max(1, s.stock_minimo * 2 - s.cantidad) }); ir("compras"); }}>Reponer</button>`}</td>`}
        </tr>`; })}</tbody></table></div>`}
    </div></div>
    ${ajuste && html`<${AjusteStock} ...${c} item=${ajuste} onClose=${() => setAjuste(null)} />`}
    ${nuevo && html`<${NuevoStock} ...${c} tipo=${tab} onClose=${() => setNuevo(false)} />`}`;
}
// RF-19 / RF-20: ingresar suma, consumir resta sin quedar bajo cero; los valores deben ser mayores a cero
// y se registra la fecha de actualización. Fijar conteo y cambiar el mínimo quedan para encargado y gerente.
function AjusteStock({ d, item, onClose, esG, rol }) {
  const gestiona = ["Gerente", "Encargado"].includes(rol.rol);
  const [modo, setModo] = useState("ingresar"); const [v, setV] = useState(""); const [motivo, setMotivo] = useState("");
  const [min, setMin] = useState(String(item.stock_minimo ?? 0)); const [err, setErr] = useState("");
  const MOTIVOS = { ingresar: ["Ingreso de mercadería", "Devolución", "Corrección"], consumir: ["Uso en producción", "Merma", "Corrección"], fijar: ["Conteo físico"] };
  const n = parseNum(v); const u = unidadItem(d, item);
  const nuevo = isNaN(n) ? item.cantidad : modo === "ingresar" ? item.cantidad + n : modo === "consumir" ? item.cantidad - n : n;
  const enviar = async e => {
    e.preventDefault();
    const m = gestiona ? parseNum(min) : item.stock_minimo;
    const soloMinimo = gestiona && v === "" && m !== item.stock_minimo;
    if (!soloMinimo) {
      if (v === "" || isNaN(n)) return setErr("Ingresá una cantidad.");
      if (modo === "fijar" ? n < 0 : n <= 0) return setErr(modo === "fijar" ? "El conteo no puede ser negativo." : "La cantidad tiene que ser mayor a cero.");
      if (nuevo < 0) return setErr(`No se puede consumir ${nf(n)} ${u}: hay ${nf(item.cantidad)} ${u} y el stock quedaría bajo cero.`);
    }
    if (isNaN(m) || m < 0) return setErr("Revisá el mínimo.");
    const ok = await guardar(() => api.update("stock", item.id, {
      cantidad: soloMinimo ? item.cantidad : Math.round(nuevo * 1000) / 1000, stock_minimo: m, actualizado: nowIso(),
      motivo: soloMinimo ? "Cambio de mínimo" : `${{ ingresar: "Ingreso", consumir: "Consumo", fijar: "Conteo" }[modo]} ${nf(n)} ${u}${motivo ? " · " + motivo : ""}`
    }), "Stock actualizado");
    if (ok) onClose();
  };
  const modos = [["ingresar", "Ingresar"], ["consumir", "Consumir"], ...(gestiona ? [["fijar", "Fijar conteo"]] : [])];
  return html`<${Modal} titulo=${"Ajustar " + nombreItem(d, item)} onClose=${onClose}><form class="form" onSubmit=${enviar}>
    <p class="muted" style="margin:0"><${Suc} s=${d.suc[item.sucursal_id]} /> · Stock actual <b class="num" style="color:var(--fg)">${nf(item.cantidad)} ${u}</b></p>
    <div class="seg" role="group" aria-label="Tipo de ajuste">${modos.map(([k, l]) => html`<button type="button" class=${modo === k ? "on" : ""} onClick=${() => { setModo(k); setMotivo(""); setErr(""); }}>${l}</button>`)}</div>
    <div class=${gestiona ? "three" : "two"}>
      <label class="f" for="aj-v">${modo === "fijar" ? "Cantidad contada" : "Cantidad"} (${u})<input id="aj-v" class="in num" inputmode="decimal" value=${v} onInput=${e => { setV(e.target.value); setErr(""); }} /></label>
      <label class="f" for="aj-m">Motivo<select id="aj-m" class="in" value=${motivo} onChange=${e => setMotivo(e.target.value)}><option value="">Sin especificar</option>${MOTIVOS[modo].map(x => html`<option>${x}</option>`)}</select></label>
      ${gestiona && html`<label class="f" for="aj-min">Stock mínimo<input id="aj-min" class="in num" inputmode="decimal" value=${min} onInput=${e => setMin(e.target.value)} /></label>`}
    </div>
    <div class="row between"><span class="muted">Queda en <b class="num" style=${"color:" + (nuevo < 0 ? "var(--bad)" : "var(--fg)")}>${nf(nuevo)} ${u}</b></span>${err && html`<span class="err" role="alert">${err}</span>`}</div>
    <div class="row" style="justify-content:flex-end">${esG && html`<button type="button" class="btn ghost" style="margin-right:auto;color:var(--bad)" onClick=${async () => { if (await confirmar("Quitar del stock", `Se va a quitar ${nombreItem(d, item)} del stock de ${d.suc[item.sucursal_id]?.nombre}.`, "Quitar")) { await guardar(() => api.del("stock", item.id), "Ítem quitado"); onClose(); } }}>Quitar ítem</button>`}<button type="button" class="btn sec" onClick=${onClose}>Cancelar</button><button class="btn">Guardar</button></div>
  </form><//>`;
}
function NuevoStock({ st, d, esG, sucursalId, sucursalFija, tipo, onClose }) {
  const [f, setF] = useState({ sucursal_id: sucursalId || sucursalFija || "", tipo, item_id: "", cantidad: "", minimo: "" });
  const [err, setErr] = useState("");
  const cat = f.tipo === "insumo" ? st.data.insumos : st.data.productos;
  const usados = new Set(st.data.stock.filter(s => s.sucursal_id === f.sucursal_id && s.tipo === f.tipo).map(s => s.item_id));
  const disp = cat.filter(x => !usados.has(x.id)).sort((a, b) => a.nombre.localeCompare(b.nombre));
  const enviar = async e => {
    e.preventDefault();
    if (!f.sucursal_id || !f.item_id) return setErr("Elegí sucursal e ítem.");
    const q = parseNum(f.cantidad); if (!(q >= 0)) return setErr("Ingresá la cantidad actual.");
    const m = f.minimo === "" ? (d.ins[f.item_id]?.stock_minimo || 0) : parseNum(f.minimo);
    const ok = await guardar(() => api.set("stock", `${f.sucursal_id}__${f.tipo}__${f.item_id}`, { sucursal_id: f.sucursal_id, tipo: f.tipo, item_id: f.item_id, cantidad: q, stock_minimo: m || 0, actualizado: nowIso(), motivo: "Alta" }), "Ítem agregado al stock");
    if (ok) onClose();
  };
  return html`<${Modal} titulo="Agregar ítem al stock" onClose=${onClose}><form class="form" onSubmit=${enviar}>
    <div class="two">
      <label class="f" for="ns-s">Sucursal<select id="ns-s" class="in" value=${f.sucursal_id} disabled=${!esG} onChange=${e => setF({ ...f, sucursal_id: e.target.value, item_id: "" })}><option value="">Elegí una sucursal</option>${d.sucOrden.map(s => html`<option value=${s.id}>${s.nombre}</option>`)}</select></label>
      <label class="f" for="ns-t">Tipo<select id="ns-t" class="in" value=${f.tipo} onChange=${e => setF({ ...f, tipo: e.target.value, item_id: "" })}><option value="insumo">Insumo</option><option value="producto">Producto</option></select></label>
    </div>
    <label class="f" for="ns-i">Ítem del catálogo<select id="ns-i" class="in" value=${f.item_id} onChange=${e => setF({ ...f, item_id: e.target.value, minimo: String(d.ins[e.target.value]?.stock_minimo ?? "") })}><option value="">${disp.length ? "Elegí un ítem" : "Todos los ítems ya están en esta sucursal"}</option>${disp.map(x => html`<option value=${x.id}>${x.nombre}</option>`)}</select>
      ${esG && html`<span class="small" style="font-weight:400">¿Falta en la lista? Agregalo primero en Catálogo.</span>`}</label>
    <div class="two">
      <label class="f" for="ns-q">Cantidad actual<input id="ns-q" class="in num" inputmode="decimal" value=${f.cantidad} onInput=${e => setF({ ...f, cantidad: e.target.value })} /></label>
      <label class="f" for="ns-m">Mínimo<input id="ns-m" class="in num" inputmode="decimal" value=${f.minimo} onInput=${e => setF({ ...f, minimo: e.target.value })} /></label>
    </div>
    ${err && html`<span class="err">${err}</span>`}
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn sec" onClick=${onClose}>Cancelar</button><button class="btn">Agregar</button></div>
  </form><//>`;
}

export { Stock, AjusteStock, NuevoStock };
