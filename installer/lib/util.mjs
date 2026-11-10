// Utilidades del instalador (sin dependencias).
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

export const RAIZ_MH = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const CATALOGO = join(RAIZ_MH, "catalog");
export const VERSION = JSON.parse(readFileSync(join(RAIZ_MH, "package.json"), "utf8")).version;

export const sha256 = (txt) => createHash("sha256").update(txt).digest("hex");
export const hashArchivo = (ruta) => sha256(readFileSync(ruta));

/** JSON canónico: claves ordenadas, para que el id del plan sea estable. */
export function canonico(valor) {
  if (Array.isArray(valor)) return `[${valor.map(canonico).join(",")}]`;
  if (valor && typeof valor === "object") {
    return `{${Object.keys(valor).sort().map((k) => `${JSON.stringify(k)}:${canonico(valor[k])}`).join(",")}}`;
  }
  return JSON.stringify(valor);
}

export const leer = (ruta, porDefecto = "") => {
  try { return readFileSync(ruta, "utf8"); } catch { return porDefecto; }
};

export function escribir(ruta, contenido) {
  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, contenido);
}

export function git(dir, args) {
  try {
    return execFileSync("git", args, { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch { return ""; }
}

/** Descripción del frontmatter de un SKILL.md o agente. */
export function descripcion(ruta) {
  const m = /^description:\s*(.*)$/m.exec(leer(ruta));
  return m ? m[1].trim() : "";
}

export const esManual = (rutaSkill) => /^disable-model-invocation:\s*true/m.test(leer(rutaSkill));

/** Lista de archivos (rutas relativas) bajo un directorio. */
export function listar(dir, base = dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? listar(p, base) : [relative(base, p)];
  });
}

export function copiarDir(origen, destino) {
  mkdirSync(dirname(destino), { recursive: true });
  cpSync(origen, destino, { recursive: true, force: true });
}

export function esEnlaceA(ruta, destinoEsperado) {
  try {
    return lstatSync(ruta).isSymbolicLink() && readlinkSync(ruta) === destinoEsperado;
  } catch { return false; }
}

export const existe = (p) => { try { lstatSync(p); return true; } catch { return false; } };
export const esDir = (p) => { try { return statSync(p).isDirectory(); } catch { return false; } };

/** Añade líneas a un archivo de texto sin duplicarlas y respetando el salto de línea final (requisito R1). */
export function anadirLineas(ruta, lineas) {
  let txt = leer(ruta);
  const actuales = new Set(txt.split("\n").map((l) => l.trim()));
  const nuevas = lineas.filter((l) => !actuales.has(l.trim()));
  if (!nuevas.length) return false;
  if (txt && !txt.endsWith("\n")) txt += "\n";
  escribir(ruta, `${txt}${nuevas.join("\n")}\n`);
  return true;
}

export function rellenar(texto, valores) {
  return texto.replace(/\{\{(\w+)\}\}/g, (m, k) => (k in valores ? valores[k] : m));
}

export const hoy = () => new Date().toISOString().slice(0, 10);
