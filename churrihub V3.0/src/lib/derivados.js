function derivar(data) {
  const prod = Object.fromEntries(data.productos.map(p => [p.id, p]));
  const ins = Object.fromEntries(data.insumos.map(p => [p.id, p]));
  const suc = Object.fromEntries(data.sucursales.map(p => [p.id, p]));
  const prov = Object.fromEntries(data.proveedores.map(p => [p.id, p]));
  const ventas = [];
  data.lotes.forEach(l => (l.filas || []).forEach((r, i) => ventas.push({ ...r, c: r.c || "local", total: r.q * r.pu, sucursal_id: l.sucursal_id, lote_id: l.id, idx: i, nombre: prod[r.p]?.nombre || r.pn || r.p || "Producto sin nombre", categoria: prod[r.p]?.categoria || "—" })));
  ventas.sort((a, b) => a.f < b.f ? 1 : a.f > b.f ? -1 : 0);
  const sucOrden = [...data.sucursales].sort((a, b) => a.nombre.localeCompare(b.nombre));
  return { prod, ins, suc, prov, ventas, sucOrden };
}
const nombreItem = (d, s) => s.tipo === "producto" ? (d.prod[s.item_id]?.nombre || s.item_id) : (d.ins[s.item_id]?.nombre || s.item_id);
const unidadItem = (d, s) => s.tipo === "producto" ? (d.prod[s.item_id]?.unidad || "unidad") : (d.ins[s.item_id]?.unidad || "");
const esCritico = s => (s.stock_minimo || 0) > 0 && s.cantidad <= s.stock_minimo;
function metricas(v) {
  const total = v.reduce((a, x) => a + x.total, 0), unidades = v.reduce((a, x) => a + x.q, 0);
  const dias = new Set(v.map(x => x.f + x.sucursal_id)).size;
  // Cada registro de venta cuenta como una transacción (RF-27).
  return { total, unidades, lineas: v.length, transacciones: v.length, ticket: v.length ? total / v.length : 0, dias, promDia: dias ? total / dias : 0, precioProm: unidades ? total / unidades : 0 };
}
function topProductos(v, n = 8, por = "total") {
  const m = {}; v.forEach(x => { const k = x.p || x.nombre; m[k] = m[k] || { nombre: x.nombre, q: 0, total: 0 }; m[k].q += x.q; m[k].total += x.total; });
  return Object.values(m).sort((a, b) => b[por] - a[por] || b.total - a.total).slice(0, n);
}
function agrupar(v, clave) { const m = {}; v.forEach(x => { const k = clave(x); m[k] = (m[k] || 0) + x.total; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); }
const nombreUsuario = (st, id) => !id ? "—" : (st.data.usuarios.find(u => u.id === id)?.nombre || "Usuario eliminado");
const pct = (a, b) => b ? ((a - b) / b) * 100 : null;

export { derivar, nombreItem, unidadItem, esCritico, metricas, topProductos, agrupar, nombreUsuario, pct };
