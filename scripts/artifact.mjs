// Turns the single-file demo build into an artifact page body (the artifact host adds its own <html>/<head>/<body>).
import { readFileSync, writeFileSync } from "node:fs";
const [src, out] = process.argv.slice(2);
let html = readFileSync(src, "utf8");
html = html.replace(/<!doctype html>/i, "").replace(/<\/?html[^>]*>/gi, "").replace(/<\/?head>/gi, "").replace(/<\/?body>/gi, "");
html = html.replace(/<meta charset[^>]*>/i, "").replace(/<meta name="viewport"[^>]*>/i, "");
writeFileSync(out, html.trim() + "\n");
