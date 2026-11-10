#!/usr/bin/env node
// Exporta un diagrama Excalidraw (.excalidraw.md o .excalidraw) a SVG con trazo "a mano" (rough.js),
// para publicarlo en la guía web con el mismo aspecto que en Obsidian.
// Uso: node tools/exportar-svg.mjs <diagrama.excalidraw.md> <salida.svg>
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Excalifont (SIL OFL 1.1, ver tools/fonts/Excalifont-LICENCIA.txt), incrustada: un SVG usado como <img> no carga fuentes externas.
const FUENTE = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "fonts", "Excalifont-Regular-latin.woff2")).toString("base64");
import rough from "roughjs/bundled/rough.esm.js";

const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function cargar(ruta) {
  let txt = readFileSync(ruta, "utf8");
  if (ruta.endsWith(".md")) {
    const m = /```json\n([\s\S]*?)\n```/.exec(txt);
    if (!m) throw new Error("No encuentro el bloque ```json del dibujo");
    txt = m[1];
  }
  return JSON.parse(txt);
}

function rectRedondeado(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  return `M${x + r} ${y} L${x + w - r} ${y} Q${x + w} ${y} ${x + w} ${y + r} L${x + w} ${y + h - r} Q${x + w} ${y + h} ${x + w - r} ${y + h} ` +
    `L${x + r} ${y + h} Q${x} ${y + h} ${x} ${y + h - r} L${x} ${y + r} Q${x} ${y} ${x + r} ${y} Z`;
}

export function aSvg(escena) {
  const g = rough.generator();
  const E = escena.elements.filter((e) => !e.isDeleted);
  const minX = Math.min(...E.map((e) => e.x)) - 20;
  const minY = Math.min(...E.map((e) => e.y)) - 20;
  const maxX = Math.max(...E.map((e) => e.x + (e.type === "arrow" ? Math.max(0, ...e.points.map((p) => p[0])) : e.width))) + 20;
  const maxY = Math.max(...E.map((e) => e.y + (e.type === "arrow" ? Math.max(0, ...e.points.map((p) => p[1])) : e.height))) + 20;
  const out = [];
  // rough.js no lleva el discontinuo al SVG: se añade stroke-dasharray a los trazos (no a los rellenos)
  const dibujar = (drawable, extra = "", dash = "") => {
    for (const p of g.toPaths(drawable)) {
      const d = dash && p.stroke !== "none" ? dash : "";
      out.push(`<path d="${p.d}" stroke="${p.stroke}" stroke-width="${p.strokeWidth}" fill="${p.fill || "none"}"${extra}${d}/>`);
    }
  };
  for (const e of E) {
    if (e.type === "text") continue;
    const opts = {
      seed: e.seed, roughness: e.roughness ?? 1, stroke: e.strokeColor, strokeWidth: e.strokeWidth ?? 2,
      fill: e.backgroundColor === "transparent" ? undefined : e.backgroundColor, fillStyle: e.fillStyle === "solid" ? "solid" : "hachure",
      strokeLineDash: e.strokeStyle === "dashed" ? [8, 6] : undefined,
    };
    const op = e.opacity != null && e.opacity < 100 ? ` opacity="${e.opacity / 100}"` : "";
    const dash = e.strokeStyle === "dashed" ? ` stroke-dasharray="8 6"` : "";
    if (e.type === "rectangle") dibujar(g.path(rectRedondeado(e.x, e.y, e.width, e.height, 14), opts), op, dash);
    else if (e.type === "ellipse") dibujar(g.ellipse(e.x + e.width / 2, e.y + e.height / 2, e.width, e.height, opts), op, dash);
    else if (e.type === "diamond") {
      const cx = e.x + e.width / 2, cy = e.y + e.height / 2;
      dibujar(g.polygon([[cx, e.y], [e.x + e.width, cy], [cx, e.y + e.height], [e.x, cy]], opts), op, dash);
    } else if (e.type === "arrow" || e.type === "line") {
      const pts = e.points.map(([px, py]) => [e.x + px, e.y + py]);
      // Con más de dos puntos (flecha oblicua del generador) se dibuja curva, como en Excalidraw
      dibujar(pts.length > 2 ? g.curve(pts, { ...opts, fill: undefined }) : g.linearPath(pts, { ...opts, fill: undefined }), "", dash);
      if (e.endArrowhead || e.startArrowhead) {
        const puntas = [];
        if (e.endArrowhead) puntas.push([pts[pts.length - 2], pts[pts.length - 1]]);
        if (e.startArrowhead) puntas.push([pts[1], pts[0]]);
        for (const [[x1, y1], [x2, y2]] of puntas) {
          const ang = Math.atan2(y2 - y1, x2 - x1), L = 14;
          for (const s of [-1, 1]) {
            const a = ang + Math.PI - s * 0.45;
            dibujar(g.line(x2, y2, x2 + L * Math.cos(a), y2 + L * Math.sin(a), { ...opts, fill: undefined, strokeLineDash: undefined }));
          }
        }
      }
    }
  }
  for (const e of E.filter((x) => x.type === "text")) {
    const fs = e.fontSize || 20;
    const centro = e.textAlign === "center";
    const x = centro ? e.x + e.width / 2 : e.x;
    e.text.split("\n").forEach((linea, i) => {
      out.push(`<text x="${x}" y="${e.y + fs * (i + 0.9) * 1.25}" font-size="${fs}" fill="#1e1e1e" font-family="Excalifont, 'Segoe Print', cursive, sans-serif" text-anchor="${centro ? "middle" : "start"}">${esc(linea)}</text>`);
    });
  }
  const W = maxX - minX, H = maxY - minY;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${W} ${H}" width="${W}" height="${H}" role="img">\n<style>@font-face{font-family:Excalifont;src:url(data:font/woff2;base64,${FUENTE}) format("woff2");}</style>\n${out.join("\n")}\n</svg>\n`;
}

if (process.argv[1]?.endsWith("exportar-svg.mjs")) {
  const [entrada, salida] = process.argv.slice(2);
  if (!entrada || !salida) { console.error("Uso: node tools/exportar-svg.mjs <diagrama.excalidraw.md> <salida.svg>"); process.exit(1); }
  writeFileSync(salida, aSvg(cargar(entrada)));
  console.log(`OK ${salida}`);
}
