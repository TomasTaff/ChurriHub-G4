// Inicio de sesión, cambio de contraseña obligatorio (tras una temporal) y cambio voluntario.
import { html } from "htm/preact";
import { useState, useRef } from "preact/hooks";
import { iniciarSesion, cerrarSesion, cambiarClave, verificarClave } from "../data/store.js";
import { problemaClave, CLAVE_DEMO, MIN_LARGO } from "../lib/auth.js";
import { SelectorTema } from "../lib/tema.js";
import { Modal, toast } from "../components/ui.js";

const OJO = "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z";
const OJO_NO = "M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.1 4M6.6 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2";

function CampoClave({ id, label, value, onInput, autocomplete, autoFocus }) {
  const [ver, setVer] = useState(false);
  return html`<label class="f" for=${id}>${label}
    <span class="clave">
      <input id=${id} class="in" type=${ver ? "text" : "password"} autocomplete=${autocomplete} value=${value} onInput=${onInput} autofocus=${autoFocus} />
      <button type="button" class="ver" aria-label=${ver ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed=${ver} onClick=${() => setVer(!ver)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d=${ver ? OJO_NO : OJO} /></svg>
      </button>
    </span></label>`;
}

function Marca() {
  return html`<aside class="login-marca">
    <img src="logo-tuchurrito.png" alt="Logo de Tuchurrito" width="150" height="134" />
    <h1>ChurriHub</h1>
    <p class="tag">Gestión de sucursales de Tu Churrito</p>
    <p class="txt">Ventas, caja, stock, compras y reportes de todas las sucursales en un solo lugar.</p>
  </aside>`;
}

export function Login({ st }) {
  const [email, setEmail] = useState(""); const [clave, setClave] = useState(""); const [recordar, setRecordar] = useState(false);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [olvido, setOlvido] = useState(false);
  const demo = st.data.usuarios.filter(u => u.clave?.demo && u.activo !== false && u.email);
  const ref = useRef(null);
  const enviar = e => {
    e.preventDefault(); setBusy(true); setErr("");
    // El hash tarda unas decenas de ms: se deja pintar el estado "Ingresando…" antes.
    setTimeout(() => { const r = iniciarSesion(email, clave, recordar); setBusy(false); if (!r.ok) { setErr(r.error); setClave(""); } }, 30);
  };
  const usarDemo = u => { setEmail(u.email); setClave(CLAVE_DEMO); setErr(""); ref.current?.querySelector("button[type=submit]")?.focus(); };
  return html`<div class="login">
    <div class="login-tema"><${SelectorTema} /></div>
    <${Marca} />
    <main class="login-panel">
      <form class="login-card" ref=${ref} onSubmit=${enviar} noValidate>
        <div><h2>Iniciar sesión</h2><p class="muted" style="margin:4px 0 0">Ingresá con el correo que te dio de alta la gerencia.</p></div>
        <label class="f" for="login-email">Correo electrónico
          <input id="login-email" class="in" type="email" inputmode="email" autocomplete="username" value=${email} onInput=${e => setEmail(e.target.value)} autofocus />
        </label>
        <${CampoClave} id="login-clave" label="Contraseña" value=${clave} onInput=${e => setClave(e.target.value)} autocomplete="current-password" />
        <div class="row between small">
          <label class="row" style="gap:6px;cursor:pointer"><input type="checkbox" id="login-recordar" checked=${recordar} onChange=${e => setRecordar(e.target.checked)} /> Mantener la sesión iniciada</label>
          <button type="button" class="btn ghost sm" onClick=${() => setOlvido(!olvido)}>¿Olvidaste tu contraseña?</button>
        </div>
        ${olvido && html`<div class="banner info small">Pedile a un gerente que te asigne una contraseña temporal desde <b>Usuarios</b>. Al ingresar con ella vas a elegir una nueva.</div>`}
        ${err && html`<div class="banner bad small" role="alert">${err}</div>`}
        <button type="submit" class="btn login-btn" disabled=${busy}>${busy ? "Ingresando…" : "Ingresar"}</button>
        ${recordar && html`<p class="small muted" style="margin:0">Usalo solo en una computadora personal: la sesión queda abierta ${30} días.</p>`}
      </form>
      ${demo.length > 0 && html`<details class="login-demo">
        <summary>Usuarios de demostración</summary>
        <p class="small muted">Contraseña de todos: <code>${CLAVE_DEMO}</code>. Tocá uno para completar el formulario. Esta lista desaparece cuando cada usuario cambia su contraseña.</p>
        <div class="demo-lista">${demo.map(u => html`<button type="button" class="demo-u" onClick=${() => usarDemo(u)}>
          <b>${u.nombre}</b><span>${u.rol}${u.sucursal_id ? " · " + (st.data.sucursales.find(s => s.id === u.sucursal_id)?.nombre || "") : ""}</span><small>${u.email}</small>
        </button>`)}</div>
      </details>`}
    </main>
  </div>`;
}

// Pantalla obligatoria cuando el usuario entra con una contraseña temporal.
export function CambioObligatorio({ usuario }) {
  const [nueva, setNueva] = useState(""); const [rep, setRep] = useState(""); const [err, setErr] = useState("");
  const enviar = async e => {
    e.preventDefault();
    const p = problemaClave(nueva, usuario); if (p) return setErr(p);
    if (verificarClave(nueva, usuario.clave)) return setErr("Tiene que ser distinta de la contraseña temporal.");
    if (nueva !== rep) return setErr("Las contraseñas no coinciden.");
    await cambiarClave(usuario.id, nueva); toast("Contraseña actualizada. ¡Bienvenido!");
  };
  return html`<div class="login">
    <div class="login-tema"><${SelectorTema} /></div>
    <${Marca} />
    <main class="login-panel">
      <form class="login-card" onSubmit=${enviar} noValidate>
        <div><h2>Elegí tu contraseña</h2><p class="muted" style="margin:4px 0 0">Hola ${usuario.nombre}. Ingresaste con una contraseña temporal: elegí una nueva para seguir.</p></div>
        <${CampoClave} id="nueva-clave" label="Nueva contraseña" value=${nueva} onInput=${e => setNueva(e.target.value)} autocomplete="new-password" autoFocus />
        <${CampoClave} id="nueva-clave-2" label="Repetí la contraseña" value=${rep} onInput=${e => setRep(e.target.value)} autocomplete="new-password" />
        <p class="small muted" style="margin:0">Al menos ${MIN_LARGO} caracteres, con letras y números.</p>
        ${err && html`<div class="banner bad small" role="alert">${err}</div>`}
        <button type="submit" class="btn login-btn">Guardar y entrar</button>
        <button type="button" class="btn ghost" onClick=${cerrarSesion}>Salir</button>
      </form>
    </main>
  </div>`;
}

// Cambio voluntario desde la barra lateral.
export function CambiarClave({ usuario, onClose }) {
  const [actual, setActual] = useState(""); const [nueva, setNueva] = useState(""); const [rep, setRep] = useState(""); const [err, setErr] = useState("");
  const enviar = async e => {
    e.preventDefault();
    if (!verificarClave(actual, usuario.clave)) return setErr("La contraseña actual no es correcta.");
    const p = problemaClave(nueva, usuario); if (p) return setErr(p);
    if (nueva === actual) return setErr("La nueva contraseña tiene que ser distinta de la actual.");
    if (nueva !== rep) return setErr("Las contraseñas no coinciden.");
    await cambiarClave(usuario.id, nueva); toast("Contraseña actualizada"); onClose();
  };
  return html`<${Modal} titulo="Cambiar contraseña" onClose=${onClose}><form class="form" onSubmit=${enviar} noValidate>
    <${CampoClave} id="cc-actual" label="Contraseña actual" value=${actual} onInput=${e => setActual(e.target.value)} autocomplete="current-password" autoFocus />
    <div class="two">
      <${CampoClave} id="cc-nueva" label="Nueva contraseña" value=${nueva} onInput=${e => setNueva(e.target.value)} autocomplete="new-password" />
      <${CampoClave} id="cc-rep" label="Repetí la nueva" value=${rep} onInput=${e => setRep(e.target.value)} autocomplete="new-password" />
    </div>
    <p class="small muted" style="margin:0">Al menos ${MIN_LARGO} caracteres, con letras y números.</p>
    ${err && html`<span class="err" role="alert">${err}</span>`}
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn sec" onClick=${onClose}>Cancelar</button><button class="btn">Guardar</button></div>
  </form><//>`;
}
