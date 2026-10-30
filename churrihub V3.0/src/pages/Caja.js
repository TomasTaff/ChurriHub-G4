import { html } from "htm/preact";
import { useState } from "preact/hooks";
import { DIAS, ars, fFecha, hoy, nowIso, parseF, sumarDias } from "../lib/util.js";
import { nombreUsuario } from "../lib/derivados.js";
import { Empty, Kpi, Modal, Suc, guardar } from "../components/ui.js";
import { parseNum } from "../lib/importacion.js";
import { api } from "../data/store.js";

function Caja(c) {
  const { st, d, rol, esG, sucursalId, sucursalFija } = c;
  const [desde, setDesde] = useState(sumarDias(hoy(), -30)); const [hasta, setHasta] = useState(hoy());
  const [edit, setEdit] = useState(null);
  const lista = st.data.cierres.filter(x => (!sucursalId || x.sucursal_id === sucursalId) && x.fecha >= desde && x.fecha <= hasta).sort((a, b) => b.fecha.localeCompare(a.fecha) || a.sucursal_id.localeCompare(b.sucursal_id));
  const efectivoDe = (sid, f) => d.ventas.filter(v => v.sucursal_id === sid && v.f === f && v.m === "efectivo").reduce((a, v) => a + v.total, 0);
  const tot = lista.reduce((a, x) => ({ i: a.i + x.ingresos, e: a.e + x.egresos }), { i: 0, e: 0 });
  // RF-16: cada usuario edita solo sus cierres; el gerente puede editar todos.
  const puedeEditar = x => esG || x.usuario_id === st.me.id;
  const verVentas = ["Gerente", "Encargado"].includes(rol.rol);
  return html`
    <div class="grid g3"><${Kpi} l="Ingresos declarados" v=${ars(tot.i)} s=${`${lista.length} cierres`} /><${Kpi} l="Egresos" v=${ars(tot.e)} /><${Kpi} l="Saldo" v=${ars(tot.i - tot.e)} /></div>
    <div class="card"><div class="hd">
      <div class="row"><label class="f" for="cj-d">Desde<input id="cj-d" class="in" type="date" value=${desde} max=${hasta} onChange=${e => setDesde(e.target.value)} /></label><label class="f" for="cj-h">Hasta<input id="cj-h" class="in" type="date" value=${hasta} min=${desde} onChange=${e => setHasta(e.target.value)} /></label></div>
      <button class="btn" onClick=${() => setEdit({})}>Registrar cierre</button>
    </div><div class="bd" style="padding:12px 0 0">
      ${lista.length === 0 ? html`<${Empty} titulo="No hay cierres en estas fechas">Registrá el cierre del día con el botón de arriba.<//>` : html`<div class="tablewrap"><table>
        <thead><tr><th>Fecha</th><th>Sucursal</th><th class="r">Ingresos</th><th class="r">Egresos</th><th class="r">Saldo</th>${verVentas && html`<th class="r">Ventas en efectivo</th><th class="r">Diferencia</th>`}<th>Observaciones</th><th>Cargado por</th><th></th></tr></thead>
        <tbody>${lista.map(x => { const ef = efectivoDe(x.sucursal_id, x.fecha), dif = x.ingresos - ef; return html`<tr>
          <td class="num" style="white-space:nowrap">${DIAS[parseF(x.fecha).getDay()]} ${fFecha(x.fecha)}</td><td><${Suc} s=${d.suc[x.sucursal_id]} /></td>
          <td class="r num">${ars(x.ingresos)}</td><td class="r num">${ars(x.egresos)}</td><td class="r num"><b>${ars(x.ingresos - x.egresos)}</b></td>
          ${verVentas && html`<td class="r num muted">${ef ? ars(ef) : "—"}</td><td class="r">${ef ? html`<span class=${"pill " + (Math.abs(dif) <= ef * 0.02 ? "ok" : "warn")}>${dif >= 0 ? "+" : "−"}${ars(Math.abs(dif))}</span>` : html`<span class="small muted">sin ventas</span>`}</td>`}
          <td class="small muted" style="max-width:220px">${x.observaciones || ""}</td>
          <td class="small">${nombreUsuario(st, x.usuario_id)}</td>
          <td class="r">${puedeEditar(x) ? html`<button class="btn ghost sm" onClick=${() => setEdit(x)}>Editar</button>` : html`<span class="small muted" title="Solo quien lo cargó o un gerente pueden editarlo">Bloqueado</span>`}</td></tr>`; })}</tbody></table></div>`}
    </div></div>
    ${verVentas && html`<p class="small muted" style="margin:0">La diferencia compara los ingresos declarados con las ventas en efectivo cargadas para ese día y sucursal. En verde, diferencias de hasta 2%.</p>`}
    ${edit && html`<${CierreForm} ...${c} cierre=${edit.id ? edit : null} efectivoDe=${efectivoDe} onClose=${() => setEdit(null)} />`}`;
}
function CierreForm({ st, d, esG, sucursalId, sucursalFija, cierre, efectivoDe, onClose, rol }) {
  const [f, setF] = useState(cierre ? { sucursal_id: cierre.sucursal_id, fecha: cierre.fecha, ingresos: String(cierre.ingresos), egresos: String(cierre.egresos), observaciones: cierre.observaciones || "" } : { sucursal_id: sucursalId || sucursalFija || "", fecha: hoy(), ingresos: "", egresos: "", observaciones: "" });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const id = f.sucursal_id && f.fecha ? `${f.sucursal_id}_${f.fecha}` : null;
  const existente = !cierre && id ? st.data.cierres.find(x => x.id === id) : null;
  const ef = f.sucursal_id ? efectivoDe(f.sucursal_id, f.fecha) : 0;
  const ingresos = parseNum(f.ingresos), egresos = f.egresos === "" ? 0 : parseNum(f.egresos);
  const enviar = async e => {
    e.preventDefault();
    if (!f.sucursal_id) return setErr("Elegí la sucursal.");
    if (f.fecha > hoy()) return setErr("No se puede cerrar una caja con fecha futura.");
    if (!(ingresos >= 0)) return setErr("Ingresá los ingresos del día (puede ser 0).");
    if (!(egresos >= 0)) return setErr("Los egresos no pueden ser negativos.");
    const ajeno = (cierre && cierre.id !== id ? st.data.cierres.find(x => x.id === id) : existente);
    if (ajeno && !esG && ajeno.usuario_id !== st.me.id) return setErr(`Ese día ya tiene un cierre cargado por ${nombreUsuario(st, ajeno.usuario_id)}. Solo esa persona o un gerente lo pueden modificar.`);
    setBusy(true);
    const base = cierre || existente;
    if (cierre && cierre.id !== id) { /* cambió fecha o sucursal */ }
    const ok = await guardar(async () => {
      await api.set("cierres", id, { sucursal_id: f.sucursal_id, fecha: f.fecha, ingresos, egresos, observaciones: f.observaciones.trim(), usuario_id: base?.usuario_id || st.me.id, creado: base?.creado || nowIso(), editado: base ? nowIso() : null });
      if (cierre && cierre.id !== id) await api.del("cierres", cierre.id);
    }, base ? "Cierre actualizado" : "Cierre registrado");
    setBusy(false); if (ok) onClose();
  };
  return html`<${Modal} titulo=${cierre ? "Editar cierre de caja" : "Registrar cierre de caja"} onClose=${onClose}><form class="form" onSubmit=${enviar}>
    <div class="two">
      <label class="f" for="cf-s">Sucursal<select id="cf-s" class="in" value=${f.sucursal_id} disabled=${!esG} onChange=${e => setF({ ...f, sucursal_id: e.target.value })}><option value="">Elegí una sucursal</option>${d.sucOrden.map(s => html`<option value=${s.id}>${s.nombre}</option>`)}</select></label>
      <label class="f" for="cf-f">Fecha<input id="cf-f" class="in" type="date" max=${hoy()} value=${f.fecha} onChange=${e => setF({ ...f, fecha: e.target.value })} /></label>
    </div>
    ${existente && html`<div class="banner">Ya hay un cierre para ${d.suc[f.sucursal_id]?.nombre} el ${fFecha(f.fecha)} (${ars(existente.ingresos)} de ingresos). Si guardás, lo vas a reemplazar.</div>`}
    <div class="two">
      <label class="f" for="cf-i">Ingresos en caja ($)<input id="cf-i" class="in num" inputmode="decimal" value=${f.ingresos} onInput=${e => setF({ ...f, ingresos: e.target.value })} /></label>
      <label class="f" for="cf-e">Egresos ($)<input id="cf-e" class="in num" inputmode="decimal" placeholder="0" value=${f.egresos} onInput=${e => setF({ ...f, egresos: e.target.value })} /></label>
    </div>
    <div class="row between small"><span class="muted">Saldo final: <b class="num" style="color:var(--fg)">${ars((ingresos || 0) - (egresos || 0))}</b></span>${["Gerente", "Encargado"].includes(rol.rol) && ef > 0 && html`<span class="muted">Ventas en efectivo cargadas ese día: <b class="num">${ars(ef)}</b></span>`}</div>
    <label class="f" for="cf-o">Observaciones<textarea id="cf-o" class="in" rows="2" placeholder="Ej.: faltante de cambio, pago a proveedor en efectivo…" value=${f.observaciones} onInput=${e => setF({ ...f, observaciones: e.target.value })}></textarea></label>
    ${err && html`<span class="err">${err}</span>`}
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn sec" onClick=${onClose}>Cancelar</button><button class="btn" disabled=${busy}>${busy ? "Guardando…" : "Guardar cierre"}</button></div>
  </form><//>`;
}

export { Caja, CierreForm };
