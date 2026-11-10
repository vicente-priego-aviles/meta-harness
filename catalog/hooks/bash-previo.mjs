#!/usr/bin/env node
// PreToolUse (Bash): un solo proceso con tres comprobaciones, cada una desactivable por id.
//   peligro       — comandos destructivos → pide confirmación (ask)
//   maven         — mvn/mvnw con objetivos largos → usar el envoltorio mvnq (salida filtrada)
//   puerta-riesgo — push/PR de riesgo 2 sin spec aprobada ni revisión → bloquea
//   convencion-commit — git commit -m que no sigue la convención de .mh.json (git.convencion) → bloquea
//   rama-protegida    — commit directo en una rama de git.ramasProtegidas → bloquea
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { activo, decisionPreTool, enAbierto, frontmatter, git, leerConfig, leerEntrada, raizProyecto } from "./lib/comun.mjs";
import { archivosCambiados, evaluar, ramaBase, textoCambiado } from "../scripts/riesgo.mjs";

export const PELIGROS = [
  [/\brm\s+-[a-z]*r[a-z]*f?[a-z]*\s+(\/|~|\$HOME|\.\.?\/?)(\s|$)/i, "borrado recursivo de una ruta raíz"],
  [/\bgit\s+push\b[^|;&]*\s(--force(?!-with-lease)|-f)\b/, "push forzado (reescribe historia remota)"],
  [/\bgit\s+reset\s+--hard\b/, "reset --hard (pierde cambios sin commit)"],
  [/\bgit\s+clean\s+-[a-z]*f/, "git clean (borra archivos no versionados)"],
  [/\bgit\s+(checkout|restore)\s+(--\s+)?\.(\s|$)/, "descarta todos los cambios locales"],
  [/\bgit\s+branch\s+-D\b/, "borra una rama sin comprobar si está integrada"],
  [/\b(DROP\s+(TABLE|DATABASE|SCHEMA)|TRUNCATE\s+TABLE?)\b/i, "SQL destructivo"],
  [/\bDELETE\s+FROM\s+\w+\s*(;|"|'|$)/i, "DELETE sin WHERE"],
  [/\bdocker\s+(system|volume)\s+prune\b|\bdocker\s+volume\s+rm\b/, "borra volúmenes o datos de Docker"],
  [/\bdocker[- ]compose\b[^|;&]*\bdown\b[^|;&]*(-v|--volumes)\b/, "docker compose down con volúmenes (borra datos)"],
  [/\b(mvnw?|\.\/mvnw)\b[^|;&]*\bdeploy\b/, "publica artefactos (mvn deploy)"],
  [/\bchmod\s+-R\s+777\b/, "permisos 777 recursivos"],
  [/\b(curl|wget)\b[^|]*\|\s*(sudo\s+)?(ba|z)?sh\b/, "ejecuta un script descargado"],
];

export function comprobarPeligro(cmd) {
  const hit = PELIGROS.find(([re]) => re.test(cmd));
  return hit ? `Comando peligroso: ${hit[1]}. Confirma solo si es intencionado.` : null;
}

const MAVEN_RE = /^\s*(\S*[\/\\])?(mvn|mvnw)(?:\.cmd)?\b(.*)$/;
const OBJETIVOS_LARGOS = /\b(test|verify|install|package|integration-test)\b/;

/** Si el comando es Maven con objetivos largos y sin tuberías, devuelve el comando con mvnq. */
export function comprobarMaven(cmd) {
  if (/[|;&`$]|mvnq/.test(cmd)) return null;
  const m = MAVEN_RE.exec(cmd);
  if (!m || !OBJETIVOS_LARGOS.test(m[3])) return null;
  return `node .mh/scripts/mvnq.mjs${m[3]}`;
}

export function specAprobada(dirSpecs, rama) {
  if (!existsSync(dirSpecs)) return false;
  return readdirSync(dirSpecs).filter((f) => f.endsWith(".md")).some((f) => {
    const fm = frontmatter(readFileSync(join(dirSpecs, f), "utf8"));
    return fm.rama === rama && /^aprobad/i.test(fm.estado || "");
  });
}

export function revisionCerrada(dirRev, rama) {
  if (!existsSync(dirRev)) return false;
  return readdirSync(dirRev).filter((f) => f.endsWith(".md")).some((f) => {
    const fm = frontmatter(readFileSync(join(dirRev, f), "utf8"));
    return fm.rama === rama && /^(aprobad|cerrad)/i.test(fm.resultado || fm.estado || "");
  });
}

export function comprobarRiesgo(cmd, raiz, config) {
  if (!/\bgit\s+push\b|\bgh\s+pr\s+(create|merge)\b|\bglab\s+mr\s+(create|merge)\b/.test(cmd)) return null;
  const base = ramaBase(raiz);
  const rama = git(raiz, ["rev-parse", "--abbrev-ref", "HEAD"]);
  if (!rama || rama === "HEAD") return null;
  const { nivel, archivos } = evaluar(archivosCambiados(raiz, base), config, (r) => textoCambiado(raiz, base, r));
  if (nivel < 2) return null;
  const factory = join(raiz, config.brain || "brain", "factory");
  const faltan = [];
  if (!specAprobada(join(factory, "specs"), rama)) faltan.push(`una spec en brain/factory/specs/ con «rama: ${rama}» y «estado: aprobada»`);
  if (!revisionCerrada(join(factory, "revisiones"), rama)) faltan.push(`una revisión en brain/factory/revisiones/ con «rama: ${rama}» y «resultado: aprobada»`);
  if (!faltan.length) return null;
  const ejemplos = archivos.filter((a) => a.nivel === 2).slice(0, 5).map((a) => `${a.ruta} (${a.motivo})`).join("; ");
  return `Riesgo 2 (${ejemplos}). Antes de push/PR falta ${faltan.join(" y ")}. Sigue el carril ASDD (skill asdd) y la skill revision. Si crees que la tabla de riesgo se equivoca, díselo al usuario: se ajusta en .mh.json.`;
}

export const TIPOS = "feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert";
const RE_CONVENTIONAL = new RegExp(`^(${TIPOS})(\\([^)\\n]+\\))?!?: \\S.*`, "u");
const RE_GITMOJI = new RegExp(`^\\p{Extended_Pictographic}\\uFE0F?\\s(${TIPOS})(\\([^)\\n]+\\))?!?: \\S.*`, "u");

/** Primer mensaje de `git commit -m "…"` / `-m '…'`; null si no se puede leer con seguridad. */
export function mensajeCommit(cmd) {
  if (!/\bgit\s+commit\b/.test(cmd) || /--no-edit|\s-F\s|--file[=\s]|--fixup|--squash/.test(cmd)) return null;
  const m = /\s(?:-m|--message)(?:=|\s+)(?:"((?:[^"\\]|\\.)*)"|'([^']*)')/.exec(cmd);
  if (!m) return null;
  const msg = (m[1] ?? m[2]).replace(/\\"/g, '"');
  return msg.startsWith("$(") ? null : msg.split("\n")[0];
}

export function comprobarConvencion(cmd, convencion) {
  if (!convencion) return null;
  const msg = mensajeCommit(cmd);
  if (msg === null || /^(Merge|Revert) /.test(msg)) return null;
  const ok = convencion === "conventional-gitmoji" ? RE_GITMOJI.test(msg) : RE_CONVENTIONAL.test(msg);
  if (ok) return null;
  const ejemplo = convencion === "conventional-gitmoji" ? "🐛 fix(pagos): corregir la compensación duplicada" : "fix(pagos): corregir la compensación duplicada";
  return `El mensaje «${msg.slice(0, 80)}» no sigue la convención del proyecto (${convencion}). Formato: <tipo>(<ámbito>): <descripción>, tipos ${TIPOS.replace(/\|/g, ", ")}. Ejemplo: ${ejemplo}. Detalle: skill git.`;
}

export function comprobarRamaProtegida(cmd, raiz, protegidas = []) {
  if (!protegidas.length || !/\bgit\s+commit\b/.test(cmd)) return null;
  const rama = git(raiz, ["rev-parse", "--abbrev-ref", "HEAD"]);
  if (!protegidas.includes(rama)) return null;
  if (git(raiz, ["rev-parse", "-q", "--verify", "MERGE_HEAD"])) return null; // cerrar un merge está permitido
  return `Estás en «${rama}», una rama protegida del proyecto: no se hace commit directo. Crea una rama con el formato del proyecto (skill git) y abre un PR. Si el usuario lo pide expresamente, puede desactivarse con MH_DESACTIVAR=rama-protegida.`;
}

if (process.argv[1]?.endsWith("bash-previo.mjs")) {
  enAbierto(() => {
    const entrada = leerEntrada();
    const cmd = entrada?.tool_input?.command || "";
    if (!cmd) return;
    const raiz = raizProyecto(entrada);
    const config = leerConfig(raiz);
    if (activo(config, "peligro", "minimal")) {
      const motivo = comprobarPeligro(cmd);
      if (motivo) decisionPreTool("ask", motivo);
    }
    if (activo(config, "puerta-riesgo")) {
      const motivo = comprobarRiesgo(cmd, raiz, config);
      if (motivo) decisionPreTool("deny", motivo);
    }
    if (activo(config, "rama-protegida")) {
      const motivo = comprobarRamaProtegida(cmd, raiz, config.git?.ramasProtegidas);
      if (motivo) decisionPreTool("deny", motivo);
    }
    if (activo(config, "convencion-commit")) {
      const motivo = comprobarConvencion(cmd, config.git?.convencion);
      if (motivo) decisionPreTool("deny", motivo);
    }
    if (activo(config, "maven")) {
      const alternativa = comprobarMaven(cmd);
      if (alternativa) decisionPreTool("deny", `Usa la salida filtrada (ahorra tokens; el log completo queda en .mh/tmp/): ${alternativa}`);
    }
  });
}
