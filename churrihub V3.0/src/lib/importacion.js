import { hoy, isoLocal, norm, pad, slug } from "./util.js";

function parseCsv(text) {
  text = String(text).replace(/^﻿/, "");
  const primera = text.split(/\r?\n/)[0] || ""; const sep = (primera.match(/;/g) || []).length > (primera.match(/,/g) || []).length ? ";" : ",";
  const rows = []; let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; } else field += c; }
    else if (c === '"') q = true; else if (c === sep) { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(field); field = ""; if (row.some(x => x.trim())) rows.push(row); row = []; }
    else field += c;
  }
  row.push(field); if (row.some(x => x.trim())) rows.push(row);
  if (rows.length < 2) return [];
  const h = rows[0]; return rows.slice(1).map(r => Object.fromEntries(h.map((k, i) => [k, r[i] ?? ""])));
}
const ALIAS = { fecha: ["fecha", "date", "dia"], producto: ["producto", "product", "articulo", "item", "descripcion"], cantidad: ["cantidad", "cant", "qty", "quantity", "unidades"], precio: ["precio unitario", "precio_unitario", "precio", "p unit", "unit price", "precio x unidad"], medio: ["medio de pago", "medio_pago", "medio pago", "forma de pago", "pago", "payment"], sucursal: ["sucursal", "local", "branch"], total: ["total", "importe"], canal: ["canal", "canal de venta", "origen", "channel"] };
function canon(k) { const n = norm(k).replace(/[_.]/g, " ").replace(/\s+/g, " "); for (const [c, l] of Object.entries(ALIAS)) if (l.includes(n)) return c; return null; }
function normFecha(v) {
  if (v == null || v === "") return "";
  if (typeof v === "number") { const d = new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 864e5); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; }
  if (v instanceof Date) return isoLocal(v);
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/); if (m) { const y = m[3].length === 2 ? "20" + m[3] : m[3]; if (+m[2] > 12) return ""; return `${y}-${pad(m[2])}-${pad(m[1])}`; }
  return "";
}
function parseNum(v) {
  if (v === null || v === undefined || v === "") return NaN; if (typeof v === "number") return v;
  let s = String(v).trim().replace(/[^\d,.\-]/g, "");
  if (s.includes(",") && s.includes(".")) s = s.lastIndexOf(",") > s.lastIndexOf(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  else if (s.includes(",")) s = s.replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  return Number(s);
}
function canalDe(v) { const n = norm(v); if (!n) return "local"; if (/rappi|pedidos ?ya|app|uber/.test(n)) return "apps"; if (n.includes("deliv") || n.includes("envio") || n.includes("domicilio")) return "delivery"; return "local"; }
function medioDe(v) { const n = norm(v); if (!n) return "efectivo"; if (n.includes("efect") || n === "cash") return "efectivo"; if (n.includes("tarj") || n.includes("debit") || n.includes("credit") || n.includes("card")) return "tarjeta"; return "otro"; }
function emparejarProducto(nombre, productos) {
  const n = norm(nombre), sg = slug(nombre);
  return productos.find(p => p.id === sg || norm(p.nombre) === n || (p.alias || []).some(a => norm(a) === n)) || null;
}
function validarFilas(raw, ctx) {
  const { productos, existentes, sucursalId, sucursales, usarPrecioLista = false } = ctx; const out = [];
  raw.forEach((r0, i) => {
    const r = {}; Object.entries(r0 || {}).forEach(([k, v]) => { const c = canon(k); if (c && r[c] === undefined) r[c] = v; });
    const fila = i + 2, prob = [];
    const f = normFecha(r.fecha); if (!f) prob.push("fecha inválida");
    else if (f > hoy()) prob.push("fecha futura");
    const nombre = String(r.producto ?? "").trim(); if (!nombre) prob.push("falta producto");
    const p = nombre ? emparejarProducto(nombre, productos) : null;
    const q = parseNum(r.cantidad); if (!(q > 0)) prob.push("cantidad inválida");
    let pu = parseNum(r.precio); let precioCat = false;
    if (isNaN(pu) && !isNaN(parseNum(r.total)) && q > 0) pu = parseNum(r.total) / q;
    // RF-33: el precio unitario es obligatorio. Solo se completa con el de lista si el usuario lo pide.
    if (isNaN(pu) && usarPrecioLista && p && p.precio > 0) { pu = p.precio; precioCat = true; }
    if (isNaN(pu) || pu < 0) prob.push("falta precio");
    let sid = sucursalId;
    if (r.sucursal) { const s = sucursales.find(x => norm(x.nombre) === norm(r.sucursal) || x.id === slug(r.sucursal)); if (s) sid = s.id; }
    if (!sid) prob.push("sin sucursal");
    const m = medioDe(r.medio);
    const c = canalDe(r.canal);
    const venta = { f, p: p ? p.id : null, pn: p ? null : nombre, q, pu: Math.round(pu * 100) / 100, m, c };
    const clave = [sid, f, venta.p || norm(nombre), q, venta.pu, m].join("|");
    const dup = !prob.length && existentes.has(clave);
    out.push({ fila, venta, sid, nombre, prob, dup, nuevoProd: !p && !!nombre, precioCat, clave });
  });
  return out;
}

export { parseCsv, ALIAS, canon, normFecha, parseNum, medioDe, canalDe, emparejarProducto, validarFilas };
