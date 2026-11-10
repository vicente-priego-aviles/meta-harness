// Utilidades comunes de los hooks del meta-harness.
// Reglas: sin dependencias, fallan en abierto (cualquier error => salir 0 sin decidir nada),
// mensajes en español y cada bloqueo explica cómo seguir.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const PERFILES = { minimal: 1, standard: 2, strict: 3 };

export function leerEntrada() {
  try {
    const txt = readFileSync(0, "utf8");
    return txt.trim() ? JSON.parse(txt) : {};
  } catch {
    return {};
  }
}

export function raizProyecto(entrada = {}) {
  return process.env.CLAUDE_PROJECT_DIR || entrada.cwd || process.cwd();
}

export function leerConfig(raiz) {
  const ruta = join(raiz, ".mh.json");
  const base = { perfil: "standard", desactivados: [], brain: "brain", riesgo: {} };
  try {
    return { ...base, ...JSON.parse(readFileSync(ruta, "utf8")) };
  } catch {
    return base;
  }
}

/** ¿Debe ejecutarse el hook `id` con nivel mínimo `nivel` según el perfil y los desactivados? */
export function activo(config, id, nivel = "standard") {
  const env = (process.env.MH_DESACTIVAR || "").split(",").map((s) => s.trim());
  if (env.includes(id) || (config.desactivados || []).includes(id)) return false;
  return (PERFILES[config.perfil] || 2) >= (PERFILES[nivel] || 2);
}

export function git(raiz, args) {
  try {
    return execFileSync("git", args, { cwd: raiz, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

export function salirJson(obj) {
  process.stdout.write(JSON.stringify(obj));
  process.exit(0);
}

export function decisionPreTool(decision, motivo, extra = {}) {
  salirJson({
    hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: decision, permissionDecisionReason: motivo, ...extra },
  });
}

export function contexto(evento, texto) {
  salirJson({ hookSpecificOutput: { hookEventName: evento, additionalContext: texto } });
}

/** Carpeta temporal del harness (ignorada por git) para marcadores de sesión. */
export function tmp(raiz) {
  const dir = join(raiz, ".mh", "tmp");
  try {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    // Se ignora a sí misma aunque el .gitignore del proyecto no la incluya.
    const gi = join(dir, ".gitignore");
    if (!existsSync(gi)) writeFileSync(gi, "*\n");
  } catch {}
  return dir;
}

/** Devuelve true solo la primera vez que se pide `clave` en esta sesión. */
export function primeraVez(raiz, sesion, clave) {
  const marca = join(tmp(raiz), `${clave}-${(sesion || "sin-sesion").slice(0, 36)}`);
  if (existsSync(marca)) return false;
  try {
    writeFileSync(marca, new Date().toISOString());
  } catch {}
  return true;
}

/** Ejecuta `fn` y, ante cualquier error, sale 0 sin decidir (fallo en abierto). */
export async function enAbierto(fn) {
  try {
    await fn();
  } catch (e) {
    if (process.env.MH_DEBUG) process.stderr.write(`[meta-harness] ${e?.stack || e}\n`);
  }
  process.exit(0);
}

/** Lee el frontmatter YAML simple (clave: valor) de un Markdown. */
export function frontmatter(texto) {
  const m = /^---\n([\s\S]*?)\n---/.exec(texto);
  const out = {};
  if (!m) return out;
  for (const linea of m[1].split("\n")) {
    const kv = /^([\w-]+):\s*(.*)$/.exec(linea);
    if (kv) out[kv[1]] = kv[2].replace(/^["']|["']$/g, "").trim();
  }
  return out;
}
