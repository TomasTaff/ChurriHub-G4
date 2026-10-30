// Autenticación de ChurriHub (versión local).
// Las contraseñas nunca se guardan en texto: se guarda un hash SHA-256 con sal aleatoria
// por usuario, aplicado ITERACIONES veces (estiramiento de clave). Se usa una
// implementación propia de SHA-256 para que funcione también cuando la app se abre
// por http desde otra máquina de la red, donde el navegador no habilita crypto.subtle.
//
// Importante: al correr todo en el navegador, esto separa usuarios y privilegios para el
// uso diario, pero no reemplaza la validación en un servidor (ver README, "Seguridad").

export const CLAVE_DEMO = "churri2026";
export const ITERACIONES = 4000;
export const MIN_LARGO = 8;

// ───── SHA-256 (FIPS 180-4) ─────
const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);
const W = new Uint32Array(64);
const rotr = (x, n) => (x >>> n) | (x << (32 - n));

export function sha256(bytes) {
  const largo = bytes.length, bits = largo * 8;
  const total = ((largo + 9 + 63) >> 6) << 6;
  const m = new Uint8Array(total);
  m.set(bytes); m[largo] = 0x80;
  const dv = new DataView(m.buffer);
  dv.setUint32(total - 4, bits >>> 0); dv.setUint32(total - 8, Math.floor(bits / 2 ** 32));
  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a, h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  for (let o = 0; o < total; o += 64) {
    for (let i = 0; i < 16; i++) W[i] = dv.getUint32(o + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(W[i - 15], 7) ^ rotr(W[i - 15], 18) ^ (W[i - 15] >>> 3);
      const s1 = rotr(W[i - 2], 17) ^ rotr(W[i - 2], 19) ^ (W[i - 2] >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + W[i]) | 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0; h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
  }
  const out = new Uint8Array(32), ov = new DataView(out.buffer);
  [h0, h1, h2, h3, h4, h5, h6, h7].forEach((v, i) => ov.setUint32(i * 4, v >>> 0));
  return out;
}

const utf8 = s => typeof TextEncoder !== "undefined" ? new TextEncoder().encode(s) : Uint8Array.from(unescape(encodeURIComponent(s)), c => c.charCodeAt(0));
const hex = b => Array.from(b, x => x.toString(16).padStart(2, "0")).join("");
const unir = (a, b) => { const r = new Uint8Array(a.length + b.length); r.set(a); r.set(b, a.length); return r; };

function aleatorio(n) {
  const b = new Uint8Array(n);
  if (globalThis.crypto?.getRandomValues) crypto.getRandomValues(b);
  else for (let i = 0; i < n; i++) b[i] = Math.floor(Math.random() * 256);
  return b;
}

// ───── Hash y verificación ─────
export function hashClave(clave, sal = hex(aleatorio(16)), iter = ITERACIONES) {
  const s = utf8(sal);
  let h = sha256(unir(s, utf8(clave)));
  for (let i = 1; i < iter; i++) h = sha256(unir(h, s));
  return { sal, hash: hex(h), iter };
}

// Comparación de tiempo constante para no filtrar información por la duración.
function iguales(a, b) {
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
export function verificarClave(clave, guardada) {
  if (!guardada?.hash || !guardada?.sal) return false;
  return iguales(hashClave(clave, guardada.sal, guardada.iter || ITERACIONES).hash, guardada.hash);
}

// Reglas mínimas para contraseñas nuevas.
export function problemaClave(clave, { email, nombre } = {}) {
  if (!clave || clave.length < MIN_LARGO) return `La contraseña tiene que tener al menos ${MIN_LARGO} caracteres.`;
  if (!/[a-záéíóúñ]/i.test(clave) || !/\d/.test(clave)) return "Combiná letras y números.";
  const low = clave.toLowerCase();
  if (email && low.includes(String(email).split("@")[0].toLowerCase())) return "No uses tu correo como contraseña.";
  if (nombre && String(nombre).toLowerCase().split(/\s+/).some(p => p.length > 3 && low.includes(p))) return "No uses tu nombre en la contraseña.";
  if (low === CLAVE_DEMO) return "Elegí una contraseña distinta de la de demostración.";
  return null;
}

// Contraseña temporal legible (sin caracteres que se confunden como 0/O o 1/l).
export function generarClaveTemporal() {
  const letras = "abcdefghjkmnpqrstuvwxyz", nums = "23456789";
  const b = aleatorio(10);
  const parte = (alf, i, n) => Array.from({ length: n }, (_, k) => alf[b[i + k] % alf.length]).join("");
  return `${parte(letras, 0, 4)}-${parte(nums, 4, 4)}`;
}
