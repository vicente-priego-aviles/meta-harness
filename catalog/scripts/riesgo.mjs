#!/usr/bin/env node
// Calcula el nivel de riesgo (0, 1 o 2) de un cambio a partir de los archivos tocados.
// Lo decide este script, nunca el agente (ADR-0006).
//
// Uso:  node .mh/scripts/riesgo.mjs [--base <rama>] [--json] [archivo ...]
//       Sin archivos: usa el diff de la rama actual frente a la base + cambios sin commit.
// La tabla por defecto se puede ampliar en .mh.json → "riesgo": { "nivel2": [...], "nivel0": [...], "contenido2": [...] }
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { git, leerConfig } from "../hooks/lib/comun.mjs";

export const TABLA = {
  nivel0: ["brain/**", "docs/**", "**/*.md", "**/*.excalidraw.md", "**/*.base"],
  nivel2: [
    "**/*.bpmn", "**/*.dmn", "**/*.form",
    "**/db/migration/**", "**/db/changelog/**", "**/*.sql",
    "**/*SecurityConfig*", "**/security/**",
    "**/application-prod.*", "**/application-pro.*",
    "**/pom.xml", "**/build.gradle", "**/build.gradle.kts",
    ".github/**", ".gitlab-ci.yml", "Jenkinsfile",
    ".claude/**", ".mh/**", ".mh.json", "CLAUDE.md",
    "**/*.env", "**/.env*", "**/*secret*", "**/*credential*",
  ],
  // Patrones de contenido que suben a 2 un archivo de nivel 1.
  contenido2: [
    "PasswordEncoder", "BCrypt", "MessageDigest", "Cipher\\.", "KeyStore",
    "@PreAuthorize", "@Secured", "SecurityFilterChain",
    "ALTER TABLE", "DROP TABLE", "CREATE TABLE",
    "zeebe:taskDefinition", "camunda:",
  ],
};

/** Convierte un glob sencillo (**, *, ?) en RegExp. */
export function globARegex(glob) {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*" && glob[i + 1] === "*") {
      const barra = glob[i + 2] === "/";
      re += barra ? "(?:.*/)?" : ".*";
      i += barra ? 2 : 1;
    } else if (c === "*") re += "[^/]*";
    else if (c === "?") re += "[^/]";
    else re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${re}$`);
}

const coincide = (ruta, globs) => globs.some((g) => globARegex(g).test(ruta));

export function tabla(config = {}) {
  const extra = config.riesgo || {};
  return {
    nivel0: [...TABLA.nivel0, ...(extra.nivel0 || [])],
    nivel2: [...TABLA.nivel2, ...(extra.nivel2 || [])],
    contenido2: [...TABLA.contenido2, ...(extra.contenido2 || [])],
  };
}

/** Riesgo de un archivo: { nivel, motivo }. `leer` devuelve el texto cambiado o "" (inyectable para tests). */
export function riesgoArchivo(ruta, t, leer = () => "") {
  ruta = ruta.split("\\").join("/"); // Windows
  if (coincide(ruta, t.nivel2)) return { nivel: 2, motivo: "ruta sensible" };
  if (coincide(ruta, t.nivel0)) return { nivel: 0, motivo: "documentación" };
  const txt = leer(ruta);
  const patron = t.contenido2.find((p) => new RegExp(p).test(txt));
  if (patron) return { nivel: 2, motivo: `contenido sensible (${patron})` };
  return { nivel: 1, motivo: "código" };
}

export function evaluar(rutas, config = {}, leer = () => "") {
  const t = tabla(config);
  const detalle = rutas.map((r) => ({ ruta: r, ...riesgoArchivo(r, t, leer) }));
  const nivel = detalle.reduce((m, d) => Math.max(m, d.nivel), 0);
  return { nivel, archivos: detalle };
}

export function ramaBase(raiz, pedida) {
  if (pedida) return pedida;
  const origen = git(raiz, ["symbolic-ref", "--quiet", "--short", "refs/remotes/origin/HEAD"]);
  if (origen) return origen;
  for (const r of ["main", "master"]) if (git(raiz, ["rev-parse", "--verify", "--quiet", r])) return r;
  return "";
}

export function archivosCambiados(raiz, base) {
  const set = new Set();
  const add = (txt) => txt.split("\n").map((s) => s.trim()).filter(Boolean).forEach((s) => set.add(s));
  if (base) {
    const mb = git(raiz, ["merge-base", base, "HEAD"]);
    if (mb) add(git(raiz, ["diff", "--name-only", `${mb}...HEAD`]));
  }
  add(git(raiz, ["diff", "--name-only", "HEAD"]));
  add(git(raiz, ["ls-files", "--others", "--exclude-standard"]));
  return [...set].filter((r) => !r.startsWith(".mh/tmp/"));
}

/** Texto cambiado de un archivo (diff frente a la base, o el archivo entero si es nuevo). */
export function textoCambiado(raiz, base, ruta) {
  const mb = base ? git(raiz, ["merge-base", base, "HEAD"]) : "";
  const diff = git(raiz, ["diff", "-U0", mb || "HEAD", "--", ruta]);
  if (diff) return diff.split("\n").filter((l) => /^[+-][^+-]/.test(l)).join("\n");
  const p = join(raiz, ruta);
  try { return existsSync(p) ? readFileSync(p, "utf8").slice(0, 200_000) : ""; } catch { return ""; }
}

function main() {
  const args = process.argv.slice(2);
  const raiz = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const json = args.includes("--json");
  const iBase = args.indexOf("--base");
  const baseArg = iBase >= 0 ? args[iBase + 1] : undefined;
  const rutas = args.filter((a, i) => !a.startsWith("--") && !(iBase >= 0 && i === iBase + 1));
  const base = ramaBase(raiz, baseArg);
  const archivos = rutas.length ? rutas : archivosCambiados(raiz, base);
  const res = evaluar(archivos, leerConfig(raiz), (r) => textoCambiado(raiz, base, r));
  if (json) return console.log(JSON.stringify(res, null, 1));
  console.log(`Riesgo ${res.nivel} (${archivos.length} archivos)`);
  for (const d of res.archivos.filter((x) => x.nivel === res.nivel).slice(0, 15)) console.log(`  ${d.nivel}  ${d.ruta}  — ${d.motivo}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) main();
