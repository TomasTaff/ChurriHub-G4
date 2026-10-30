import { defineConfig } from "vite";

// La app no necesita plugins: los componentes usan plantillas `html` de htm,
// que el navegador entiende sin transpilar JSX.
// base "./" usa rutas relativas: el mismo build funciona en la raíz de un dominio
// o en una subcarpeta como https://usuario.github.io/churrihub/ (GitHub Pages).
export default defineConfig({
  base: "./",
  server: { port: 5173, open: true },
  build: { outDir: "dist", sourcemap: true },
});
