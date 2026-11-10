#!/usr/bin/env node
// SessionStart: inyecta la orientación mínima y el estado del proyecto (≤ 1,5 KB, ADR-0007).
// También guarda el HEAD inicial para el worklog de la sesión.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { activo, contexto, enAbierto, frontmatter, git, leerConfig, leerEntrada, raizProyecto, tmp } from "./lib/comun.mjs";

export const LIMITE = 1500;
export const MAX_LINEAS_CLAUDE_MD = 120;

export function progresoActivo(dirProgreso) {
  if (!existsSync(dirProgreso)) return [];
  return readdirSync(dirProgreso)
    .filter((f) => f.endsWith(".md"))
    .filter((f) => !/^(cerrad|terminad|hecho)/i.test(frontmatter(readFileSync(join(dirProgreso, f), "utf8")).estado || ""))
    .map((f) => f.replace(/\.md$/, ""));
}

export function ultimasEntradas(rutaLog, n = 3) {
  if (!existsSync(rutaLog)) return [];
  return readFileSync(rutaLog, "utf8").split("\n").filter((l) => l.startsWith("* ")).slice(0, n)
    .map((l) => l.replace(/\]\([^)]*\)/g, "]").slice(0, 140));
}

/**
 * Módulos no instalados cuyas señales baratas ya aparecen: .git, un archivo de build o una dependencia en los build
 * (los guardados al instalar, los de la raíz y los submódulos Maven de la raíz). No recorre el proyecto entero.
 */
export function modulosConSenales(raiz, config) {
  const vigilar = config.plan?.vigilar || {};
  if (!Object.keys(vigilar).length) return [];
  const leer = (r) => { try { return readFileSync(join(raiz, r), "utf8"); } catch { return ""; } };
  const raizPom = leer("pom.xml");
  const builds = new Set([...(config.plan.archivosBuild || []), "pom.xml", "build.gradle", "build.gradle.kts",
    ...[...raizPom.matchAll(/<module>([^<]+)<\/module>/g)].map((m) => `${m[1].trim()}/pom.xml`)]);
  let texto;
  const textoBuild = () => (texto ??= [...builds].map(leer).join("\n"));
  return Object.entries(vigilar).filter(([, s]) =>
    (s.git && existsSync(join(raiz, ".git"))) ||
    (s.archivos || []).some((a) => existsSync(join(raiz, a))) ||
    (s.dependencias || []).some((d) => textoBuild().includes(d))).map(([id]) => id);
}

export function construir(raiz, config, origen = "startup") {
  const brain = join(raiz, config.brain || "brain");
  const partes = [];
  const orient = join(raiz, ".mh", "orientacion.md");
  if (existsSync(orient)) partes.push(readFileSync(orient, "utf8").trim());

  const estado = [];
  const rama = git(raiz, ["rev-parse", "--abbrev-ref", "HEAD"]);
  if (rama) {
    const cambios = git(raiz, ["status", "--porcelain"]).split("\n").filter(Boolean).length;
    estado.push(`Rama: ${rama}${cambios ? ` · ${cambios} ${cambios === 1 ? "archivo" : "archivos"} sin commit` : ""}`);
  }
  const activos = progresoActivo(join(brain, "factory", "progreso"));
  if (activos.length) estado.push(`En curso: ${activos.slice(0, 4).join(", ")} (brain/factory/progreso/)`);
  const log = ultimasEntradas(join(brain, "wiki", "log.md"));
  if (log.length) estado.push(`Último en el brain:\n${log.join("\n")}`);

  const avisos = [];
  if (!existsSync(brain)) avisos.push(`No existe ${config.brain || "brain"}/: ejecuta el instalador o crea el brain.`);
  const claudeMd = join(raiz, "CLAUDE.md");
  if (existsSync(claudeMd)) {
    const lineas = readFileSync(claudeMd, "utf8").split("\n").length;
    if (lineas > MAX_LINEAS_CLAUDE_MD) avisos.push(`CLAUDE.md tiene ${lineas} líneas (máx. ${MAX_LINEAS_CLAUDE_MD}): mueve detalle a skills, reglas o al brain.`);
  }
  const nuevos = modulosConSenales(raiz, config);
  if (nuevos.length) avisos.push(`El proyecto ya tiene señales de ${nuevos.join(", ")} (no instalado): propón al usuario ejecutar «mh reevaluar», que no instala nada.`);
  if (origen === "compact") avisos.push("Contexto compactado: relee el progreso en curso antes de seguir.");

  if (estado.length) partes.push(estado.join("\n"));
  if (avisos.length) partes.push(`Avisos: ${avisos.join(" ")}`);
  let texto = partes.join("\n\n");
  if (Buffer.byteLength(texto) > LIMITE) texto = Buffer.from(texto).subarray(0, LIMITE - 3).toString().replace(/�?$/, "") + "…";
  return texto;
}

if (process.argv[1]?.endsWith("sesion-inicio.mjs")) {
  enAbierto(() => {
    const entrada = leerEntrada();
    const raiz = raizProyecto(entrada);
    const config = leerConfig(raiz);
    if (!activo(config, "sesion-inicio", "minimal")) return;
    try {
      writeFileSync(join(tmp(raiz), `sesion-${(entrada.session_id || "x").slice(0, 36)}.json`),
        JSON.stringify({ head: git(raiz, ["rev-parse", "HEAD"]), inicio: new Date().toISOString() }));
    } catch {}
    const texto = construir(raiz, config, entrada.source);
    if (texto) contexto("SessionStart", texto);
  });
}
