// Roles, módulos y páginas (RF-06, RF-11).
// El menú se arma solo con las páginas cuyo `roles` incluye el rol del usuario
// activo, y el ruteo en App.js redirige a Inicio cualquier página no permitida.
import { html } from "htm/preact";

export function rolEfectivo(st) {
  const u = st.data.usuarios.find(x => x.id === st.me.id);
  if (!u) return { rol: "Sin asignar", sucursal_id: null, nombre: null, id: null };
  return { rol: u.rol, sucursal_id: u.rol === "Gerente" ? null : (u.sucursal_id || null), nombre: u.nombre, id: u.id };
}

const G = "Gerente", E = "Encargado", EMP = "Empleado";

// Los 7 módulos del Enfoque de Implementación, con la descripción que muestra Inicio (RF-10).
export const MODULOS = [
  { id: "ventas-caja", label: "Ventas y caja", icon: "wallet", desc: "Detalle de ventas por sucursal, ventas manuales y cierres de caja diarios." },
  { id: "stock", label: "Stock e insumos", icon: "box", desc: "Existencias de insumos y productos, alertas de stock crítico, ajustes y catálogo." },
  { id: "compras", label: "Compras y proveedores", icon: "truck", desc: "Órdenes de compra, recepción de mercadería y alta de proveedores." },
  { id: "integracion", label: "Integración y sincronización", icon: "upload", desc: "Importación de ventas desde Excel y CSV, con historial de cargas." },
  { id: "reportes", label: "Reportes gerenciales", icon: "chart", desc: "Indicadores, comparativa entre sucursales, rankings y reporte semanal." },
  { id: "analytics", label: "Datos para Analytics", icon: "database", desc: "Modelo de datos consolidado listo para Power BI." },
  { id: "usuarios", label: "Usuarios y permisos", icon: "key", desc: "Alta de usuarios, invitaciones, roles y sucursal asignada." },
];

export const PAGINAS = [
  { id: "inicio", label: "Inicio", mod: null, roles: [G, E, EMP, "Sin asignar"], icon: "home" },
  { id: "ventas", label: "Ventas", mod: "ventas-caja", roles: [G, E], icon: "cart" },
  { id: "caja", label: "Cierres de caja", mod: "ventas-caja", roles: [G, E, EMP], icon: "wallet" },
  { id: "stock", label: "Stock", mod: "stock", roles: [G, E, EMP], icon: "box" },
  { id: "catalogo", label: "Catálogo y sucursales", mod: "stock", roles: [G], icon: "tag" },
  { id: "compras", label: "Órdenes de compra", mod: "compras", roles: [G, E], icon: "truck" },
  { id: "proveedores", label: "Proveedores", mod: "compras", roles: [G, E], icon: "users" },
  { id: "carga", label: "Importar ventas", mod: "integracion", roles: [G, E], icon: "upload" },
  { id: "reportes", label: "Reportes", mod: "reportes", roles: [G, E], icon: "chart" },
  { id: "semanal", label: "Reporte semanal", mod: "reportes", roles: [G, E], icon: "calendar" },
  { id: "exportar", label: "Exportar", mod: "reportes", roles: [G, E], icon: "download" },
  { id: "analytics", label: "Datos para Analytics", mod: "analytics", roles: [G], icon: "database" },
  { id: "usuarios", label: "Usuarios", mod: "usuarios", roles: [G], icon: "key" },
];

export const ICONS = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  cart: "M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6.2M9 20.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1zm8 0a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z",
  upload: "M12 16V4m0 0-4 4m4-4 4 4M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4",
  wallet: "M3 7a2 2 0 0 1 2-2h13v4M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2zm13 7h.01",
  box: "M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8",
  truck: "M3 6h11v10H3zM14 9h4l3 3v4h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  users: "M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm13 9v-1a4 4 0 0 0-3-3.9M16 4.1a3 3 0 0 1 0 5.8",
  chart: "M4 20V10m6 10V4m6 16v-7m4 7H2",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4m8-4v4",
  download: "M12 4v12m0 0 4-4m-4 4-4-4M4 20h16",
  tag: "M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9zM7.5 7.5h.01",
  key: "M15 7a4 4 0 1 1-3.9 4.9L3 20v-3l2-2h2v-2h2l1.1-1.1A4 4 0 0 1 15 7zm1.5 1.5h.01",
  database: "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zm0 0v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
  menu: "M4 7h16M4 12h16M4 17h16"
};
export const Icon = ({ n }) => html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d=${ICONS[n]} /></svg>`;
