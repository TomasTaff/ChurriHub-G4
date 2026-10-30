// Capa de datos de ChurriHub.
// Esta versión local guarda todo en el navegador (localStorage). Toda la app
// lee y escribe únicamente a través de `S`, `api` y `useStore`, así que para
// conectar un backend real (Base44, Supabase, una API propia) alcanza con
// reemplazar las funciones de este archivo manteniendo la misma interfaz.
import { useState, useEffect } from "preact/hooks";
import { generarDatosBase, USUARIOS } from "./generador.js";
import { hashClave, verificarClave, CLAVE_DEMO } from "../lib/auth.js";

const hoyLocal = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const datosIniciales = () => generarDatosBase(hoyLocal());

export const COLS = ["sucursales", "productos", "insumos", "proveedores", "stock", "compras", "cierres", "lotes", "usuarios"];
const KEY_DATOS = "churrihub:datos:v2";
const KEY_SESION = "churrihub:sesion";
const KEY_INTENTOS = "churrihub:intentos";
const HORAS_SESION = 12;          // sesión normal: se cierra al cerrar el navegador o a las 12 h
const DIAS_RECORDAR = 30;         // "Mantener la sesión iniciada"
const MAX_INTENTOS = 5, BLOQUEO_SEG = 60;

const vacio = () => Object.fromEntries(COLS.map(c => [c, []]));
const clonar = o => JSON.parse(JSON.stringify(o));

export const S = { estado: "cargando", modo: "local", data: vacio(), me: { id: null }, errores: [], ver: 0 };
const subs = new Set();
export const emitir = () => { S.ver++; subs.forEach(f => f(S.ver)); };

function leer(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
function escribir(key, valor) {
  try { localStorage.setItem(key, valor); return true; }
  catch (e) { S.errores = ["No se pudieron guardar los cambios en este navegador (almacenamiento lleno o bloqueado). Exportá una copia de seguridad desde Exportar."]; return false; }
}

// Las ventas ocupan casi todo el espacio: se guardan como arreglos cortos
// [fecha, producto, cantidad, precio, medio, canal] para entrar holgadas en localStorage.
const CAMPOS = ["f", "p", "q", "pu", "m", "c"];
const compacta = r => Object.keys(r).every(k => CAMPOS.includes(k) || r[k] == null);
function empaquetar(data) {
  return { ...data, lotes: data.lotes.map(l => ({ ...l, filas: (l.filas || []).map(r => compacta(r) ? CAMPOS.map(k => r[k] ?? null) : r) })) };
}
function desempaquetar(data) {
  if (!Array.isArray(data?.lotes)) return data;
  return { ...data, lotes: data.lotes.map(l => ({ ...l, filas: (l.filas || []).map(r => Array.isArray(r) ? Object.fromEntries(CAMPOS.map((k, i) => [k, r[i]]).filter(([, v]) => v != null)) : r) })) };
}

function normalizar(data) {
  const out = vacio();
  COLS.forEach(c => { if (Array.isArray(data?.[c])) out[c] = data[c]; });
  if (!out.usuarios.length) out.usuarios = clonar(USUARIOS);
  // Usuarios sin contraseña (datos de versiones anteriores o de demostración): se les asigna
  // la contraseña de demostración. Los que no son de la demo tendrán que cambiarla al entrar.
  out.usuarios = out.usuarios.map(u => u.clave ? u : { ...u, activo: u.activo !== false, clave: { ...hashClave(CLAVE_DEMO), demo: true }, debe_cambiar: !USUARIOS.some(x => x.id === u.id) });
  return out;
}

// ───── Sesión ─────
const ss = () => { try { return window.sessionStorage; } catch (e) { return null; } };
const ls = () => { try { return window.localStorage; } catch (e) { return null; } };
function leerSesion() {
  for (const st of [ss(), ls()]) {
    try { const v = JSON.parse(st?.getItem(KEY_SESION) || "null"); if (v?.id) return v; } catch (e) { }
  }
  return null;
}
function borrarSesion() { [ss(), ls()].forEach(st => { try { st?.removeItem(KEY_SESION); } catch (e) { } }); }
function usuarioValido(id) { const u = S.data.usuarios.find(x => x.id === id); return u && u.activo !== false ? u : null; }
function validarSesion() {
  const ses = leerSesion();
  if (!ses || ses.exp < Date.now() || !usuarioValido(ses.id)) { if (ses) borrarSesion(); S.me = { id: null }; return; }
  S.me = { id: ses.id, desde: ses.inicio };
}
function intentos() { try { return JSON.parse(ss()?.getItem(KEY_INTENTOS) || "{}"); } catch (e) { return {}; } }
function guardarIntentos(v) { try { ss()?.setItem(KEY_INTENTOS, JSON.stringify(v)); } catch (e) { } }

// Devuelve { ok: true } o { ok: false, error }.
export function iniciarSesion(email, clave, recordar = false) {
  const correo = String(email || "").trim().toLowerCase();
  if (!correo || !clave) return { ok: false, error: "Ingresá tu correo y tu contraseña." };
  const reg = intentos(), it = reg[correo] || { n: 0, hasta: 0 };
  if (it.hasta > Date.now()) return { ok: false, error: `Demasiados intentos fallidos. Probá de nuevo en ${Math.ceil((it.hasta - Date.now()) / 1000)} segundos.`, bloqueado: true };
  const u = S.data.usuarios.find(x => String(x.email || "").toLowerCase() === correo);
  if (!u || !verificarClave(clave, u.clave)) {
    const n = it.n + 1;
    reg[correo] = n >= MAX_INTENTOS ? { n: 0, hasta: Date.now() + BLOQUEO_SEG * 1000 } : { n, hasta: 0 };
    guardarIntentos(reg);
    const quedan = MAX_INTENTOS - n;
    return { ok: false, error: n >= MAX_INTENTOS ? `Demasiados intentos fallidos. Esperá ${BLOQUEO_SEG} segundos antes de volver a probar.` : `Correo o contraseña incorrectos.${quedan <= 2 ? ` Te quedan ${quedan} ${quedan === 1 ? "intento" : "intentos"}.` : ""}` };
  }
  if (u.activo === false) return { ok: false, error: "Tu usuario está desactivado. Consultá con la gerencia." };
  delete reg[correo]; guardarIntentos(reg);
  const ahora = Date.now();
  const ses = { id: u.id, inicio: new Date(ahora).toISOString(), exp: ahora + (recordar ? DIAS_RECORDAR * 864e5 : HORAS_SESION * 36e5) };
  borrarSesion();
  try { (recordar ? ls() : ss())?.setItem(KEY_SESION, JSON.stringify(ses)); } catch (e) { }
  S.me = { id: u.id, desde: ses.inicio };
  cambiar("usuarios", arr => arr.map(x => x.id === u.id ? { ...x, ultimo_ingreso: ses.inicio } : x));
  return { ok: true };
}

export function cerrarSesion() {
  borrarSesion();
  S.me = { id: null };
  try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { }
  emitir();
}

// Cambio de contraseña: la propia (pidiendo la actual) o la nueva tras una temporal.
export async function cambiarClave(id, nueva) {
  await api.update("usuarios", id, { clave: hashClave(nueva), debe_cambiar: false, clave_cambiada: new Date().toISOString() });
}
// Un gerente asigna una contraseña temporal: el usuario la tiene que cambiar al entrar.
export async function asignarClaveTemporal(id, temporal) {
  await api.update("usuarios", id, { clave: hashClave(temporal), debe_cambiar: true, clave_cambiada: new Date().toISOString() });
}
export { verificarClave };

export function iniciar() {
  const raw = leer(KEY_DATOS);
  let data = null;
  if (raw) { try { data = desempaquetar(JSON.parse(raw)); } catch (e) { S.errores = ["Los datos guardados estaban dañados; se cargaron los datos iniciales."]; } }
  S.data = normalizar(data || datosIniciales());
  // Primera vez, o usuarios que recibieron contraseña al migrar: guardar.
  if (!raw || S.data.usuarios.some(u => !data?.usuarios?.find(x => x.id === u.id)?.clave)) persistir();
  validarSesion();
  S.estado = "listo";
  emitir();
  // Si la app está abierta en otra pestaña, mantener ambas sincronizadas.
  window.addEventListener("storage", e => {
    if (e.key === KEY_DATOS && e.newValue) { try { S.data = normalizar(desempaquetar(JSON.parse(e.newValue))); controlarSesion(); emitir(); } catch (err) { } }
    // Cerrar sesión en una pestaña la cierra en las demás (sesiones "recordadas").
    if (e.key === KEY_SESION) { validarSesion(); emitir(); }
  });
  // Al volver a la pestaña, verificar que la sesión no haya vencido.
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && S.me.id) { const antes = S.me.id; validarSesion(); if (S.me.id !== antes) emitir(); } });
}

function persistir() { escribir(KEY_DATOS, JSON.stringify(empaquetar(S.data))); }
// Si el usuario de la sesión fue eliminado o desactivado, la sesión se cierra.
function controlarSesion() { if (S.me.id && !usuarioValido(S.me.id)) { borrarSesion(); S.me = { id: null }; } }
function cambiar(col, fn) { S.data = { ...S.data, [col]: fn(S.data[col]) }; persistir(); if (col === "usuarios") controlarSesion(); emitir(); }

export const api = {
  async set(col, id, data) { cambiar(col, arr => [...arr.filter(x => x.id !== id), { ...clonar(data), id }]); },
  async update(col, id, patch) {
    if (!S.data[col].some(x => x.id === id)) throw Object.assign(new Error("No existe el registro"), { code: "not_found" });
    cambiar(col, arr => arr.map(x => x.id === id ? { ...x, ...clonar(patch) } : x));
  },
  async del(col, id) { cambiar(col, arr => arr.filter(x => x.id !== id)); },
};


export function exportarRespaldo() {
  return JSON.stringify({ app: "ChurriHub", version: 2, exportado: new Date().toISOString(), data: empaquetar(S.data) });
}
export function importarRespaldo(texto) {
  let json;
  try { json = JSON.parse(texto); } catch (e) { throw new Error("El archivo no es un JSON válido."); }
  const data = desempaquetar(json?.data || json);
  if (!Array.isArray(data?.sucursales) || !Array.isArray(data?.lotes)) throw new Error("El archivo no parece una copia de seguridad de ChurriHub.");
  S.data = normalizar(data); persistir();
  controlarSesion();
  emitir();
}
export function restablecer() {
  S.data = normalizar(datosIniciales()); persistir();
  controlarSesion();
  emitir();
}

export function useStore() {
  const [, setV] = useState(0);
  useEffect(() => { const f = v => setV(v); subs.add(f); return () => subs.delete(f); }, []);
  return S;
}
