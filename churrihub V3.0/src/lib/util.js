const pad = n => String(n).padStart(2, "0");
const isoLocal = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const hoy = () => isoLocal(new Date());
const parseF = f => { const [y, m, d] = String(f).slice(0, 10).split("-").map(Number); return new Date(y, m - 1, d); };
const sumarDias = (f, n) => { const d = parseF(f); d.setDate(d.getDate() + n); return isoLocal(d); };
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const fFecha = f => { if (!f) return "—"; const d = parseF(f); return `${pad(d.getDate())} ${MESES[d.getMonth()]} ${d.getFullYear()}`; };
const fCorta = f => { const d = parseF(f); return `${d.getDate()}/${d.getMonth() + 1}`; };
const fHora = iso => { if (!iso) return "—"; const d = new Date(iso); return `${pad(d.getDate())} ${MESES[d.getMonth()]} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const nowIso = () => new Date().toISOString();

function rangoPeriodo(p, custom) {
  const h = hoy(), d = parseF(h);
  if (p === "hoy") return { desde: h, hasta: h, label: "Hoy" };
  if (p === "semana") return { desde: sumarDias(h, -6), hasta: h, label: "Últimos 7 días" };
  if (p === "mes") return { desde: isoLocal(new Date(d.getFullYear(), d.getMonth(), 1)), hasta: h, label: "Mes actual" };
  if (p === "anio") return { desde: `${d.getFullYear()}-01-01`, hasta: h, label: `Año ${d.getFullYear()}` };
  const desde = custom.desde || "2000-01-01", hasta = custom.hasta || h;
  return { desde, hasta, label: `${fFecha(desde)} – ${fFecha(hasta)}` };
}
function rangoAnterior(r) {
  const dias = Math.round((parseF(r.hasta) - parseF(r.desde)) / 864e5) + 1;
  return { desde: sumarDias(r.desde, -dias), hasta: sumarDias(r.desde, -1) };
}


const ars = v => "$" + Math.round(Number(v) || 0).toLocaleString("es-AR");
const nf = v => (Number(v) || 0).toLocaleString("es-AR", { maximumFractionDigits: 2 });
const norm = s => String(s ?? "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ");
const slug = s => norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const MEDIOS = { efectivo: "Efectivo", tarjeta: "Tarjeta", otro: "QR / transferencia" };
const ROLES = ["Gerente", "Encargado", "Empleado"];
// Canal de venta (RF-05). Las ventas sin canal se toman como venta en el local.
const CANALES = { local: "Mostrador", delivery: "Delivery propio", apps: "Apps de delivery" };
// Lunes de la semana de una fecha (semana lunes a domingo).
const lunesDe = f => { const d = parseF(f); const dow = (d.getDay() + 6) % 7; return sumarDias(f, -dow); };
const emailValido = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || "").trim());

export { pad, isoLocal, hoy, parseF, sumarDias, MESES, DIAS, fFecha, fCorta, fHora, nowIso, rangoPeriodo, rangoAnterior, ars, nf, norm, slug, uid, MEDIOS, ROLES, CANALES, lunesDe, emailValido };
