import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "node:path";

/**
 * `--mode demo`: single-file build with the operator brand swapped for a fictional one ("Nexa"),
 * used for the shareable claude.ai artifact. `__DEMO__` also swaps the logo images for a neutral mark.
 */
const BRAND_SWAPS: [RegExp, string][] = [
  [/Airtel Payments Bank/g, "Nexa Bank"],
  [/Airtel/g, "Nexa"],
  [/airtel/g, "nexa"],
];
const debrand = (): Plugin => ({
  name: "debrand",
  enforce: "pre",
  // Leave the operator logo files out of the demo bundle entirely.
  load(id) {
    if (/assets\/home\/(svc-logo\.png|svc-bank\.png|nba-prepaid\.svg|bn-manage\.svg)$/.test(id)) return 'export default ""';
    return null;
  },
  transform(code, id) {
    if (!/\/src\/.*\.tsx?$/.test(id)) return null;
    let out = code;
    for (const [re, to] of BRAND_SWAPS) out = out.replace(re, to);
    return { code: out, map: null };
  },
});

export default defineConfig(({ mode }) => ({
  base: "./",
  define: { __DEMO__: JSON.stringify(mode === "demo") },
  plugins: [...(mode === "demo" ? [debrand()] : []), react(), ...(mode === "single" || mode === "demo" ? [viteSingleFile()] : [])],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  build: { outDir: mode === "single" || mode === "demo" ? `dist-${mode}` : "dist", assetsInlineLimit: 100_000_000 },
}));
