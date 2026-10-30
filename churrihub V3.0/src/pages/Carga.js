import { html } from "htm/preact";
import { useState, useEffect, useMemo, useRef } from "preact/hooks";
import * as XLSX from "xlsx";
import { MEDIOS, CANALES, ars, fCorta, fFecha, fHora, hoy, nf, norm, nowIso, sumarDias, uid } from "../lib/util.js";
import { Empty, Suc, confirmar, guardar } from "../components/ui.js";
import { nombreUsuario } from "../lib/derivados.js";
import { canon, parseCsv, validarFilas } from "../lib/importacion.js";
import { descontarProductos } from "./Ventas.js";
import { api } from "../data/store.js";

// Lee el archivo como ArrayBuffer (con FileReader como respaldo para navegadores viejos).
const leerBuffer = file => file.arrayBuffer ? file.arrayBuffer() : new Promise((ok, mal) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => mal(r.error); r.readAsArrayBuffer(file); });
const leerTexto = file => file.text ? file.text() : new Promise((ok, mal) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => mal(r.error); r.readAsText(file); });

function Carga(c) {
  const { st, d, esG, sucursalId, sucursalFija } = c;
  const [suc, setSuc] = useState(sucursalId || sucursalFija || "");
  const [archivo, setArchivo] = useState(null); const [raw, setRaw] = useState(null); const [over, setOver] = useState(false);
  const [omitirDup, setOmitirDup] = useState(true); const [precioLista, setPrecioLista] = useState(false); const [resultado, setResultado] = useState(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const inp = useRef(null);
  useEffect(() => { if (!esG) setSuc(sucursalFija || ""); }, [sucursalFija]);
  const existentes = useMemo(() => new Set(d.ventas.map(v => [v.sucursal_id, v.f, v.p || norm(v.nombre), v.q, v.pu, v.m].join("|"))), [d]);
  const filas = useMemo(() => raw ? validarFilas(raw, { productos: st.data.productos, existentes, sucursalId: suc, sucursales: st.data.sucursales, usarPrecioLista: precioLista }) : null, [raw, suc, existentes, precioLista]);
  const setFilas = v => { if (!v) { setRaw(null); setArchivo(null); } };
  const procesar = async file => {
    setErr(""); setRaw(null); setResultado(null);
    if (!file) return;
    try {
      let raw;
      if (/\.csv$/i.test(file.name) || (file.type || "").includes("csv")) raw = parseCsv(await leerTexto(file));
      else if (/\.xlsx?$/i.test(file.name)) {
        const wb = XLSX.read(await leerBuffer(file), { type: "array" });
        raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { raw: true, defval: "" });
      } else throw new Error("Formato no soportado. Subí un archivo .csv, .xlsx o .xls.");
      if (!raw.length) throw new Error("El archivo no tiene filas de ventas. La primera fila tiene que ser el encabezado (Fecha, Producto, Cantidad, Precio Unitario, Medio de Pago).");
      if (!Object.keys(raw[0]).some(k => canon(k) === "producto")) throw new Error("No encontré la columna Producto. Revisá que la primera fila tenga los encabezados.");
      setArchivo(file.name); setRaw(raw);
    } catch (e) { setErr(e.message || "No se pudo leer el archivo."); }
  };
  const ejemplo = () => {
    const h = hoy(), a = sumarDias(h, -1);
    const csv = ["Fecha,Producto,Cantidad,Precio Unitario,Medio de Pago,Canal", `${fCorta(h)}/${h.slice(0, 4)},Churro simple,24,1100,Efectivo,Mostrador`, `${h},Churro relleno común,12,1500,Tarjeta,PedidosYa`, `${h},Café chico,6,"$ 4.300",QR,`, `${a},Coca Cola,4,3000,Mercado Pago,Delivery`, `${a},Medialunas,2,900,efectivo,`, `${a},Churro salado,8,,efectivo,`, `${a},Agua sin gas,0,2400,efectivo,`].join("\n");
    procesar(new File([csv], "ventas_ejemplo.csv", { type: "text/csv" }));
  };
  const validas = (filas || []).filter(r => !r.prob.length && !(omitirDup && r.dup));
  const conError = (filas || []).filter(r => r.prob.length);
  const dups = (filas || []).filter(r => r.dup);
  const confirmarCarga = async () => {
    if (!validas.length) return;
    setBusy(true);
    const porSuc = {}; validas.forEach(r => { (porSuc[r.sid] = porSuc[r.sid] || []).push(r.venta); });
    const ok = await guardar(async () => {
      for (const [sid, vs] of Object.entries(porSuc)) {
        for (let i = 0; i < vs.length; i += 2500) {
          const chunk = vs.slice(i, i + 2500).sort((a, b) => a.f.localeCompare(b.f));
          await api.set("lotes", `carga-${uid()}`, { sucursal_id: sid, tipo: "excel", nombre: archivo, creado: nowIso(), usuario_id: st.me.id, desde: chunk[0].f, hasta: chunk[chunk.length - 1].f, filas: chunk, errores: conError.slice(0, 50).map(r => `Fila ${r.fila}: ${r.prob.join(", ")}`), omitidas: omitirDup ? dups.length : 0 });
        }
        await descontarProductos(st, sid, vs);
      }
    }, `${validas.length} ventas guardadas`);
    setBusy(false);
    if (ok) { setResultado({ archivo, ok: validas.length, total: validas.reduce((a, r) => a + r.venta.q * r.venta.pu, 0), omitidas: omitirDup ? dups.length : 0, errores: conError.map(r => `Fila ${r.fila}: ${r.prob.join(", ")}`) }); setFilas(null); setArchivo(null); }
  };
  const lotes = st.data.lotes.filter(l => !sucursalId || l.sucursal_id === sucursalId).sort((a, b) => (b.creado || "").localeCompare(a.creado || ""));
  const borrarLote = async l => {
    if (!(await confirmar("Eliminar carga", `Se van a eliminar las ${l.filas.length} ventas de "${l.nombre}". El stock de productos no se repone automáticamente.`, "Eliminar carga"))) return;
    await guardar(() => api.del("lotes", l.id), "Carga eliminada");
  };
  return html`
    <div class="card"><div class="hd"><h3>Subir archivo de ventas</h3><span class="note">CSV o Excel con columnas Fecha, Producto, Cantidad, Precio Unitario y Medio de Pago</span></div><div class="bd form">
      ${esG && html`<label class="f" for="cg-suc" style="max-width:320px">Sucursal de las ventas<select id="cg-suc" class="in" value=${suc} onChange=${e => setSuc(e.target.value)}><option value="">Elegí una sucursal</option>${d.sucOrden.map(s => html`<option value=${s.id}>${s.nombre}</option>`)}</select><span class="small" style="font-weight:400">Si el archivo trae una columna Sucursal, se usa la de cada fila.</span></label>`}
      <div class=${"drop" + (over ? " over" : "")} tabindex="0" role="button" aria-label="Elegir archivo de ventas"
        onClick=${() => inp.current.click()} onKeyDown=${e => (e.key === "Enter" || e.key === " ") && inp.current.click()}
        onDragOver=${e => { e.preventDefault(); setOver(true); }} onDragLeave=${() => setOver(false)} onDrop=${e => { e.preventDefault(); setOver(false); procesar(e.dataTransfer.files[0]); }}>
        <b style="font-family:var(--f-display);font-size:15px">Arrastrá el archivo acá o hacé clic para elegirlo</b>
        <div class="small muted" style="margin-top:4px">.csv · .xlsx · .xls — se revisa antes de guardar</div>
        <input ref=${inp} id="cg-file" type="file" accept=".csv,.xlsx,.xls" hidden onChange=${e => { procesar(e.target.files[0]); e.target.value = ""; }} />
      </div>
      <div class="row between"><label class="row small" style="cursor:pointer"><input type="checkbox" id="cg-precio" checked=${precioLista} onChange=${e => setPrecioLista(e.target.checked)} /> Completar precios vacíos con el precio de lista del catálogo</label><button class="btn ghost sm" onClick=${ejemplo}>Probar con un archivo de ejemplo</button></div>
      ${err && html`<div class="banner bad">${err}</div>`}
    </div></div>
    ${filas && html`<div class="card"><div class="hd"><h3>Revisión de ${archivo}</h3>
      <div class="row"><span class="pill ok">${validas.length} para guardar</span>${conError.length > 0 && html`<span class="pill bad">${conError.length} con errores</span>`}${dups.length > 0 && html`<span class="pill warn">${dups.length} ya cargadas</span>`}</div></div>
      <div class="bd">
        ${(() => { const fs = filas.filter(r => r.venta.f && !r.prob.length).map(r => r.venta.f).sort(); const sucsArch = [...new Set(filas.map(r => r.sid).filter(Boolean))];
          return html`<dl class="dl" style="margin:0 0 12px;padding:10px 12px;background:var(--surface-2);border-radius:8px">
            <dt>Archivo</dt><dd>${archivo}</dd>
            <dt>Sucursal de destino</dt><dd>${sucsArch.length ? sucsArch.map(id => html`<${Suc} s=${d.suc[id]} /> `) : html`<span class="err">Elegí la sucursal arriba</span>`}</dd>
            <dt>Período cubierto</dt><dd>${fs.length ? `${fFecha(fs[0])} al ${fFecha(fs[fs.length - 1])}` : "—"}</dd>
            <dt>Filas leídas</dt><dd class="num">${filas.length}</dd>
          </dl>`; })()}
        ${dups.length > 0 && html`<label class="row small" style="margin-bottom:10px;cursor:pointer"><input type="checkbox" id="cg-dup" checked=${omitirDup} onChange=${e => setOmitirDup(e.target.checked)} /> Omitir las ${dups.length} filas que ya están cargadas (misma sucursal, fecha, producto, cantidad, precio y medio)</label>`}
        <div class="tablewrap" style="max-height:420px;overflow:auto;border:1px solid var(--line);border-radius:8px"><table>
          <thead><tr><th>Fila</th><th>Estado</th><th>Fecha</th><th>Sucursal</th><th>Producto</th><th class="r">Cant.</th><th class="r">P. unit.</th><th>Pago</th><th>Canal</th></tr></thead>
          <tbody>${filas.map(r => html`<tr class=${r.prob.length ? "crit" : ""}>
            <td class="num muted">${r.fila}</td>
            <td>${r.prob.length ? html`<span class="pill bad">${r.prob.join(", ")}</span>` : r.dup ? html`<span class="pill warn">ya cargada</span>` : html`<span class="pill ok">ok</span>`}${r.precioCat && html` <span class="pill mute">precio de lista</span>`}${r.nuevoProd && !r.prob.length && html` <span class="pill warn">fuera de catálogo</span>`}</td>
            <td class="num">${r.venta.f ? fFecha(r.venta.f) : "—"}</td><td>${r.sid ? html`<${Suc} s=${d.suc[r.sid]} />` : "—"}</td><td>${r.nombre || "—"}</td>
            <td class="r num">${isNaN(r.venta.q) ? "—" : nf(r.venta.q)}</td><td class="r num">${isNaN(r.venta.pu) ? "—" : ars(r.venta.pu)}</td><td class="small">${MEDIOS[r.venta.m]}</td><td class="small">${CANALES[r.venta.c]}</td></tr>`)}</tbody></table></div>
        <div class="row between" style="margin-top:12px"><span class="muted">Total a guardar: <b class="num" style="color:var(--fg)">${ars(validas.reduce((a, r) => a + r.venta.q * r.venta.pu, 0))}</b></span>
          <div class="row"><button class="btn sec" onClick=${() => { setFilas(null); setArchivo(null); }}>Descartar</button><button class="btn" disabled=${!validas.length || busy} onClick=${confirmarCarga}>${busy ? "Guardando…" : `Guardar ${validas.length} ventas`}</button></div></div>
      </div></div>`}
    ${resultado && html`<div class="card" role="status"><div class="hd"><h3>Resultado de la importación</h3><button class="x" aria-label="Cerrar resultado" onClick=${() => setResultado(null)}>×</button></div><div class="bd" style="display:grid;gap:8px">
      <div class="row"><span class="pill ok">${resultado.ok} registros procesados</span>${resultado.errores.length > 0 && html`<span class="pill bad">${resultado.errores.length} filas con errores</span>`}${resultado.omitidas > 0 && html`<span class="pill warn">${resultado.omitidas} omitidas por estar repetidas</span>`}</div>
      <p class="small muted" style="margin:0">${resultado.archivo} · total importado <b class="num">${ars(resultado.total)}</b>. Las filas válidas se guardaron aunque otras tuvieran errores.</p>
      ${resultado.errores.length > 0 && html`<div style="max-height:160px;overflow:auto;background:var(--bad-soft);border-radius:8px;padding:8px 12px" class="small">${resultado.errores.map(e => html`<div>${e}</div>`)}</div>`}
    </div></div>`}
    <div class="card"><div class="hd"><h3>Historial de cargas</h3><span class="note">${lotes.length} cargas</span></div><div class="bd" style="padding:12px 0 0">
      ${lotes.length === 0 ? html`<${Empty} titulo="Todavía no se cargaron ventas">Subí el primer archivo arriba.<//>` : html`<div class="tablewrap"><table><thead><tr><th>Archivo</th><th>Sucursal</th><th>Cargado</th><th>Usuario</th><th>Período</th><th class="r">Ventas</th><th class="r">Total</th><th>Estado</th>${esG && html`<th></th>`}</tr></thead>
        <tbody>${lotes.slice(0, 60).map(l => html`<tr><td><b style="font-weight:600">${l.nombre}</b><div class="small muted">${{ excel: "Archivo", manual: "Carga manual", migracion: "Migración", base: "Datos de muestra", demo: "Ejemplo" }[l.tipo] || l.tipo}</div></td><td><${Suc} s=${d.suc[l.sucursal_id]} /></td><td class="small num">${fHora(l.creado)}</td><td class="small">${nombreUsuario(st, l.usuario_id)}</td>
          <td class="small num">${fFecha(l.desde)}${l.hasta !== l.desde ? " – " + fFecha(l.hasta) : ""}</td><td class="r num">${l.filas.length}</td><td class="r num">${ars(l.filas.reduce((a, r) => a + r.q * r.pu, 0))}</td>
          <td>${(l.errores || []).length ? html`<span class="pill warn" title=${l.errores.join("\n")}>${l.errores.length} filas rechazadas</span>` : html`<span class="pill ok">completa</span>`}</td>
          ${esG && html`<td class="r"><button class="btn ghost sm" onClick=${() => borrarLote(l)}>Eliminar</button></td>`}</tr>`)}</tbody></table></div>`}
    </div></div>`;
}

export { Carga };
