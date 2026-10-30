// Usuarios y permisos: RF-06 a RF-09, más contraseñas y estado de cada cuenta.
import { html } from "htm/preact";
import { useState } from "preact/hooks";
import { api, asignarClaveTemporal } from "../data/store.js";
import { norm, ROLES, emailValido, nowIso, fFecha, fHora } from "../lib/util.js";
import { PAGINAS } from "../lib/permisos.js";
import { generarClaveTemporal, hashClave } from "../lib/auth.js";
import { Modal, Suc, Empty, confirmar, guardar, toast } from "../components/ui.js";

const copiar = async (texto, idCampo) => {
  try { await navigator.clipboard.writeText(texto); toast("Copiado"); }
  catch (e) { const t = document.getElementById(idCampo); t?.select?.(); toast("Seleccioné el texto: copialo con Ctrl+C"); }
};

export function Usuarios({ st, d }) {
  const [ed, setEd] = useState(null); const [inv, setInv] = useState(null); const [cred, setCred] = useState(null);
  const lista = [...st.data.usuarios].sort((a, b) => (a.activo === false) - (b.activo === false) || ROLES.indexOf(a.rol) - ROLES.indexOf(b.rol) || a.nombre.localeCompare(b.nombre));
  const gerentesActivos = st.data.usuarios.filter(u => u.rol === "Gerente" && u.activo !== false).length;
  const borrar = async u => {
    if (u.id === st.me.id) return toast("No podés eliminar tu propio usuario.", "bad");
    if (u.rol === "Gerente" && u.activo !== false && gerentesActivos <= 1) return toast("Tiene que quedar al menos un gerente activo.", "bad");
    if (await confirmar("Eliminar usuario", `Se va a eliminar a ${u.nombre} y ya no va a poder ingresar. Los registros que cargó se conservan. Si solo querés bloquearle el acceso, desactivalo desde Editar.`, "Eliminar")) {
      await guardar(() => api.del("usuarios", u.id), "Usuario eliminado");
    }
  };
  const restablecer = async u => {
    if (!(await confirmar("Restablecer contraseña", `Se va a generar una contraseña temporal para ${u.nombre}. La actual deja de funcionar y, al ingresar, va a tener que elegir una nueva.`, "Generar contraseña temporal"))) return;
    const temporal = generarClaveTemporal();
    if (await guardar(() => asignarClaveTemporal(u.id, temporal), "Contraseña temporal generada")) setCred({ u, temporal });
  };
  const estado = u => u.activo === false ? html`<span class="pill mute">Desactivado</span>`
    : u.debe_cambiar ? html`<span class="pill warn" title="Tiene una contraseña temporal">Clave temporal</span>`
    : html`<span class="pill ok">Activo</span>`;
  return html`
    <div class="banner info" style="display:block">Cada persona ingresa con su correo y su contraseña. Al crear un usuario o restablecer su contraseña se genera una <b>contraseña temporal</b>: pasásela por un medio aparte (WhatsApp, en persona) y al primer ingreso va a tener que elegir una propia.</div>
    <div class="card"><div class="hd"><h3>Usuarios</h3><button class="btn" onClick=${() => setEd({})}>Nuevo usuario</button></div><div class="bd" style="padding:12px 0 0">
      ${lista.length === 0 ? html`<${Empty} titulo="No hay usuarios">Creá el primero.<//>` : html`<div class="tablewrap"><table>
        <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Sucursal</th><th>Estado</th><th>Último ingreso</th><th></th></tr></thead>
        <tbody>${lista.map(u => html`<tr style=${u.activo === false ? "opacity:.65" : ""}>
          <td><b style="font-weight:600">${u.nombre}</b>${u.id === st.me.id && html` <span class="pill mute">vos</span>`}</td>
          <td class="small" style="word-break:break-all">${u.email || html`<span class="pill bad">Falta correo</span>`}</td>
          <td><span class=${"pill " + (u.rol === "Gerente" ? "ok" : u.rol === "Encargado" ? "warn" : "mute")}>${u.rol}</span></td>
          <td>${u.rol === "Gerente" ? html`<span class="small muted">Todas</span>` : u.sucursal_id ? html`<${Suc} s=${d.suc[u.sucursal_id]} />` : html`<span class="pill bad">Sin sucursal</span>`}</td>
          <td>${estado(u)}</td>
          <td class="small num">${u.ultimo_ingreso ? fHora(u.ultimo_ingreso) : html`<span class="muted">Nunca</span>`}</td>
          <td class="r" style="white-space:nowrap">
            <button class="btn ghost sm" disabled=${!u.email || u.activo === false} onClick=${() => setInv(u)}>Invitar</button>
            ${u.id !== st.me.id && html`<button class="btn ghost sm" disabled=${u.activo === false} onClick=${() => restablecer(u)}>Contraseña</button>`}
            <button class="btn ghost sm" onClick=${() => setEd(u)}>Editar</button>
            ${u.id !== st.me.id && html`<button class="btn ghost sm" style="color:var(--bad)" onClick=${() => borrar(u)}>Eliminar</button>`}
          </td>
        </tr>`)}</tbody></table></div>`}
    </div></div>
    <div class="card"><div class="hd"><h3>Qué puede hacer cada rol</h3></div><div class="bd"><div class="tablewrap"><table>
      <thead><tr><th>Sección</th><th>Gerente</th><th>Encargado</th><th>Empleado</th></tr></thead>
      <tbody>${PAGINAS.filter(p => p.id !== "inicio").map(p => html`<tr><td>${p.label}</td>${ROLES.map(r => html`<td>${p.roles.includes(r) ? html`<span class="pill ok">Sí</span>` : html`<span class="muted">—</span>`}</td>`)}</tr>`)}</tbody></table></div>
      <p class="small muted" style="margin:10px 0 0">Encargados y empleados ven solo su sucursal. El gerente ve todas y puede filtrar. Los cambios de rol o sucursal se aplican de inmediato.</p></div></div>
    ${inv && html`<${Invitacion} d=${d} u=${inv} onClose=${() => setInv(null)} />`}
    ${cred && html`<${Credenciales} ...${cred} onClose=${() => setCred(null)} />`}
    ${ed && html`<${UsuarioForm} st=${st} d=${d} usuario=${ed.id ? ed : null} gerentesActivos=${gerentesActivos} onCreado=${c => setCred(c)} onClose=${() => setEd(null)} />`}`;
}

function UsuarioForm({ st, d, usuario, gerentesActivos, onCreado, onClose }) {
  const [f, setF] = useState({ nombre: usuario?.nombre || "", email: usuario?.email || "", rol: usuario?.rol || "", sucursal_id: usuario?.sucursal_id || "", activo: usuario ? usuario.activo !== false : true });
  const [temporal] = useState(() => generarClaveTemporal());
  const [err, setErr] = useState("");
  const soyYo = usuario?.id === st.me.id;
  const enviar = async e => {
    e.preventDefault();
    // RF-07: nombre, correo y rol son obligatorios.
    if (!f.nombre.trim()) return setErr("Poné un nombre.");
    if (!f.email.trim()) return setErr("El correo electrónico es obligatorio.");
    if (!emailValido(f.email)) return setErr("Revisá el correo electrónico: no tiene un formato válido.");
    if (st.data.usuarios.some(u => u.id !== usuario?.id && norm(u.email) === norm(f.email))) return setErr("Ya hay un usuario con ese correo.");
    if (!f.rol) return setErr("Elegí el rol del usuario.");
    if (st.data.usuarios.some(u => u.id !== usuario?.id && norm(u.nombre) === norm(f.nombre))) return setErr("Ya hay un usuario con ese nombre.");
    if (f.rol !== "Gerente" && !f.sucursal_id) return setErr("Elegí la sucursal del usuario.");
    const dejaDeSerGerenteActivo = usuario?.rol === "Gerente" && usuario.activo !== false && (f.rol !== "Gerente" || !f.activo);
    if (dejaDeSerGerenteActivo && gerentesActivos <= 1) return setErr("Tiene que quedar al menos un gerente activo.");
    if (soyYo && (f.rol !== usuario.rol || !f.activo)) return setErr("No podés cambiar tu propio rol ni desactivarte. Pedíselo a otro gerente.");
    const data = { nombre: f.nombre.trim(), email: f.email.trim().toLowerCase(), rol: f.rol, sucursal_id: f.rol === "Gerente" ? null : f.sucursal_id, activo: f.activo };
    if (usuario) {
      if (await guardar(() => api.update("usuarios", usuario.id, data), "Usuario actualizado")) onClose();
      return;
    }
    const nuevo = { ...data, id: "u-" + Date.now().toString(36), clave: hashClave(temporal), debe_cambiar: true, creado: nowIso() };
    if (await guardar(() => api.set("usuarios", nuevo.id, nuevo), "Usuario creado")) { onClose(); onCreado({ u: nuevo, temporal }); }
  };
  return html`<${Modal} titulo=${usuario ? "Editar usuario" : "Nuevo usuario"} onClose=${onClose}><form class="form" onSubmit=${enviar} noValidate>
    <div class="two">
      <label class="f" for="us-n">Nombre<input id="us-n" class="in" value=${f.nombre} onInput=${e => setF({ ...f, nombre: e.target.value })} /></label>
      <label class="f" for="us-e">Correo electrónico (usuario de ingreso)<input id="us-e" class="in" type="email" autocomplete="off" value=${f.email} onInput=${e => setF({ ...f, email: e.target.value })} /></label>
    </div>
    <div class="two">
      <label class="f" for="us-r">Rol<select id="us-r" class="in" value=${f.rol} disabled=${soyYo} onChange=${e => setF({ ...f, rol: e.target.value })}><option value="" disabled>Elegí un rol</option>${ROLES.map(r => html`<option value=${r}>${r}</option>`)}</select></label>
      <label class="f" for="us-s">Sucursal<select id="us-s" class="in" value=${f.rol === "Gerente" ? "" : f.sucursal_id} disabled=${f.rol === "Gerente"} onChange=${e => setF({ ...f, sucursal_id: e.target.value })}><option value="">${f.rol === "Gerente" ? "Todas" : "Elegí una sucursal"}</option>${d.sucOrden.map(s => html`<option value=${s.id}>${s.nombre}</option>`)}</select></label>
    </div>
    ${usuario ? html`<label class="row small" style="cursor:pointer;gap:6px"><input type="checkbox" id="us-activo" checked=${f.activo} disabled=${soyYo} onChange=${e => setF({ ...f, activo: e.target.checked })} /> Usuario activo (si lo desactivás, no puede ingresar)</label>`
      : html`<p class="small muted" style="margin:0">Al guardar se genera una contraseña temporal para el primer ingreso.</p>`}
    ${err && html`<span class="err" role="alert">${err}</span>`}
    <div class="row" style="justify-content:flex-end"><button type="button" class="btn sec" onClick=${onClose}>Cancelar</button><button class="btn">Guardar</button></div>
  </form><//>`;
}

// Se muestra una sola vez, al crear el usuario o restablecer su contraseña.
function Credenciales({ u, temporal, onClose }) {
  const texto = `ChurriHub — ${location.origin + location.pathname}\nUsuario: ${u.email}\nContraseña temporal: ${temporal}\nAl ingresar te va a pedir que elijas una nueva.`;
  return html`<${Modal} titulo="Contraseña temporal" onClose=${onClose}>
    <div class="form">
      <p style="margin:0">Pasale estos datos a <b>${u.nombre}</b>. Por seguridad, la contraseña temporal <b>no se vuelve a mostrar</b>.</p>
      <div class="cred">
        <div><span class="muted">Usuario</span><code>${u.email}</code></div>
        <div><span class="muted">Contraseña temporal</span><code id="cred-clave">${temporal}</code></div>
      </div>
      <textarea id="cred-texto" class="in" rows="4" readonly value=${texto}></textarea>
      <div class="row" style="justify-content:flex-end"><button class="btn sec" onClick=${() => copiar(texto, "cred-texto")}>Copiar datos</button><button class="btn" onClick=${onClose}>Listo</button></div>
    </div>
  <//>`;
}

// RF-08: invitación por correo. No incluye la contraseña: esa se pasa por otro medio.
function Invitacion({ d, u, onClose }) {
  const enlace = location.origin + location.pathname;
  const asunto = "Te invitamos a ChurriHub";
  const cuerpo = `Hola ${u.nombre}:\n\nTe damos acceso a ChurriHub, el sistema de gestión de Tu Churrito, con el rol ${u.rol}${u.sucursal_id ? ` en la sucursal ${d.suc[u.sucursal_id]?.nombre}` : ""}.\n\nIngresá desde este enlace: ${enlace}\nTu usuario es: ${u.email}\n\nLa contraseña temporal te la pasamos por otro medio. La primera vez que entres te va a pedir que elijas una nueva.\n\nSaludos,\nGerencia de Tu Churrito`;
  const mailto = `mailto:${encodeURIComponent(u.email)}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
  const marcar = () => guardar(() => api.update("usuarios", u.id, { invitado: nowIso() }), "Invitación registrada");
  return html`<${Modal} titulo=${"Invitar a " + u.nombre} onClose=${onClose}>
    <div class="form">
      <label class="f" for="inv-para">Para<input id="inv-para" class="in" readonly value=${u.email} /></label>
      <label class="f" for="inv-txt">Mensaje<textarea id="inv-txt" class="in" rows="10" readonly value=${cuerpo}></textarea></label>
      ${u.invitado && html`<p class="small muted" style="margin:0">Última invitación registrada: ${fFecha(u.invitado.slice(0, 10))}.</p>`}
      <div class="row" style="justify-content:flex-end">
        <button class="btn sec" onClick=${() => copiar(cuerpo, "inv-txt")}>Copiar mensaje</button>
        <a class="btn" href=${mailto} onClick=${marcar}>Abrir en el correo</a>
      </div>
    </div>
  <//>`;
}
