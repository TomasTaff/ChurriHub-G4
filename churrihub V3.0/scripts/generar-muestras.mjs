// Genera los informes de ventas de muestra de la carpeta /muestras:
//   node scripts/generar-muestras.mjs
// Son ventas de diciembre 2025 (antes de los datos de base, que arrancan en enero 2026),
// así se pueden importar sin que choquen con lo que ya está cargado.
import * as XLSX from "xlsx";
import { writeFileSync, mkdirSync } from "node:fs";
import { PRODUCTOS, ventasDelDia } from "../src/data/generador.js";

const nombre = Object.fromEntries(PRODUCTOS.map(p => [p.id, p.nombre]));
const MEDIO = { efectivo: "Efectivo", tarjeta: "Tarjeta de débito", otro: "Mercado Pago QR" };
const CANAL = { local: "Mostrador", apps: "PedidosYa", delivery: "Delivery propio" };
const dmy = f => f.split("-").reverse().join("/");
const dias = Array.from({ length: 31 }, (_, i) => `2025-12-${String(i + 1).padStart(2, "0")}`);
const filasDe = suc => dias.flatMap(f => ventasDelDia(suc, f, { referenciaPrecios: "2026-10-01" }))
  .map(v => [dmy(v.f), nombre[v.p], v.q, v.pu, v.c === "apps" ? "PedidosYa (pago en app)" : MEDIO[v.m], CANAL[v.c]]);
const ENC = ["Fecha", "Producto", "Cantidad", "Precio Unitario", "Medio de Pago", "Canal"];
mkdirSync(new URL("../muestras/", import.meta.url), { recursive: true });

// 1) Wilde en Excel (.xlsx), sin errores.
const wilde = filasDe("wilde");
const ws = XLSX.utils.aoa_to_sheet([ENC, ...wilde]);
ws["!cols"] = [{ wch: 11 }, { wch: 34 }, { wch: 9 }, { wch: 15 }, { wch: 24 }, { wch: 16 }];
const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Ventas diciembre");
XLSX.writeFile(wb, new URL("../muestras/ventas_wilde_diciembre_2025.xlsx", import.meta.url).pathname);

// 2) Miramar en CSV separado por punto y coma (como lo exporta Excel en español), con
//    algunas filas con problemas para mostrar la validación de la importación.
const miramar = filasDe("miramar");
miramar.splice(40, 0, ["12/12/2025", "Churro salado", 6, "", "Efectivo", "Mostrador"]);          // falta precio
miramar.splice(120, 0, ["18/12/2025", "Medialunas", 4, 900, "Efectivo", "Mostrador"]);           // fuera de catálogo
miramar.splice(260, 0, ["31/13/2025", "Café chico", 2, 3600, "Tarjeta de débito", "Mostrador"]); // fecha inválida
miramar.splice(400, 0, ["24/12/2025", "Coca-Cola", 0, 2450, "Efectivo", "Mostrador"]);           // cantidad cero
const esc = v => /[;"\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
writeFileSync(new URL("../muestras/ventas_miramar_diciembre_2025.csv", import.meta.url), "﻿" + [ENC, ...miramar].map(r => r.map(esc).join(";")).join("\r\n"));

const total = rs => rs.reduce((a, r) => a + (Number(r[2]) || 0) * (Number(r[3]) || 0), 0);
console.log(`Wilde: ${wilde.length} filas, $${Math.round(total(wilde)).toLocaleString("es-AR")}`);
console.log(`Miramar: ${miramar.length} filas (3 con errores y 1 producto fuera de catálogo), $${Math.round(total(miramar)).toLocaleString("es-AR")}`);
