#!/usr/bin/env node
// Envoltorio de Maven con salida filtrada: muestra errores, fallos de test y el resumen;
// guarda el log completo en .mh/tmp/mvn-ultimo.log. Conserva el código de salida.
// Uso: node .mh/scripts/mvnq.mjs <objetivos y opciones de Maven>
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const MAX_LINEAS = 80;
const CONSERVAR = [
  /^\[ERROR\]/, /\bFAIL(ED|URE)?\b/, /^\[WARNING\] .*(deprecat|unchecked)/i,
  /Tests run:.*(Failures: [1-9]|Errors: [1-9])/, /^(\[(INFO|WARNING|ERROR)\] )?Tests run: \d+, Failures: \d+, Errors: \d+, Skipped: \d+$/, /Tests run:.*Time elapsed.*<<</,
  /^\s+at [\w.$]+\(.*\)$/, /BUILD (SUCCESS|FAILURE)/, /^\[INFO\] Reactor Summary/, /^\[INFO\] .* (SUCCESS|FAILURE|SKIPPED) \[/,
  /Total time:/, /^Caused by:/, /expected:|but was:/, /COMPILATION ERROR/,
];

// Ruido que casa con lo anterior pero no dice nada del código: avisos de configuración de plugins y la ayuda genérica de Maven.
const DESCARTAR = [
  /^\[WARNING\]\s+Parameter '.*' is deprecated/, /Unknown keyword/,
  /^\[ERROR\]\s*$/, /-> \[Help \d+\]/, /\[Help \d+\] http/, /Re-run Maven using/, /re-run Maven with the -e switch/,
  /For more information about the errors and possible solutions/, /See dump files/,
];

/** Filtra la salida de Maven. Limita las trazas a 3 líneas `at …` seguidas. */
export function filtrar(texto) {
  const out = [];
  let trazas = 0;
  for (const linea of texto.split("\n")) {
    const l = linea.replace(/\x1b\[[0-9;]*m/g, "");
    if (!CONSERVAR.some((re) => re.test(l)) || DESCARTAR.some((re) => re.test(l))) { trazas = 0; continue; }
    if (/^\s+at /.test(l)) { if (++trazas > 3) continue; } else trazas = 0;
    if (out[out.length - 1] !== l) out.push(l);
  }
  if (out.length > MAX_LINEAS) {
    const omitidas = out.length - MAX_LINEAS;
    return [...out.slice(0, MAX_LINEAS - 10), `… (${omitidas} líneas omitidas)`, ...out.slice(-10)].join("\n");
  }
  return out.join("\n");
}

function main() {
  const args = process.argv.slice(2);
  const raiz = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const win = process.platform === "win32";
  const wrapper = win ? "mvnw.cmd" : "mvnw";
  const mvn = existsSync(join(process.cwd(), wrapper)) ? (win ? wrapper : "./mvnw") : existsSync(join(raiz, wrapper)) ? join(raiz, wrapper) : win ? "mvn.cmd" : "mvn";
  const dir = join(raiz, ".mh", "tmp");
  try { mkdirSync(dir, { recursive: true }); if (!existsSync(join(dir, ".gitignore"))) writeFileSync(join(dir, ".gitignore"), "*\n"); } catch {}
  const log = join(dir, "mvn-ultimo.log");
  // En Windows los .cmd solo se pueden lanzar a través del intérprete de comandos
  const hijo = spawn(mvn, ["-B", "-ntp", ...args], { stdio: ["ignore", "pipe", "pipe"], shell: win });
  let todo = "";
  hijo.stdout.on("data", (d) => (todo += d));
  hijo.stderr.on("data", (d) => (todo += d));
  hijo.on("error", (e) => { console.error(`No se pudo ejecutar ${mvn}: ${e.message}`); process.exit(127); });
  hijo.on("close", (codigo) => {
    try { writeFileSync(log, todo); } catch {}
    const filtrado = filtrar(todo);
    const n = todo.split("\n").length;
    console.log(filtrado || "(sin errores ni resumen en la salida)");
    console.log(`\n[mvnq] ${mvn} ${args.join(" ")} → código ${codigo}. Log completo (${n} líneas): .mh/tmp/mvn-ultimo.log`);
    process.exit(codigo ?? 1);
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) main();
