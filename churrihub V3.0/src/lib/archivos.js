// Utilidades para generar y descargar archivos desde el navegador.

// CSV con BOM para que Excel respete los acentos.
export function aCsv(rows) {
  if (!rows.length) return "";
  const h = Object.keys(rows[0]);
  const esc = v => { const s = v == null ? "" : String(v); return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  return "﻿" + [h.join(","), ...rows.map(r => h.map(k => esc(r[k])).join(","))].join("\n");
}

export function descargar(nombre, contenido, tipo) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = document.createElement("a");
  a.href = url; a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
